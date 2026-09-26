// Turning a raw LinkedIn title into a role and a sector.
//
// The raw title is never modified. What comes out of here sits beside it.
//
// Matching is phrase-based rather than keyword-based, and the longest phrase
// wins, which is what stops "AI Product Manager" being read as AI and "Technical
// Recruiter" as engineering. Where a title is genuinely ambiguous, the contextual
// rules below decide it on other evidence, and when nothing decides it the result
// is low confidence rather than a guess dressed up as an answer.

import { ROLE_BUCKETS, type RolePath } from "./roles";
import { classifySector, type SectorId } from "./sectors";

export type Confidence = "high" | "medium" | "low";

export interface Classification {
  bucketId: string | null;
  sectionId: string | null;
  roleId: string | null;
  sector: SectorId | null;
  confidence: Confidence;
  /** Why this classification was made, in plain words. */
  evidence: string[];
}

// ---------------------------------------------------------------------------
// Normalising

/** Words that describe how senior somebody is. They never decide what they do. */
const LEVEL_WORDS = new Set([
  "senior", "sr", "junior", "jr", "assistant", "asst", "associate", "lead", "principal", "staff",
  "chief", "head", "deputy", "trainee", "intern", "apprentice", "fresher", "entry", "level",
  "i", "ii", "iii", "iv", "1", "2", "3", "4", "grade", "band", "designate", "acting", "interim",
  "global", "regional", "national", "country", "group", "corporate", "general", "executive",
]);

const ABBREVIATIONS: Array<[RegExp, string]> = [
  [/\bsr\.?\b/g, "senior"],
  [/\bjr\.?\b/g, "junior"],
  [/\basst\.?\b/g, "assistant"],
  [/\bmgr\.?\b/g, "manager"],
  [/\bengg?\.?\b/g, "engineer"],
  [/\bdev\b/g, "developer"],
  [/\bexec\.?\b/g, "executive"],
  [/\bspec\.?\b/g, "specialist"],
  [/\bcons\.?\b/g, "consultant"],
  [/\bopse?\b/g, "operations"],
  [/\bhr\b/g, "hr"],
];

