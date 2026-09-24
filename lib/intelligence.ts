// Hierarchical classification: Domain → Function → Role → Seniority (+ Industry).
//
// Layers, strongest first:
//   1. Manual edits on a person           (applied by the workspace, never overwritten)
//   2. Custom rules learned from edits     (this file, `rules`)
//   3. Automatic: role dictionary in context of the category classifier and employer

import { addEntry, classify, matchPhrases, type PhraseIndex } from "./classifier";
import { CATEGORY_DEFAULTS, DOMAINS, INDUSTRY_BY_COMPANY_CATEGORY } from "./roles";
import type { CategoryId, Seniority, TagId } from "./taxonomy";
import { cleanField, splitSegments, tokenize } from "./text";

export interface Hierarchy {
  domain: string;
  fn: string;
  role: string;
  seniority: Seniority;
  industry: string;
}

export type ClassificationSource = "auto" | "rule" | "manual";

export interface PersonClassification extends Hierarchy {
  /** 0–100. */
  confidence: number;
  source: ClassificationSource;
  needsReview: boolean;
  /** Human-readable evidence, e.g. `title: "product manager"`. */
  reasons: string[];
  category: CategoryId;
  tags: TagId[];
  campusOrg: boolean;
  /** For campus roles: what the person actually does there ("Marketing"). */
  campusActivity: string;
  /** Founder / co-founder of the company itself, not "founder's office" or "founding engineer". */
  isFounder: boolean;
  /** Employers named as past roles in the title ("Ex-Google", "formerly at Bain"). */
  pastCompanies: string[];
  ruleId?: string;
}

