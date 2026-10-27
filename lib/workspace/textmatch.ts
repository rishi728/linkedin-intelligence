// Free-text matching for people: whole words (so "hr" never finds "Anthropic"), the
// abbreviations people actually type, partial words as a fallback, and typo correction
// that only kicks in when nothing else matched. No dependency on the filter code.

import type { CompanyOption } from "./engine";
import type { Person } from "./types";

// ---------------------------------------------------------------------------
// Text handling

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}&+ ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOPWORDS = new Set([
  "a", "an", "and", "at", "by", "for", "from", "in", "is", "of", "on", "or", "the", "to", "who", "with", "are",
  "me", "my", "find", "show", "anyone", "someone", "people", "person", "persons", "folks", "connections", "all",
  "working", "work", "ex", "former", "currently",
]);

/** What people type, and what it means in a job title. Each alternative is a whole phrase. */
const SYNONYMS: Record<string, string[]> = {
  pm: ["product manager", "product management", "pm"],
  apm: ["associate product manager", "apm"],
  pmm: ["product marketing", "pmm"],
  sde: ["software engineer", "software developer", "sde", "swe"],
  swe: ["software engineer", "software developer", "swe", "sde"],
  dev: ["developer", "engineer", "software"],
  eng: ["engineer", "engineering"],
  engg: ["engineer", "engineering"],
  mgr: ["manager"],
  hr: ["hr", "human resources", "recruiter", "recruiting", "talent"],
  ta: ["talent acquisition", "recruiter"],
  ceo: ["ceo", "chief executive"],
  cto: ["cto", "chief technology"],
  cfo: ["cfo", "chief financial"],
  coo: ["coo", "chief operating"],
  cmo: ["cmo", "chief marketing"],
  cxo: ["chief", "ceo", "cto", "cfo", "coo", "cmo"],
  vp: ["vp", "vice president"],
  svp: ["svp", "senior vice president"],
  md: ["md", "managing director"],
  gm: ["gm", "general manager"],
  ds: ["data scientist", "data science"],
  da: ["data analyst"],
  de: ["data engineer"],
  ml: ["ml", "machine learning"],
  ai: ["ai", "artificial intelligence", "machine learning"],
  ux: ["ux", "ui", "design", "designer"],
  ui: ["ui", "ux", "design", "designer"],
  bd: ["bd", "business development"],
  ba: ["business analyst"],
  csm: ["customer success"],
  cs: ["customer success", "customer support"],
  ops: ["operations", "ops"],
  fin: ["finance", "financial"],
  mktg: ["marketing"],
  exec: ["executive"],
  intern: ["intern", "internship", "trainee"],
  founder: ["founder", "cofounder", "co founder", "founding"],
  cofounder: ["cofounder", "co founder", "founder"],
  recruiter: ["recruiter", "recruiting", "talent acquisition", "talent"],
  consultant: ["consultant", "consulting", "advisor"],
  student: ["student", "undergraduate", "mba candidate"],
  prof: ["professor"],
  // The same word in its other common form, so a whole-word search is not too strict.
  engineer: ["engineer", "engineering"],
  engineering: ["engineering", "engineer"],
  manager: ["manager", "management"],
  management: ["management", "manager"],
  designer: ["designer", "design"],
  developer: ["developer", "development"],
  analyst: ["analyst", "analytics", "analysis"],
  analytics: ["analytics", "analyst"],
  marketer: ["marketer", "marketing"],
  marketing: ["marketing", "marketer"],
  scientist: ["scientist", "science"],
  sales: ["sales", "salesperson"],
};

export interface Tokens {
  /** Significant words, normalised. */
  words: string[];
  /** For each word, the phrases it can stand for (always includes the word itself). */
  groups: string[][];
}

export function tokenizeQuery(q: string): Tokens {
  const all = norm(q).split(" ").filter(Boolean);
  const significant = all.filter((w) => !STOPWORDS.has(w));
  const words = significant.length ? significant : all;
  return { words, groups: words.map((w) => [...new Set([w, ...(SYNONYMS[w] ?? [])])]) };
}

// ---------------------------------------------------------------------------
// Matching and scoring

interface Fields {
  name: string;
  title: string;
  role: string;
  company: string;
  past: string;
  other: string;
}

/** Wrapped in spaces so a whole word is " word " and a word start is " wo". Cached per person. */
const fieldCache = new WeakMap<Person, Fields>();

function fieldsOf(p: Person): Fields {
  let f = fieldCache.get(p);
  if (f) return f;
  const w = (s: string) => ` ${norm(s)} `;
  f = {
    name: w(p.name),
    title: w(p.position),
    role: w(`${p.roleFamily} ${p.category} ${p.secondCategory ?? ""}`),
    company: w(p.company),
    past: w(p.pastCompanies.join(" ")),
    other: w([p.location, p.notes, ...p.tags, p.sector ?? ""].join(" ")),
  };
  fieldCache.set(p, f);
  return f;
}

/**
 * Builds the search index for everyone in small slices, so the first search after opening the
 * bar does not pay for it all at once. Safe to call repeatedly; people already indexed are skipped.
 */
export function warmSearchIndex(people: Person[]): () => void {
  let i = 0;
  let cancelled = false;
  const step = () => {
    if (cancelled) return;
    const end = Math.min(i + 1500, people.length);
    for (; i < end; i++) fieldsOf(people[i]);
    if (i < people.length) setTimeout(step, 0);
  };
  setTimeout(step, 0);
  return () => {
    cancelled = true;
  };
}