export function normaliseTitle(title: string): string {
  let t = (title ?? "")
    .toLowerCase()
    .replace(/[‘’ʼ'`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/[-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const [from, to] of ABBREVIATIONS) t = t.replace(from, to);
  return t.replace(/\s+/g, " ").trim();
}

/** The title with level words taken out, which is what the role is really about. */
function contentOf(normalised: string): string {
  return normalised
    .split(" ")
    .filter((w) => !LEVEL_WORDS.has(w))
    .join(" ");
}

// ---------------------------------------------------------------------------
// The alias index

interface AliasEntry {
  phrase: string;
  words: number;
  path: RolePath;
  /** The role names a field, not a job, so it can never be high confidence. */
  broad: boolean;
}

const ALIAS_INDEX: AliasEntry[] = [];

for (const bucket of ROLE_BUCKETS) {
  for (const section of bucket.sections) {
    for (const role of section.roles) {
      const path: RolePath = {
        bucketId: bucket.id,
        bucketLabel: bucket.label,
        sectionId: section.id,
        sectionLabel: section.label,
        roleId: role.id,
        roleLabel: role.label,
      };
      for (const alias of role.aliases) {
        const phrase = normaliseTitle(alias);
        if (!phrase) continue;
        ALIAS_INDEX.push({ phrase, words: phrase.split(" ").length, path, broad: !!role.broad });
      }
    }
  }
}

// Longest phrases first, so a specific alias always beats a shorter one inside it.
ALIAS_INDEX.sort((a, b) => b.words - a.words || b.phrase.length - a.phrase.length);

/** Every word of the phrase is somewhere in the title, in any order. */
const coversWords = (words: Set<string>, phrase: string) => {
  const parts = phrase.split(" ");
  return parts.length >= 2 && parts.every((w) => words.has(w));
};

const contains = (haystack: string, phrase: string) =>
  haystack === phrase ||
  haystack.startsWith(`${phrase} `) ||
  haystack.endsWith(` ${phrase}`) ||
  haystack.includes(` ${phrase} `);

// ---------------------------------------------------------------------------
// Contextual rules
//
// Each one covers a title that plain phrase matching reads wrongly, because a
// word in it belongs to a different line of work than the job itself.

interface ContextRule {
  id: string;
  when: RegExp;
  /** Cancels the rule when the person really is the other thing. */
  unless?: RegExp;
  roleId: string;
  why: string;
}

const CONTEXT_RULES: ContextRule[] = [
  {
    id: "founders-office",
    when: /\b(founders?\s+office|office\s+of\s+the\s+founder|founders?\s+associate|founder\s+associate|chief\s+of\s+staff|ceos?\s+office|office\s+of\s+the\s+ceo)\b/,
    roleId: "founders-office",
    why: "Works in a founder's office, which is a business role rather than founding the company",
  },
  {
    id: "technical-recruiter",
    when: /\b(technical|tech|it|engineering)\s+recruit(er|ment)\b/,
    roleId: "technical-recruiter",
    why: "Recruits for technical roles, which is recruitment rather than engineering",
  },
  {
    id: "recruiter",
    when: /\b(recruit(er|ment|ing)|talent\s+acquisition|staffing|headhunt)/,
    unless: /\b(recruitment\s+marketing|employer\s+brand)\b/,
    roleId: "recruiter",
    why: "Recruitment is named in the title",
  },
  {
    id: "ai-product-manager",
    when: /\b(ai|ml|machine\s+learning|data|genai|generative\s+ai)\b[\s\w]*\bproduct\s+(manager|owner|lead)\b/,
    roleId: "ai-product-manager",
    why: "Manages an AI product, so the work is product management",
  },
  {
    id: "sales-engineer",
    when: /\b(sales|presales|pre\s+sales|solution|solutions)\s+engineer\b/,
    unless: /\b(sales\s+force\s+engineering)\b/,
    roleId: "sales-engineer",
    why: "Engineering in support of selling, which sits in sales rather than core engineering",
  },
  {
    id: "product-marketing",
    when: /\bproduct\s+marketing\b/,
    roleId: "product-marketing-manager",
    why: "Product marketing is marketing, not product management",
  },
  {
    id: "technical-program-manager",
    when: /\btechnical\s+program(me)?\s+manager\b/,
    roleId: "program-manager",
    why: "Runs programmes, which is programme management rather than engineering",
  },
  {
    id: "technical-account-manager",
    when: /\btechnical\s+account\s+manag(er|ement)\b/,
    roleId: "technical-account-manager",
    why: "Looks after accounts, which is client service rather than engineering",
  },
  {
    id: "technical-writer",
    when: /\b(technical\s+writer|documentation\s+engineer)\b/,
    roleId: "technical-writer",
    why: "Writes technical documentation",
  },
  {
    id: "data-product",
    when: /\bdata\s+product\s+manager\b/,
    roleId: "ai-product-manager",
    why: "Manages a data product, so the work is product management",
  },
];

// ---------------------------------------------------------------------------
// Business analyst, which means different jobs at different employers

const CONSULTING_EMPLOYER =
  /\b(mckinsey|bain|boston consulting|bcg|deloitte|pwc|pricewaterhouse|kpmg|ernst|\bey\b|accenture|capgemini|zs associates|kearney|oliver wyman|infosys consulting|advisory|consulting|consultancy)\b/i;

function resolveBusinessAnalyst(company: string): { roleId: string; why: string } {
  if (CONSULTING_EMPLOYER.test(company)) {
    return {
      roleId: "associate-consultant",
      why: `"Business Analyst" at ${company}, where the title means consulting`,
    };
  }
  return { roleId: "business-analyst", why: "Business analysis named in the title" };
}

// ---------------------------------------------------------------------------

const PATH_BY_ROLE = new Map<string, RolePath>();
for (const e of ALIAS_INDEX) if (!PATH_BY_ROLE.has(e.path.roleId)) PATH_BY_ROLE.set(e.path.roleId, e.path);

function pathOf(roleId: string): RolePath | null {
  return PATH_BY_ROLE.get(roleId) ?? null;
}

export interface ClassifyInput {
  title: string;
  company?: string;
  /** Headline, about text or anything else the export gave us, used as backup. */
  context?: string;
}

/**
 * Classifies one person. Evidence order follows what is most reliable: the
 * title itself, then the wider title context, then whatever else the export
 * carried, then the employer.
 */
// Scanning every alias is cheap once and expensive seven thousand times, and a
// connections export repeats the same title and employer constantly.
const CACHE = new Map<string, Classification>();

export function classify(input: ClassifyInput): Classification {
  const key = `${input.title} ${input.company ?? ""} ${input.context ?? ""}`;
  const hit = CACHE.get(key);
  if (hit) return hit;
  const result = run(input);
  if (CACHE.size < 50_000) CACHE.set(key, result);
  return result;
}

function run({ title, company = "", context = "" }: ClassifyInput): Classification {
  const evidence: string[] = [];
  const { sector, evidence: sectorWhy } = classifySector(company);
  if (sectorWhy) evidence.push(sectorWhy);

  const raw = normaliseTitle(title);
  const empty = (confidence: Confidence, why?: string): Classification => {
    if (why) evidence.unshift(why);
    return { bucketId: null, sectionId: null, roleId: null, sector, confidence, evidence };
  };

  if (!raw) return empty("low", "No job title in the export");

  // 1. Contextual rules, which exist precisely because the plain reading is wrong.
  for (const rule of CONTEXT_RULES) {
    if (!rule.when.test(raw)) continue;
    if (rule.unless?.test(raw)) continue;
    const path = pathOf(rule.roleId);
    if (!path) continue;
    evidence.unshift(`${rule.why}: "${title}"`);
    return { ...path, sector, confidence: "high", evidence };
  }

  // 2. Business analyst, decided by the employer rather than the words.
  if (/\bbusiness\s+analyst\b/.test(raw)) {
    const { roleId, why } = resolveBusinessAnalyst(company);
    const path = pathOf(roleId);
    if (path) {
      evidence.unshift(why);
      return { ...path, sector, confidence: company ? "high" : "medium", evidence };
    }
  }

  // 3. The longest alias that appears in the title.
  const content = contentOf(raw);
  const hit =
    ALIAS_INDEX.find((e) => contains(raw, e.phrase)) ?? ALIAS_INDEX.find((e) => contains(content, e.phrase));

  // "Manager - Supply Chain" is the same job as "Supply Chain Manager", so when
  // no phrase reads straight through, try the words in any order.
  if (!hit) {
    const words = new Set(content.split(" ").filter(Boolean));
    const loose = ALIAS_INDEX.find((e) => coversWords(words, e.phrase));
    if (loose) {
      evidence.unshift(`Title "${title}" names ${loose.path.roleLabel}, worded differently`);
      return { ...loose.path, sector, confidence: "medium", evidence };
    }
  }

  if (hit) {
    // A phrase that covers most of the title is a much stronger signal than one
    // stray word inside a long title.
    const coverage = hit.words / Math.max(1, content.split(" ").filter(Boolean).length);
    let confidence: Confidence = hit.words >= 2 || coverage >= 0.9 ? "high" : coverage >= 0.5 ? "medium" : "low";
    if (hit.broad && confidence === "high") confidence = "medium";
    evidence.unshift(`Title "${title}" matches ${hit.path.roleLabel}`);
    return { ...hit.path, sector, confidence, evidence };
  }

  // 4. Nothing in the title. Try whatever else the export gave us, and say so.
  if (context) {
    const ctx = normaliseTitle(context);
    const fromContext = ALIAS_INDEX.find((e) => e.words >= 2 && contains(ctx, e.phrase));
    if (fromContext) {
      evidence.unshift(`Title "${title}" was unclear; profile text mentions ${fromContext.path.roleLabel}`);
      return { ...fromContext.path, sector, confidence: "low", evidence };
    }
  }

  return empty("low", `Title "${title}" does not match any known role`);
}

// ---------------------------------------------------------------------------
// Corrections
//
// A classification the user has fixed, and the rules those fixes teach. Both
// speak the repository's vocabulary, so there is only ever one set of role names
// in the product.

export interface RoleHierarchy {
  bucket: string;
  section: string;
  roleId: string;
}

export interface CustomRule {
  id: string;
  /** "exact": the whole title must match; "contains": the phrase appears in it. */
  match: "exact" | "contains";
  /** Normalised title tokens joined by spaces (see `titleKey`). */
  pattern: string;
  /** The title as the user saw it when they made the correction. */
  example: string;
  set: Partial<RoleHierarchy>;
  createdAt: string;
}

export type ClassificationSource = "repository" | "ai" | "rule" | "manual";

export interface ResolvedRole extends Classification {
  source: ClassificationSource;
  ruleId?: string;
}

const apply = (c: Classification, set: Partial<RoleHierarchy>): Classification => ({
  ...c,
  bucketId: set.bucket ?? c.bucketId,
  sectionId: set.section ?? c.sectionId,
  roleId: set.roleId ?? c.roleId,
});

/** Normalised title, used as the key a rule matches on. */
export function titleKey(title: string): string {
  return normaliseTitle(title);
}

/**
 * The repository's reading, then any rule the user taught, then any correction
 * they made to this person specifically. Later wins, and says so.
 */
export function resolveRole(
  auto: Classification,
  position: string,
  rules: CustomRule[],
  manual?: Partial<RoleHierarchy> | null,
): ResolvedRole {
  let out: ResolvedRole = { ...auto, source: "repository" };

  if (rules.length) {
    const key = titleKey(position);
    const padded = ` ${key} `;
    const rule =
      rules.find((x) => x.match === "exact" && x.pattern === key) ??
      rules.find((x) => x.match === "contains" && x.pattern && padded.includes(` ${x.pattern} `));
    if (rule) {
      out = {
        ...apply(out, rule.set),
        confidence: "high",
        source: "rule",
        ruleId: rule.id,
        evidence: [`Your rule for "${rule.example}"`, ...auto.evidence].slice(0, 5),
      };
    }
  }

  if (manual && Object.keys(manual).length) {
    out = {
      ...apply(out, manual),
      confidence: "high",
      source: "manual",
      evidence: ["You set this classification yourself"],
    };
  }

  return out;
}

// ---------------------------------------------------------------------------
// Reading a search box

export interface TextMatch {
  buckets: string[];
  sections: string[];
  roles: string[];
  /** What was recognised, in the words the repository uses. */
  understood: string[];
  /** The query with the recognised phrases taken out. */
  rest: string;
}

const BUCKET_PHRASES: Array<[string, string]> = ROLE_BUCKETS.flatMap((bucket) => {
  const label = normaliseTitle(bucket.label);
  const out: Array<[string, string]> = [[label, bucket.id]];
  // "technology and engineering" is also reached by "technology" or "engineering".
  for (const part of bucket.label.split(" & ")) out.push([normaliseTitle(part), bucket.id]);
  return out;
}).sort((a, b) => b[0].length - a[0].length);

const SECTION_PHRASES: Array<[string, string, string]> = ROLE_BUCKETS.flatMap((bucket) =>
  bucket.sections.map((section) => [normaliseTitle(section.label), section.id, bucket.id] as [string, string, string]),
).sort((a, b) => b[0].length - a[0].length);

/**
 * Finds roles, sections and buckets named anywhere in a phrase, longest first.
 * Used by search, so "senior product managers" narrows to the Product Manager
 * role and "people in engineering" to the whole bucket.
 */
export function matchRolesInText(text: string): TextMatch {
  let rest = ` ${normaliseTitle(text)} `;
  const buckets: string[] = [];
  const sections: string[] = [];
  const roles: string[] = [];
  const understood: string[] = [];

  const take = (phrase: string) => {
    const padded = ` ${phrase} `;
    const plural = ` ${phrase}s `;
    if (rest.includes(padded)) {
      rest = rest.replace(padded, " ");
      return true;
    }
    if (rest.includes(plural)) {
      rest = rest.replace(plural, " ");
      return true;
    }
    return false;
  };

  for (const entry of ALIAS_INDEX) {
    if (entry.words < 2 && entry.broad) continue;
    if (roles.includes(entry.path.roleId)) continue;
    if (!take(entry.phrase)) continue;
    roles.push(entry.path.roleId);
    understood.push(entry.path.roleLabel);
    if (roles.length >= 4) break;
  }

  if (!roles.length) {
    for (const [phrase, sectionId, bucketId] of SECTION_PHRASES) {
      if (!take(phrase)) continue;
      sections.push(sectionId);
      if (!buckets.includes(bucketId)) understood.push(phrase);
      break;
    }
  }

  if (!roles.length && !sections.length) {
    for (const [phrase, bucketId] of BUCKET_PHRASES) {
      if (!take(phrase)) continue;
      buckets.push(bucketId);
      understood.push(ROLE_BUCKETS.find((b) => b.id === bucketId)!.label);
      break;
    }
  }

  return { buckets, sections, roles, understood, rest: rest.trim() };
}
