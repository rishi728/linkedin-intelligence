import {
  CATEGORIES, CATEGORY_IDS, CATEGORY_MAP, DOMAIN_CAPS, SENIORITY_RULES, TAGS,
  type CategoryId, type Seniority, type TagId,
} from "./taxonomy";
import { cleanField, editDistance, splitSegments, tokenize } from "./text";

export type Confidence = "high" | "medium" | "low";
/** What decided the category: the title itself, the employer, or a typo-tolerant title match. */
export type Basis = "title" | "company" | "fuzzy" | "none";

export interface Classification {
  category: CategoryId;
  confidence: Confidence;
  basis: Basis;
  /** Words that pushed the winning category, e.g. ["recruiter", "company: google"]. */
  reasons: string[];
  /** Runner-up category, when there was one. */
  alternative: CategoryId | null;
  /** Category suggested by the employer name alone, used to infer industry. */
  companyCategory: CategoryId | null;
  seniority: Seniority;
  tags: TagId[];
}

// ---------------------------------------------------------------------------
// Phrase index

export interface Entry<T> {
  tokens: string[];
  phrase: string;
  value: T;
}
export type PhraseIndex<T> = Map<string, Entry<T>[]>;

export function addEntry<T>(index: PhraseIndex<T>, tokens: string[], make: () => T, merge: (v: T) => void) {
  const phrase = tokens.join(" ");
  const bucket = index.get(tokens[0]) ?? [];
  const existing = bucket.find((e) => e.phrase === phrase);
  if (existing) {
    merge(existing.value);
    return;
  }
  const value = make();
  merge(value);
  bucket.push({ tokens, phrase, value });
  index.set(tokens[0], bucket);
}

/** Non-overlapping matches, longest phrases first. */
export function matchPhrases<T>(tokens: string[], index: PhraseIndex<T>): Entry<T>[] {
  const found: Array<{ start: number; entry: Entry<T> }> = [];
  for (let i = 0; i < tokens.length; i++) {
    for (const entry of index.get(tokens[i]) ?? []) {
      const len = entry.tokens.length;
      if (i + len > tokens.length) continue;
      let ok = true;
      for (let k = 1; k < len; k++) {
        if (tokens[i + k] !== entry.tokens[k]) { ok = false; break; }
      }
      if (ok) found.push({ start: i, entry });
    }
  }
  found.sort((a, b) => b.entry.tokens.length - a.entry.tokens.length || a.start - b.start);
  const used = new Array<boolean>(tokens.length).fill(false);
  const out: Entry<T>[] = [];
  for (const { start, entry } of found) {
    const len = entry.tokens.length;
    let free = true;
    for (let k = 0; k < len; k++) if (used[start + k]) { free = false; break; }
    if (!free) continue;
    for (let k = 0; k < len; k++) used[start + k] = true;
    out.push(entry);
  }
  return out;
}

type Weights = Map<CategoryId, number>;

const TIER_WEIGHTS = { s: 10, m: 6, w: 3, x: 1.5, cs: 5, cm: 3.5, cw: 2 } as const;

const DOMAIN_CAP_BY_PHRASE = new Map(
  Object.entries(DOMAIN_CAPS).map(([phrase, cap]) => [tokenize(phrase).join(" "), cap]),
);