const companyNames = new WeakMap<CompanyOption, string>();

/** A company name in the same wrapped, normalised form as the people fields. Cached. */
export function companyField(c: CompanyOption): string {
  let n = companyNames.get(c);
  if (n === undefined) {
    n = ` ${norm(c.name)} `;
    companyNames.set(c, n);
  }
  return n;
}

// [field, whole word, word start, partial]
const WEIGHTS: Array<[keyof Fields, number, number, number]> = [
  ["name", 12, 10, 5],
  ["title", 8, 7, 4],
  ["role", 6, 5, 3],
  ["company", 6, 5, 3],
  ["past", 3, 2, 1.5],
  ["other", 2, 1, 1],
];

/** whole: only complete words. start: also the beginning of a word. partial: also the middle of one. */
export type MatchMode = "whole" | "start" | "partial";

function tokenScore(f: Fields, alts: string[], mode: MatchMode): number {
  let best = 0;
  for (const alt of alts) {
    const start = ` ${alt}`;
    const whole = ` ${alt} `;
    for (const [field, wholeW, startW, partialW] of WEIGHTS) {
      const hay = f[field];
      if (hay.includes(whole)) best = Math.max(best, wholeW);
      else if (mode !== "whole" && hay.includes(start)) best = Math.max(best, startW);
      else if (mode === "partial" && alt.length >= 3 && hay.includes(alt)) best = Math.max(best, partialW);
    }
  }
  return best;
}

/**
 * Scores a person against a query: 0 means no match. Every word must match somewhere.
 * Search tries "whole" first, then "start", then "partial", stopping at the first that finds anyone.
 */
export function makeTextMatcher(q: string, mode: MatchMode = "start"): ((p: Person) => number) | null {
  const { words, groups } = tokenizeQuery(q);
  if (!words.length) return null;
  const phrase = words.length > 1 ? ` ${words.join(" ")}` : "";
  return (p) => {
    const f = fieldsOf(p);
    let total = 0;
    for (const alts of groups) {
      const s = tokenScore(f, alts, mode);
      if (!s) return 0;
      total += s;
    }
    if (phrase) {
      if (f.name.includes(phrase)) total += 10;
      if (f.title.includes(phrase)) total += 6;
      if (f.company.includes(phrase)) total += 6;
    }
    return total;
  };
}

/**
 * How well a person reads like the query, for ordering results that already passed a filter.
 * Unlike the matcher, a word that matches nothing just adds nothing instead of excluding the person.
 */
export function makeRanker(q: string): ((p: Person) => number) | null {
  const { words, groups } = tokenizeQuery(q);
  if (!words.length) return null;
  const phrase = words.length > 1 ? ` ${words.join(" ")}` : "";
  return (p) => {
    const f = fieldsOf(p);
    let total = 0;
    for (const alts of groups) total += tokenScore(f, alts, "partial");
    if (phrase) {
      if (f.name.includes(phrase)) total += 10;
      if (f.title.includes(phrase)) total += 6;
      if (f.company.includes(phrase)) total += 6;
    }
    return total;
  };
}

/** A single abbreviation such as "hr" or "pm" means a job title, not an area of the taxonomy. */
export function isAbbreviation(q: string): boolean {
  const { words } = tokenizeQuery(q);
  return words.length === 1 && words[0] in SYNONYMS;
}

/** True when every word of the query starts a word in the person's name. */
export function nameMatches(p: Person, words: string[]): boolean {
  const name = fieldsOf(p).name;
  return words.length > 0 && words.every((w) => name.includes(` ${w}`));
}

// ---------------------------------------------------------------------------
// Typos

const vocabCache = new WeakMap<object, Map<string, number>>();

function vocabulary(people: Person[], companies: CompanyOption[]): Map<string, number> {
  let v = vocabCache.get(people);
  if (v) return v;
  v = new Map();
  const add = (s: string, weight = 1) => {
    for (const w of norm(s).split(" ")) if (w.length >= 3) v!.set(w, (v!.get(w) ?? 0) + weight);
  };
  for (const c of companies) add(c.name, 2 + Math.min(c.count, 50));
  for (const p of people) {
    add(p.position);
    add(p.name);
    add(p.roleFamily);
  }
  vocabCache.set(people, v);
  return v;
}

/** Optimal-string-alignment distance (an adjacent swap counts as one edit), with an early exit. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, prev2[j - 2] + 1);
      cur[j] = d;
      if (d < rowMin) rowMin = d;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

/** "googel founder" becomes "google founder" when "googel" is nowhere in the data. */
export function correctTypos(q: string, people: Person[], companies: CompanyOption[]): string | null {
  const vocab = vocabulary(people, companies);
  const tokens = norm(q).split(" ").filter(Boolean);
  let changed = false;
  const fixed = tokens.map((w) => {
    if (w.length < 4 || STOPWORDS.has(w) || SYNONYMS[w] || vocab.has(w)) return w;
    const max = w.length >= 8 ? 2 : 1;
    let best: string | null = null;
    let bestD = max + 1;
    let bestCount = 0;
    for (const [cand, count] of vocab) {
      if (cand[0] !== w[0]) continue;
      const d = editDistance(w, cand, max);
      if (d < bestD || (d === bestD && d <= max && count > bestCount)) {
        best = cand;
        bestD = d;
        bestCount = count;
      }
    }
    if (best && bestD <= max) {
      changed = true;
      return best;
    }
    return w;
  });
  return changed ? fixed.join(" ") : null;
}