export interface CustomRule {
  id: string;
  /** "exact": whole title must match; "contains": phrase anywhere in the title. */
  match: "exact" | "contains";
  /** Normalized title tokens joined by spaces (see `titleKey`). */
  pattern: string;
  /** The title as the user saw it when the rule was created. */
  example: string;
  set: Partial<Hierarchy>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Lookup tables

export interface FunctionInfo {
  id: string;
  label: string;
  domain: string;
  generalist: string;
}

export const DOMAIN_LABEL = new Map(DOMAINS.map((d) => [d.id, d.label]));
export const FUNCTIONS = new Map<string, FunctionInfo>(
  DOMAINS.flatMap((d) => d.functions.map((f) => [f.id, { id: f.id, label: f.label, domain: d.id, generalist: f.generalist }] as const)),
);

export function domainLabel(id: string) {
  return DOMAIN_LABEL.get(id) ?? id;
}
export function functionLabel(id: string) {
  return FUNCTIONS.get(id)?.label ?? id;
}

interface RoleCandidate {
  domain: string;
  fn: string;
  role: string;
  weak: boolean;
}

let roleIndex: PhraseIndex<RoleCandidate[]> | null = null;

/** Every known role label with its place in the hierarchy. */
export const ROLE_CATALOG: RoleCandidate[] = [];

function getRoleIndex() {
  if (roleIndex) return roleIndex;
  roleIndex = new Map();
  for (const d of DOMAINS) {
    for (const f of d.functions) {
      for (const spec of f.roles) {
        const [label, rest = ""] = spec.split("=").map((s) => s.trim());
        ROLE_CATALOG.push({ domain: d.id, fn: f.id, role: label, weak: false });
        const phrases = [label, ...rest.split("|")].map((p) => p.trim()).filter(Boolean);
        for (const raw of phrases) {
          const weak = raw.startsWith("~");
          const tokens = tokenize(weak ? raw.slice(1) : raw);
          if (!tokens.length) continue;
          const candidate = { domain: d.id, fn: f.id, role: label, weak };
          addEntry(roleIndex, tokens, () => [] as RoleCandidate[], (list) => {
            if (!list.some((c) => c.fn === candidate.fn && c.role === candidate.role)) list.push(candidate);
          });
        }
      }
    }
  }
  return roleIndex;
}

/** Roles, functions and domains named in free text (used by search). Weak phrases are ignored. */
export function rolesInText(text: string): RoleCandidate[] {
  const idx = getRoleIndex();
  const out: RoleCandidate[] = [];
  for (const entry of matchPhrases(tokenize(text), idx)) {
    for (const c of entry.value) if (!c.weak && !out.some((o) => o.role === c.role)) out.push(c);
  }
  return out;
}

export function titleKey(position: string): string {
  return tokenize(cleanField(position)).join(" ");
}

// ---------------------------------------------------------------------------
// Campus organisations: clubs, societies, fests, student chapters…

const CAMPUS_WORDS = new Set(tokenize("club society cell chapter fest committee council association team racing gymkhana board"));
const ACADEMIC_WORDS = new Set(tokenize("iit nit iiit bits iim iiser university college institute school campus student nitw iitb iitm iitd xlri isb nitk nitr mnit vnit"));
const CAMPUS_PHRASES = [
  "student chapter", "student council", "student mentor program", "e cell", "entrepreneurship cell", "techfest", "mood indigo",
  "national service scheme", "nss", "ncc", "gymkhana", "ccpd", "fsae", "formula student", "baja", "180 degrees consulting",
  "student body", "placement cell", "alumni council", "student club", "student society", "devcom", "hostel council",
].map(tokenize);

/** Titles that mean the person works *for* the institution rather than studies at it. */
const ACADEMIC_STAFF =
  /\b(professor|prof|lecturer|faculty|dean|principal|registrar|teacher|tutor|instructor|trainer|coach|scientist|research(er)?|phd|post ?doc|librarian|warden|director|hod|visiting|founder|founding|ceo|cto|coo|chief|owner|administrator|counsell?or)\b/i;

export function isCampusOrg(company: string, position = ""): boolean {
  const tokens = tokenize(company);
  if (!tokens.length) return false;
  const hasSeq = (seq: string[]) => tokens.some((_, i) => seq.every((t, k) => tokens[i + k] === t));
  if (CAMPUS_PHRASES.some(hasSeq)) return true;
  const academic = tokens.some((t) => ACADEMIC_WORDS.has(t));
  if (!academic) return false;
  // A club/fest/chapter at a college, or any title at a college that isn't staff:
  // a college name must never imply corporate seniority.
  if (tokens.some((t) => CAMPUS_WORDS.has(t))) return true;
  const title = `${position} ${company}`;
  return !!position && !ACADEMIC_STAFF.test(title);
}

// ---------------------------------------------------------------------------

const ASPIRING = new Set(tokenize("aspiring future wannabe budding upcoming incoming"));
const FOUNDER_ROLES = new Set(["Founder", "Co-Founder", "Founder & CEO", "Founder & CTO", "Founder & COO", "Business Owner", "Entrepreneur"]);

/** Says "founder" about the person themselves. */
const FOUNDER_TITLE = /\b(co[-\s]?founder|founder|founding\s+(member|partner|team))\b/i;
/** …except when the same words describe a job *near* a founder, or an ambition. */
const FOUNDER_BLOCK = /\bfounder'?s?\s+office\b|\bfounding\s+engineer\b|\b(aspiring|future|wannabe|budding|incoming|ex|former|former ly)\b/i;

/**
 * Words that describe a *level*, not a job. ESCO's rule: modifiers about seniority
 * play no part in deciding the occupation. A title made only of these, "Assistant
 * Manager", "Senior Associate", "Team Lead", says how senior someone is and
 * nothing whatsoever about what they do, so we must not invent an area for them.
 */
const LEVEL_ONLY = new Set(
  tokenize(
    "assistant associate senior sr junior jr deputy trainee lead leader head chief vice president vp avp svp evp " +
      "director manager executive officer staff principal member team global regional national country group " +
      "corporate general grade level band designate designated acting interim",
  ),
);
const LEVEL_FILLER = /^(of|the|and|for|at|in|to|a|an|ii|iii|iv|i{1,3}|\d+)$/i;

/** The words in a title that actually say what the person does. */
function contentWords(title: string): string[] {
  return tokenize(title).filter((t) => !LEVEL_ONLY.has(t) && !LEVEL_FILLER.test(t));
}

/**
 * "VP of Engineering" names an area rather than a job title, so area names have to
 * be matchable too, otherwise the level word is the only thing left to go on.
 */
let areaIndex: PhraseIndex<{ domain: string; fn: string }> | null = null;
function getAreaIndex() {
  if (areaIndex) return areaIndex;
  areaIndex = new Map();
  const add = (name: string, value: { domain: string; fn: string }) => {
    const tokens = tokenize(name.replace(/&/g, " ").split(/[(,]/)[0]);
    if (tokens.length) addEntry(areaIndex!, tokens, () => value, () => {});
  };
  for (const d of DOMAINS) {
    if (d.id === "unclassified") continue;
    for (const f of d.functions) {
      add(f.label, { domain: d.id, fn: f.id });
      // "Engineering", "Marketing", "Finance" on their own point at the domain.
      add(d.label, { domain: d.id, fn: d.functions[0].id });
    }
  }
  return areaIndex;
}

/**
 * Employers whose whole business *is* one function, so a level-only title there
 * still says what the person does: "Senior Associate" at a consultancy is a
 * consultant. A bank or a conglomerate says nothing of the sort, which is why this
 * list is deliberately tiny.
 */
const EMPLOYER_IMPLIES_FUNCTION = new Set<CategoryId>(["consulting", "recruiting", "legal"]);

/** Roles that are really just a rung on the ladder; a named function should beat them. */
const LEVEL_ROLES = new Set([
  "Vice President", "Senior Vice President", "Executive Vice President", "Assistant Vice President",
  "Director", "Senior Director", "Associate Director", "Managing Director", "Manager", "Senior Manager",
  "General Manager", "Executive", "Head", "Team Lead", "Lead", "Associate", "Senior Associate", "Analyst",
]);

const IC_MANAGER_ROLES = new Set([
  "Product Manager", "Senior Product Manager", "AI Product Manager", "Technical Product Manager", "Growth Product Manager",
  "Associate Product Manager", "Account Manager", "Key Account Manager", "Brand Manager", "Relationship Manager",
  "Category Manager", "Product Marketing Manager", "Customer Success Manager", "Program Manager", "Project Manager",
  "Technical Program Manager", "Partnerships Manager", "Community Manager", "Social Media & Community Manager",
]);

const PAST_PREFIX = /^(ex|former(ly)?|previously|prev|past|earlier)\b[\s.:,-]*/i;
const PAST_NOISE = /\b(intern|engineer|manager|analyst|consultant|associate|developer|lead|director|scientist|designer|founder|student|sde|swe|pm|ta)\b/gi;

/** "Ex-Google | Former PM @ Stripe" → ["Google", "Stripe"] */
function extractPastCompanies(position: string): string[] {
  const out: string[] = [];
  for (const seg of splitSegments(position)) {
    if (seg.weight > 0.25) continue;
    const cleaned = (seg.inlineCompany || seg.title)
      .replace(PAST_PREFIX, "")
      .replace(PAST_NOISE, " ")
      .replace(/[|•·@]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    const words = cleaned.split(" ").filter(Boolean).slice(0, 4).join(" ");
    if (words.length >= 2 && /[a-z]/i.test(words) && !out.includes(words)) out.push(words);
  }
  return out;
}

function tidyTitle(title: string): string {
  return title.replace(/\s+/g, " ").replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, "").slice(0, 60);
}

export function classifyAuto(rawPosition: string, rawCompany: string): PersonClassification {
  const position = cleanField(rawPosition);
  const company = cleanField(rawCompany);
  const base = classify(position, company);
  const campusOrg = isCampusOrg(company, position);
  const [categoryDomain, categoryFn] = CATEGORY_DEFAULTS[base.category];
  const reasons = base.reasons.map((r) => (r.startsWith("company:") ? r : `title: “${r}”`));

  // --- Role match -----------------------------------------------------------
  const idx = getRoleIndex();
  const segments = splitSegments(position);
  const current = segments.filter((s) => s.weight >= 0.7);
  let best: { c: RoleCandidate; score: number; phrase: string } | null = null;
  // "Manager - Category" and "Executive, Production" name the function after the
  // separator; also try the parts joined in both orders.
  const variants = (current.length ? current : segments).map((s) => ({ title: s.title, weight: s.weight }));
  const firstChunk = position.split(/\s*[|•·;]\s*/)[0] ?? "";
  const parts = firstChunk.split(/\s+[-–—:]\s+|\s*,\s*|\s+-(?=\S)|(?<=\S)-\s+/).filter(Boolean);
  if (parts.length === 2 && parts[0].split(" ").length <= 3) {
    variants.push({ title: `${parts[1]} ${parts[0]}`, weight: 1 }, { title: `${parts[0]} ${parts[1]}`, weight: 1 });
  }
  for (const seg of variants) {
    let tokens = tokenize(seg.title);
    if (ASPIRING.has(tokens[0])) tokens = tokens.slice(1);
    for (const entry of matchPhrases(tokens, idx)) {
      for (const c of entry.value) {
        const campusRole = campusOrg && c.domain === "students";
        if (c.weak && c.domain !== categoryDomain && !campusRole) continue;
        const score =
          seg.weight * (10 + 3 * entry.tokens.length) +
          (c.domain === categoryDomain ? 6 : 0) +
          (campusRole && c.fn === "campus" ? 14 : 0);
        if (!best || score > best.score) best = { c, score, phrase: entry.phrase };
      }
    }
  }

  // "Vice President Of Engineering" matches the rung before the job. When a level
  // role wins but the title still names something, let that something decide.
  const said = contentWords(current.length ? current.map((s) => s.title).join(" ") : position);
  let areaOnly: { domain: string; fn: string; phrase: string } | null = null;
  let employerArea = false;
  if (said.length && (!best || LEVEL_ROLES.has(best.c.role))) {
    for (const entry of matchPhrases(said, idx)) {
      for (const c of entry.value) {
        if (c.weak && c.domain !== categoryDomain) continue;
        best = { c, score: 100, phrase: entry.phrase };
      }
    }
    if (!best) {
      for (const entry of matchPhrases(said, getAreaIndex())) {
        areaOnly = { ...entry.value, phrase: entry.phrase };
      }
    }
  }

  let domain: string;
  let fn: string;
  let role: string;
  let roleSpecific = false;

  if (base.category === "unspecified" && !best) {
    domain = "unclassified";
    fn = "unclassified";
    role = "Role not shared";
  } else if (areaOnly) {
    // The title named an area but no specific job: "Vice President of Engineering".
    ({ domain, fn } = areaOnly);
    role = FUNCTIONS.get(fn)!.generalist;
    roleSpecific = true;
    reasons.unshift(`area: “${areaOnly.phrase}”`);
  } else if (!said.length && (!best || LEVEL_ROLES.has(best.c.role))) {
    best = null;
    const stated = tidyTitle(current[0]?.title ?? position);
    if (base.companyCategory && EMPLOYER_IMPLIES_FUNCTION.has(base.companyCategory)) {
      // The employer does one thing, so the level still tells us the job.
      [domain, fn] = CATEGORY_DEFAULTS[base.companyCategory];
      role = stated || FUNCTIONS.get(fn)!.generalist;
      employerArea = true;
      reasons.unshift("area: from the employer, not the title");
    } else {
      // Nothing but a level. Say the level, admit we do not know the area.
      domain = "unclassified";
      fn = "unspecified";
      role = stated || "Not specified";
    }
  } else if (best) {
    ({ domain, fn, role } = best.c);
    roleSpecific = true;
    reasons.unshift(`role: “${best.phrase}”`);
  } else {
    domain = categoryDomain;
    fn = campusOrg && base.category === "students" ? "campus" : categoryFn;
    const primary = tidyTitle(current[0]?.title ?? "");
    role = primary && primary.split(" ").length <= 5 ? primary : FUNCTIONS.get(fn)!.generalist;
  }

  // --- Campus activity ---------------------------------------------------------
  // A club, fest or college title describes what someone *does on campus*. It must
  // never read as corporate seniority, but the activity itself is worth keeping.
  let campusActivity = "";
  if (campusOrg && domain !== "students") {
    campusActivity = roleSpecific ? domainLabel(domain) : "";
    role = campusActivity ? `${campusActivity} · Student Organisation` : "Student Organisation";
    domain = "students";
    fn = "campus";
  }

  // --- Seniority --------------------------------------------------------------
  const currentText = (current.length ? current : segments).map((s) => s.title).join(" | ");
  const isFounder =
    !campusOrg && !FOUNDER_BLOCK.test(currentText) && (FOUNDER_TITLE.test(currentText) || FOUNDER_ROLES.has(role));

  let seniority = base.seniority;
  if (domain === "students" && (fn === "students" || fn === "campus")) seniority = "Student";
  else if (fn === "internships" || /\bintern(ship)?\b/i.test(role)) seniority = "Intern";
  else if (isFounder) seniority = "Founder";
  else if (fn === "early-career" && seniority === "Mid-level") seniority = "Entry-level";
  else if (seniority === "Manager / Lead" && IC_MANAGER_ROLES.has(role) && !/\b(lead|head|group|principal|director)\b/i.test(position)) {
    // A Product or Account "Manager" is usually an individual contributor, not a people manager.
    seniority = /\b(senior|sr)\b/i.test(position) ? "Senior" : "Mid-level";
  }

  // --- Industry (from the employer only) --------------------------------------
  const industry = campusOrg
    ? "Education"
    : (base.companyCategory && INDUSTRY_BY_COMPANY_CATEGORY[base.companyCategory]) || "Unknown";

  // --- Confidence --------------------------------------------------------------
  let confidence: number;
  // A level-only title is not a failure to read the title: we read it correctly and
  // it simply does not say what they do. Low score, but flagged so it can be fixed.
  if (fn === "unspecified") confidence = 30;
  else if (employerArea) confidence = 45;
  else if (domain === "unclassified") confidence = 0;
  else {
    const baseline = base.basis === "title"
      ? { high: 88, medium: 74, low: 56 }[base.confidence]
      : base.basis === "fuzzy" ? 45 : base.basis === "company" ? 40 : 50;
    const matchedDomain = best?.c.domain ?? areaOnly?.domain;
    if (roleSpecific && matchedDomain === categoryDomain) confidence = baseline + 8;
    else if (roleSpecific) confidence = Math.max(baseline, 70);
    else confidence = baseline - 6;
    if (campusOrg && domain === "students") confidence = Math.max(confidence, 80);
    confidence = Math.max(5, Math.min(97, Math.round(confidence)));
  }

  return {
    domain, fn, role, seniority, industry,
    confidence,
    pastCompanies: extractPastCompanies(position),
    source: "auto",
    needsReview: fn === "unspecified" || (domain !== "unclassified" && confidence < 60),
    reasons: reasons.slice(0, 5),
    category: base.category,
    tags: base.tags,
    campusOrg,
    campusActivity,
    isFounder,
  };
}

export function applyRules(auto: PersonClassification, position: string, rules: CustomRule[]): PersonClassification {
  if (!rules.length) return auto;
  const key = titleKey(position);
  if (!key) return auto;
  const padded = ` ${key} `;
  const rule =
    rules.find((r) => r.match === "exact" && r.pattern === key) ??
    rules.find((r) => r.match === "contains" && r.pattern && padded.includes(` ${r.pattern} `));
  if (!rule) return auto;
  return {
    ...auto,
    ...rule.set,
    confidence: 99,
    source: "rule",
    needsReview: false,
    ruleId: rule.id,
    reasons: [`your rule: “${rule.example}”`, ...auto.reasons].slice(0, 5),
  };
}