function buildIndexes() {
  const title: PhraseIndex<Weights> = new Map();
  const company: PhraseIndex<Weights> = new Map();

  for (const cat of CATEGORIES) {
    for (const tier of ["s", "m", "w", "x", "cs", "cm", "cw"] as const) {
      const isCompany = tier.startsWith("c");
      for (const rule of cat[tier] ?? []) {
        const m = /^(.*?)(?::(\d+(?:\.\d+)?))?$/.exec(rule)!;
        const tokens = tokenize(m[1]);
        if (!tokens.length) continue;
        // A multi-word rule that collapses to a tiny token ("B. Des" → "b") would match noise.
        if (/\s/.test(m[1].trim()) && tokens.length === 1 && tokens[0].length <= 2) continue;
        let weight = m[2] ? Number(m[2]) : TIER_WEIGHTS[tier];
        if (!isCompany) {
          const cap = DOMAIN_CAP_BY_PHRASE.get(tokens.join(" "));
          if (cap !== undefined) weight = Math.min(weight, cap);
        }
        addEntry(isCompany ? company : title, tokens, () => new Map(), (v) => {
          v.set(cat.id, Math.max(v.get(cat.id) ?? 0, weight));
        });
      }
    }
  }

  const seniority: PhraseIndex<{ level: Seniority | null; rank: number }> = new Map();
  SENIORITY_RULES.forEach(({ level, phrases }, rank) => {
    for (const p of phrases) {
      const tokens = tokenize(p);
      if (tokens.length) addEntry(seniority, tokens, () => ({ level, rank }), () => {});
    }
  });

  // Single-word title vocabulary for typo-tolerant matching ("enginner", "recuiter").
  const vocabulary = [...title.values()]
    .flat()
    .filter((e) => e.tokens.length === 1 && e.phrase.length >= 5 && /^[a-z]+$/.test(e.phrase));

  const tags = TAGS.map((t) => ({
    id: t.id,
    companies: (t.companies ?? []).map(tokenize).filter((x) => x.length),
    exclude: (t.exclude ?? []).map(tokenize).filter((x) => x.length),
    titlePhrases: (t.titlePhrases ?? []).map(tokenize).filter((x) => x.length),
  }));

  return { title, company, seniority, vocabulary, tags };
}

let indexes: ReturnType<typeof buildIndexes> | null = null;
function getIndexes() {
  return (indexes ??= buildIndexes());
}

// ---------------------------------------------------------------------------
// Scoring

const COMPANY_CAP = 5.5;
const ASPIRING = new Set(tokenize("aspiring future wannabe budding upcoming"));
const PRIORITY = new Map(CATEGORY_IDS.map((id, i) => [id, i]));

function addScore(scores: Weights, reasons: Map<CategoryId, string[]>, weights: Weights, factor: number, label: string) {
  for (const [cat, w] of weights) {
    scores.set(cat, (scores.get(cat) ?? 0) + w * factor);
    const list = reasons.get(cat) ?? [];
    if (!list.includes(label)) list.push(label);
    reasons.set(cat, list);
  }
}

function containsSequence(tokens: string[], seq: string[]): boolean {
  outer: for (let i = 0; i + seq.length <= tokens.length; i++) {
    for (let k = 0; k < seq.length; k++) if (tokens[i + k] !== seq[k]) continue outer;
    return true;
  }
  return false;
}

function startsWithSequence(tokens: string[], seq: string[]): boolean {
  if (seq.length > tokens.length) return false;
  return seq.every((t, k) => tokens[k] === t);
}

function fuzzyScores(tokens: string[], idx: ReturnType<typeof getIndexes>) {
  const scores: Weights = new Map();
  const reasons = new Map<CategoryId, string[]>();
  for (const token of tokens) {
    if (token.length < 5 || !/^[a-z]+$/.test(token)) continue;
    const maxDist = token.length < 10 ? 1 : 2;
    let best = Infinity;
    let hits: Entry<Weights>[] = [];
    for (const v of idx.vocabulary) {
      if (v.phrase[0] !== token[0]) continue;
      let d: number;
      if (v.phrase.startsWith(token) && v.phrase.length - token.length <= 4) d = 1;
      else if (token.startsWith(v.phrase) && token.length - v.phrase.length <= 3) d = 1;
      else d = editDistance(token, v.phrase, maxDist);
      if (d > maxDist) continue;
      if (d < best) { best = d; hits = [v]; } else if (d === best) hits.push(v);
    }
    for (const h of hits) addScore(scores, reasons, h.value, 0.5, `${token} ≈ ${h.phrase}`);
  }
  return { scores, reasons };
}

function detectSeniority(position: string, idx: ReturnType<typeof getIndexes>): Seniority {
  if (!position) return "Unknown";
  const segments = splitSegments(position).filter((s) => s.weight >= 0.7);
  for (const seg of segments) {
    const matches = matchPhrases(tokenize(seg.title), idx.seniority)
      .filter((m) => m.value.level !== null)
      .sort((a, b) => a.value.rank - b.value.rank);
    if (matches.length) return matches[0].value.level!;
  }
  return "Mid-level";
}

function detectTags(position: string, companyTokenSets: string[][], idx: ReturnType<typeof getIndexes>): TagId[] {
  const titleTokens = tokenize(position);
  const out: TagId[] = [];
  for (const tag of idx.tags) {
    const byCompany = companyTokenSets.some((ct) =>
      tag.companies.some((c) => startsWithSequence(ct, c) || (tag.id === "yc" && containsSequence(ct, c))) &&
      !tag.exclude.some((e) => containsSequence(ct, e)),
    );
    const byTitle = tag.titlePhrases.some((p) => containsSequence(titleTokens, p));
    if (byCompany || byTitle) out.push(tag.id);
  }
  return out;
}

export function classify(rawPosition: string, rawCompany: string): Classification {
  const idx = getIndexes();
  const position = cleanField(rawPosition);
  const company = cleanField(rawCompany);

  const titleScores: Weights = new Map();
  const companyScores: Weights = new Map();
  const reasons = new Map<CategoryId, string[]>();
  const companyTokenSets: string[][] = [];
  if (company) companyTokenSets.push(tokenize(company));

  for (const seg of position ? splitSegments(position) : []) {
    const tokens = tokenize(seg.title);
    // "Aspiring Data Scientist" is someone preparing for that role, usually a
    // student or new grad: the function counts for half and Students gets a boost.
    const aspiring = ASPIRING.has(tokens[0]);
    const weight = aspiring ? seg.weight * 0.5 : seg.weight;
    if (aspiring) addScore(titleScores, reasons, new Map([["students", 6]]), seg.weight, tokens[0]);
    for (const entry of matchPhrases(aspiring ? tokens.slice(1) : tokens, idx.title)) {
      addScore(titleScores, reasons, entry.value, weight, entry.phrase);
    }
    // "Chief <anything> Officer" is always an executive title.
    if (tokens.includes("chief") && tokens.includes("officer") && !tokens.includes("happiness")) {
      addScore(titleScores, reasons, new Map([["executives", 14]]), seg.weight, "chief … officer");
    }
    if (seg.inlineCompany) {
      const ct = tokenize(seg.inlineCompany);
      companyTokenSets.push(ct);
      for (const entry of matchPhrases(ct, idx.company)) {
        addScore(companyScores, reasons, entry.value, 0.8 * seg.weight, `company: ${entry.phrase}`);
      }
    }
  }
  if (company) {
    for (const entry of matchPhrases(companyTokenSets[0], idx.company)) {
      addScore(companyScores, reasons, entry.value, 1, `company: ${entry.phrase}`);
    }
  }

  let basis: Basis = titleScores.size ? "title" : "none";
  let fuzzyUsed = false;
  if (!titleScores.size && position) {
    const fz = fuzzyScores(tokenize(position), idx);
    for (const [cat, s] of fz.scores) titleScores.set(cat, s);
    for (const [cat, r] of fz.reasons) reasons.set(cat, [...(reasons.get(cat) ?? []), ...r]);
    fuzzyUsed = fz.scores.size > 0;
  }

  const total: Weights = new Map(titleScores);
  for (const [cat, s] of companyScores) total.set(cat, (total.get(cat) ?? 0) + Math.min(s, COMPANY_CAP));

  const ranked = [...total.entries()]
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1] || PRIORITY.get(a[0])! - PRIORITY.get(b[0])!);

  const seniority = detectSeniority(position, idx);
  const tags = detectTags(position, companyTokenSets, idx);
  const companyCategory =
    [...companyScores.entries()].sort((a, b) => b[1] - a[1] || PRIORITY.get(a[0])! - PRIORITY.get(b[0])!)[0]?.[0] ?? null;

  if (!ranked.length) {
    return { category: "unspecified", confidence: "low", basis: "none", reasons: [], alternative: null, companyCategory, seniority, tags };
  }

  const [category, top] = ranked[0];
  const second = ranked[1]?.[1] ?? 0;
  if (fuzzyUsed) basis = "fuzzy";
  else if (!titleScores.size) basis = "company";

  let confidence: Confidence;
  if (basis !== "title") confidence = "low";
  else if (top >= 8 && second <= top * 0.6) confidence = "high";
  else if (top >= 5 && second < top) confidence = "medium";
  else confidence = "low";

  return {
    category,
    confidence,
    basis,
    reasons: reasons.get(category) ?? [],
    alternative: ranked[1]?.[0] ?? null,
    companyCategory,
    seniority,
    tags,
  };
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORY_MAP[id].label;
}
