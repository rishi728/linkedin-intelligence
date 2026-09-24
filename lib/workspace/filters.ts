import { domainLabel, functionLabel, rolesInText } from "../intelligence";
import { DOMAINS, INDUSTRIES } from "../roles";
import { SENIORITY_LEVELS, type Seniority } from "../taxonomy";
import { tokenize } from "../text";
import { daysBetween, todayISO, toISODate } from "./dates";
import type { AudienceId, Filters, HealthIssue, Person, Priority, Settings } from "./types";

// ---------------------------------------------------------------------------
// Audiences ("Who do you want to reach?")

export const AUDIENCES: Array<{ id: AudienceId; label: string; hint: string; test: (p: Person) => boolean }> = [
  { id: "peers", label: "Peers", hint: "Students, interns and early-career people", test: (p) => ["Student", "Intern", "Entry-level", "Mid-level"].includes(p.seniority) },
  { id: "alumni", label: "Alumni", hint: "People at your schools or their clubs (set schools in Settings)", test: (p) => p.isAlumni },
  { id: "managers", label: "Managers", hint: "Managers, leads and senior individual contributors", test: (p) => ["Manager / Lead", "Senior"].includes(p.seniority) },
  { id: "directors", label: "Directors & Heads", hint: "Directors, heads and VPs", test: (p) => ["Director / Head", "VP"].includes(p.seniority) },
  { id: "founders", label: "Founders", hint: "Founders and co-founders", test: (p) => p.isFounder },
  { id: "recruiters", label: "Recruiters", hint: "Recruiters and talent acquisition", test: (p) => p.fn === "talent-acquisition" },
  { id: "executives", label: "Executives", hint: "C-level, VPs and executive leadership", test: (p) => ["C-Level", "VP"].includes(p.seniority) || p.fn === "executive-leadership" },
];

// ---------------------------------------------------------------------------
// Intents ("What are you looking for?")

export interface Intent {
  id: string;
  label: string;
  hint: string;
  filters: Filters;
}

const SENIOR_PLUS = ["Senior", "Manager / Lead", "Director / Head", "VP", "C-Level", "Founder"];
const NOT_STUDENTS = ["Entry-level", "Mid-level", "Senior", "Manager / Lead", "Director / Head", "VP", "C-Level", "Founder"];

/**
 * Goals that mean the same thing in anyone's network. Areas of work are not in here
 *, those are read from the data itself, because every network is different.
 */
export const GOAL_INTENTS: Intent[] = [
  { id: "founders", label: "Founders", hint: "Founders & co-founders", filters: { audiences: ["founders"] } },
  { id: "recruiters", label: "Recruiters", hint: "Recruiters & talent acquisition", filters: { audiences: ["recruiters"] } },
  { id: "mentors", label: "Mentors", hint: "Experienced people who can advise you", filters: { seniorities: SENIOR_PLUS } },
  { id: "referrals", label: "Referrals", hint: "Working professionals who could refer you", filters: { seniorities: NOT_STUDENTS, targetOnly: true } },
  { id: "internships", label: "Internships", hint: "Recruiters, founders and hiring managers", filters: { audiences: ["recruiters", "founders", "managers", "directors"] } },
  { id: "jobs", label: "Jobs", hint: "Recruiters, managers and people who are hiring", filters: { audiences: ["recruiters", "managers", "directors", "executives"] } },
  { id: "talked", label: "People I know already", hint: "There is a conversation to pick up", filters: { history: "messaged" } },
];

/** Kept for anything that needs a goal by name. Areas come from `buildIntents`. */
export const INTENTS = GOAL_INTENTS;

/**
 * An intent only means what it says when the workspace can honour it: "Referrals"
 * without target companies means every working professional, not nobody.
 */
export function resolveIntent(intent: Intent, settings: Settings): Filters {
  if (intent.filters.targetOnly && settings.targetCompanies.length === 0) {
    const { targetOnly: _drop, ...rest } = intent.filters;
    return rest;
  }
  return intent.filters;
}

/**
 * The "What are you looking for?" cards, built from this person's own connections:
 * the areas they actually know people in, then the goals that have someone behind them.
 */
export function buildIntents(people: Person[], settings: Settings): Array<Intent & { count: number }> {
  const byDomain = new Map<string, { count: number; fns: Map<string, number> }>();
  for (const p of people) {
    if (p.domain === "unclassified" || p.domain === "students") continue;
    const e = byDomain.get(p.domain) ?? { count: 0, fns: new Map() };
    e.count++;
    e.fns.set(p.fn, (e.fns.get(p.fn) ?? 0) + 1);
    byDomain.set(p.domain, e);
  }

  const areas = [...byDomain.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .filter(([, e]) => e.count >= 3)
    .slice(0, 9)
    .map(([domain, e]) => ({
      id: `area:${domain}`,
      label: domainLabel(domain),
      hint: [...e.fns.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([fn]) => functionLabel(fn)).join(" · "),
      filters: { domains: [domain] } as Filters,
      count: e.count,
    }));

  // The resolved filters are what the card counts *and* what picking it applies, so a
  // card can never promise a number the next screen does not deliver.
  const goals = GOAL_INTENTS.map((g) => {
    const filters = resolveIntent(g, settings);
    return { ...g, filters, count: applyFilters(people, filters, settings).length };
  }).filter((g) => g.count > 0);

  return [...areas, ...goals];
}

// ---------------------------------------------------------------------------

const has = <T,>(list: T[] | undefined): list is T[] => !!list && list.length > 0;

export function activeFilterCount(f: Filters): number {
  let n = 0;
  for (const [k, v] of Object.entries(f)) {
    if (k === "q") continue;
    if (Array.isArray(v) ? v.length : v !== undefined && v !== "" && v !== false) n++;
  }
  return n;
}

export function isEmptyFilters(f: Filters): boolean {
  return activeFilterCount(f) === 0 && !f.q?.trim();
}

export function matchesHealth(p: Person, issue: HealthIssue): boolean {
  switch (issue) {
    case "duplicates": return !!p.duplicateOf;
    case "missing-position": return !p.position;
    case "missing-company": return !p.company;
    case "missing-email": return !p.email;
    case "missing-linkedin": return !p.url;
    case "unclassified": return p.domain === "unclassified";
    case "low-confidence": return p.needsReview;
    case "manual": return p.classSource !== "auto";
  }
}

export function applyFilters(people: Person[], f: Filters, settings: Settings, today = todayISO()): Person[] {
  const terms = (f.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const audiences = has(f.audiences) ? AUDIENCES.filter((a) => f.audiences!.includes(a.id)) : [];
  const closed = new Set(settings.statuses.filter((s) => s.kind === "closed").map((s) => s.id));
  const companies = has(f.companies) ? new Set(f.companies) : null;

  return people.filter((p) => {
    if (has(f.domains) || has(f.functions)) {
      const inDomain = has(f.domains) && f.domains.includes(p.domain);
      const inFn = has(f.functions) && f.functions.includes(p.fn);
      if (!inDomain && !inFn) return false;
    }
    if (has(f.roles) && !f.roles.includes(p.role)) return false;
    if (has(f.seniorities) && !f.seniorities.includes(p.seniority)) return false;
    if (companies && !companies.has(p.companyKey)) return false;
    if (has(f.industries) && !f.industries.includes(p.industry)) return false;
    if (has(f.locations) && !f.locations.some((l) => p.location.toLowerCase().includes(l.toLowerCase()))) return false;
    if (f.connectedAfter && (!p.connectedOn || p.connectedOn < new Date(f.connectedAfter))) return false;
    if (f.connectedBefore && (!p.connectedOn || p.connectedOn > new Date(`${f.connectedBefore}T23:59:59`))) return false;
    if (f.hasEmail !== undefined && !!p.email !== f.hasEmail) return false;
    if (f.hasLinkedIn !== undefined && !!p.url !== f.hasLinkedIn) return false;
    if (has(f.statuses) && !f.statuses.includes(p.status)) return false;
    if (has(f.priorities) && !f.priorities.includes(p.priority)) return false;
    if (has(f.tags) && !f.tags.some((t) => p.tags.includes(t))) return false;
    if (audiences.length && !audiences.some((a) => a.test(p))) return false;
    if (f.targetOnly && !p.isTarget) return false;
    if (f.inPipeline && p.status === "not_contacted") return false;
    if (f.needsReview && !p.needsReview) return false;
    if (f.health && !matchesHealth(p, f.health)) return false;
    if (f.history) {
      const h = p.history;
      const messaged = !!h && h.messageCount > 0;
      if (f.history === "messaged" && !messaged) return false;
      if (f.history === "replied" && !h?.theyReplied) return false;
      if (f.history === "no-reply" && !(messaged && !h?.theyReplied)) return false;
      if (f.history === "never" && messaged) return false;
      if (f.history === "they-invited" && h?.invited !== "them") return false;
    }
    if (has(f.pastCompanies) && !f.pastCompanies.some((c) => p.pastCompanies.some((x) => x.toLowerCase().includes(c.toLowerCase())))) return false;
    if (f.connectedWithinDays !== undefined) {
      if (!p.connectedOn) return false;
      if (daysBetween(toISODate(p.connectedOn), today) > f.connectedWithinDays) return false;
    }
    if (f.dormant) {
      const old = p.connectedOn ? daysBetween(toISODate(p.connectedOn), today) > 365 : false;
      if (!old || p.status !== "not_contacted" || (p.history?.messageCount ?? 0) > 0) return false;
    }
    if (f.followUp) {
      const scheduled = !!p.followUpAt && !closed.has(p.status);
      if (f.followUp === "none" && scheduled) return false;
      if (f.followUp === "scheduled" && !scheduled) return false;
      if (f.followUp === "overdue" && !(scheduled && daysBetween(today, p.followUpAt) < 0)) return false;
    }
    for (const t of terms) if (!p.haystack.includes(t)) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Natural-language search → filters

/** Level words keep their meaning even when a matched role label contains them. */
const LEVEL_WORDS = new Set([
  "senior", "sr", "junior", "jr", "principal", "staff", "chief", "head", "vp",
  "director", "lead", "intern", "student", "founder", "associate", "executive",
]);

const SENIORITY_WORDS: Array<[string, Seniority[]]> = [
  ["senior people", ["Senior", "Manager / Lead", "Director / Head", "VP", "C-Level", "Founder"]],
  ["experienced", ["Senior", "Manager / Lead", "Director / Head", "VP", "C-Level"]],
  ["leaders", ["Director / Head", "VP", "C-Level"]],
  ["leadership", ["Director / Head", "VP", "C-Level"]],
  ["senior", ["Senior", "Manager / Lead", "Director / Head", "VP", "C-Level"]],
  ["junior", ["Entry-level", "Mid-level"]],
  ["entry level", ["Entry-level"]],
  ["freshers", ["Entry-level"]],
  ["managers", ["Manager / Lead"]],
  ["manager", ["Manager / Lead"]],
  ["leads", ["Manager / Lead"]],
  ["directors", ["Director / Head"]],
  ["director", ["Director / Head"]],
  ["heads", ["Director / Head"]],
  ["vps", ["VP"]],
  ["vp", ["VP"]],
  ["cxos", ["C-Level"]],
  ["executives", ["C-Level", "VP"]],
  ["interns", ["Intern"]],
  ["students", ["Student"]],
];

const STATUS_WORDS: Array<[string, Partial<Filters>]> = [
  ["i haven t contacted", { statuses: ["not_contacted"] }],
  ["haven t contacted", { statuses: ["not_contacted"] }],
  ["havent contacted", { statuses: ["not_contacted"] }],
  ["not yet contacted", { statuses: ["not_contacted"] }],
  ["haven t reached out to", { statuses: ["not_contacted"] }],
  ["haven t reached out", { statuses: ["not_contacted"] }],
  ["i have spoken to", { history: "messaged" }],
  ["i ve spoken to", { history: "messaged" }],
  ["ive spoken to", { history: "messaged" }],
  ["already spoken to", { history: "messaged" }],
  ["spoken to", { history: "messaged" }],
  ["talked to", { history: "messaged" }],
  ["i messaged", { history: "messaged" }],
  ["i have messaged", { history: "messaged" }],
  ["already messaged", { history: "messaged" }],
  ["who replied", { history: "replied" }],
  ["founders", { audiences: ["founders"] }],
  ["founder", { audiences: ["founders"] }],
  ["co founders", { audiences: ["founders"] }],
  ["not contacted", { statuses: ["not_contacted"] }],
  ["uncontacted", { statuses: ["not_contacted"] }],
  ["to contact", { statuses: ["to_contact"] }],
  ["awaiting response", { statuses: ["awaiting"] }],
  ["follow up", { followUp: "scheduled" }],
  ["overdue", { followUp: "overdue" }],
  ["with email", { hasEmail: true }],
  ["have email", { hasEmail: true }],
  ["target companies", { targetOnly: true }],
  ["target company", { targetOnly: true }],
  ["high priority", { priorities: ["high"] }],
  ["needs review", { needsReview: true }],
  ["alumni", { audiences: ["alumni"] }],
  ["replied", { history: "replied" }],
  ["never messaged", { history: "never" }],
  ["no reply", { history: "no-reply" }],
  ["they invited me", { history: "they-invited" }],
  ["invited me", { history: "they-invited" }],
  ["dormant", { dormant: true }],
  ["recently connected", { connectedWithinDays: 30 }],
  ["new connections", { connectedWithinDays: 30 }],
  ["recruiters", { audiences: ["recruiters"] }],
  ["hiring", { tags: ["Actively Hiring"] }],
];

/** Words people use for a whole area of work, mapped to a domain in the taxonomy. */
const DOMAIN_ALIASES: Array<[string, string]> = [
  ["operations", "operations"], ["ops", "operations"],
  ["technology", "technology"], ["tech", "technology"], ["it", "technology"],
  ["software", "engineering"], ["engineering", "engineering"], ["development", "engineering"],
  ["product", "product"], ["design", "design"], ["ux", "design"],
  ["finance", "finance"], ["banking", "finance"], ["investing", "finance"],
  ["marketing", "marketing"], ["growth", "marketing"], ["brand", "marketing"],
  ["sales", "sales"], ["business development", "sales"], ["bd", "sales"],
  ["consulting", "strategy"], ["strategy", "strategy"],
  ["data", "data-ai"], ["analytics", "data-ai"], ["ai", "data-ai"], ["ml", "data-ai"], ["machine learning", "data-ai"],
  ["legal", "legal"], ["healthcare", "healthcare"], ["medicine", "healthcare"],
  ["research", "research"], ["academia", "research"], ["education", "education"], ["teaching", "education"],
  ["media", "media"], ["content", "media"], ["hr", "people"], ["talent", "people"], ["recruiting", "people"],
  ["customer success", "customer"], ["support", "customer"],
  ["government", "public"], ["policy", "public"], ["real estate", "real-estate"],
  ["leadership", "leadership"], ["founders", "leadership"],
];

/** Words people use for an industry, mapped onto the industries we actually store. */
const INDUSTRY_ALIASES: Array<[string, string]> = [
  ["saas", "Technology"], ["software companies", "Technology"], ["tech companies", "Technology"],
  ["startups", "Startups"], ["startup", "Startups"],
  ["consulting firms", "Consulting & Professional Services"], ["consultancies", "Consulting & Professional Services"],
  ["banks", "Financial Services"], ["fintech", "Financial Services"], ["finance industry", "Financial Services"],
  ["vc", "Venture Capital & Private Equity"], ["venture capital", "Venture Capital & Private Equity"],
  ["private equity", "Venture Capital & Private Equity"],
  ["pharma", "Healthcare & Pharma"], ["hospitals", "Healthcare & Pharma"],
  ["manufacturing", "Manufacturing, Energy & Industrial"], ["energy", "Manufacturing, Energy & Industrial"],
  ["logistics", "Logistics & Supply Chain"], ["ecommerce", "Distribution & Trading"],
  ["academia", "Research & Academia"], ["universities", "Education"], ["colleges", "Education"],
  ["nonprofits", "Government & Nonprofit"], ["ngos", "Government & Nonprofit"],
];

export interface ParsedQuery {
  filters: Filters;
  /** What we understood, for display ("Supply Chain", "Manager / Lead"...). */
  understood: string[];
}

/**
 * "senior people in supply chain at unilever with email" →
 * { functions: [supply-chain], seniorities: [...], companies: [unilever], hasEmail: true }.
 * Words that aren't understood stay as free-text search.
 */
export function parseQuery(
  text: string,
  companyKeys: Array<{ key: string; name: string }>,
  opts: { schools?: string[] } = {},
): ParsedQuery {
  let rest = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}&+\s-]/gu, " ").replace(/\s+/g, " ")} `;
  const filters: Filters = {};
  const understood: string[] = [];
  const take = (phrase: string) => {
    const re = new RegExp(`\\s${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s`);
    if (!re.test(rest)) return false;
    rest = rest.replace(re, " ");
    return true;
  };

  for (const [phrase, patch] of STATUS_WORDS) {
    if (take(phrase)) {
      Object.assign(filters, { ...patch, ...(patch.audiences ? { audiences: [...(filters.audiences ?? []), ...patch.audiences] } : {}) });
      understood.push(phrase.replace(/^\w/, (c) => c.toUpperCase()));
    }
  }

  // Your own schools: "people from NIT Warangal in product" means alumni, not an employer.
  for (const school of opts.schools ?? []) {
    const phrase = tokenize(school).join(" ");
    if (!phrase || !rest.includes(` ${phrase} `)) continue;
    rest = rest.replace(` ${phrase} `, " ").replace(/\sfrom\s/, " ");
    filters.audiences = [...new Set([...(filters.audiences ?? []), "alumni" as AudienceId])];
    understood.push(`From ${school}`);
    break;
  }

  // Companies: "at google", "in amazon", or a bare company name we know.
  const atMatch = rest.match(/\s(?:at|in|from)\s+([\p{L}\p{N}&.\- ]{2,40}?)(?=\s(?:with|who|and|that|in|at)\s|\s*$)/u);
  const tryCompany = (candidate: string) => {
    const ck = tokenize(candidate).join(" ");
    if (!ck) return null;
    // "in finance", "in technology" name an area of work, not an employer whose
    // name happens to start with the same word.
    if (DOMAIN_ALIASES.some(([phrase]) => phrase === ck) || DOMAINS.some((d) => d.label.toLowerCase() === ck)) return null;
    if (INDUSTRY_ALIASES.some(([phrase]) => phrase === ck)) return null;
    const hits = companyKeys.filter((c) => {
      const k = tokenize(c.name).join(" ");
      return k === ck || k.startsWith(`${ck} `);
    });
    return hits.length ? hits : null;
  };
  if (atMatch) {
    const hits = tryCompany(atMatch[1]);
    if (hits) {
      filters.companies = [...new Set(hits.map((h) => h.key))];
      understood.push(`At ${hits[0].name}${hits.length > 1 ? ` (+${hits.length - 1})` : ""}`);
      rest = rest.replace(atMatch[0], " ");
    }
  }

  // Industries: "founders in saas", "people at consulting firms".
  for (const [phrase, industry] of INDUSTRY_ALIASES) {
    if (!INDUSTRIES.includes(industry) || !take(phrase)) continue;
    filters.industries = [...new Set([...(filters.industries ?? []), industry])];
    understood.push(industry);
    break;
  }

  // "people" is filler in "supply chain people", but real in "People Operations".
  if (!/people (operations|ops|partner|partners|team|analytics)/.test(text.toLowerCase())) {
    rest = rest.replace(/\s(people|person|persons|folks|someone|anyone|connections)\s/g, " ");
  }

  // Roles and functions from the role dictionary; a bare area name falls back to its domain.
  let roles = rolesInText(rest);
  // A bare area word ("operations") means the whole area, not the one role that
  // happens to be spelled the same. Two-word phrases ("supply chain") still win.
  const bareArea = DOMAIN_ALIASES.find(([phrase]) => {
    if (phrase.includes(" ") || !rest.includes(` ${phrase} `)) return false;
    const alone = rolesInText(phrase).map((r) => r.fn).sort().join();
    return alone.length > 0 && alone === [...new Set(roles.map((r) => r.fn))].sort().join();
  });
  if (bareArea) roles = [];

  if (roles.length) {
    const fns = [...new Set(roles.map((r) => r.fn))];
    filters.functions = fns;
    understood.push(...fns.map(functionLabel));
  } else {
    const byLabel = DOMAINS.find((d) => d.id !== "unclassified" && rest.includes(` ${d.label.toLowerCase()} `));
    const alias = byLabel ? null : DOMAIN_ALIASES.find(([phrase]) => rest.includes(` ${phrase} `));
    const domain = byLabel?.id ?? alias?.[1];
    if (domain) {
      filters.domains = [domain];
      understood.push(domainLabel(domain));
      rest = rest.replace(` ${byLabel ? byLabel.label.toLowerCase() : alias![0]} `, " ");
    }
  }

  // Words a matched role already explains are removed before reading seniority, so
  // "product managers" doesn't also filter to people-managers. Level words survive:
  // in "senior product managers" the "senior" is still the user's own requirement.
  if (roles.length) {
    const strip = (w: string) => {
      if (LEVEL_WORDS.has(w)) return;
      rest = rest.replace(new RegExp(`\\s${w}s?\\s`), " ");
    };
    for (const r of roles) for (const w of r.role.toLowerCase().split(/\W+/)) strip(w);
    for (const fn of filters.functions ?? []) for (const w of functionLabel(fn).toLowerCase().split(/\W+/)) if (w.length > 2) strip(w);
  }

  for (const [phrase, levels] of SENIORITY_WORDS) {
    if (take(phrase)) {
      filters.seniorities = [...new Set([...(filters.seniorities ?? []), ...levels])];
      understood.push(phrase.replace(/^\w/, (c) => c.toUpperCase()));
      break;
    }
  }

  const leftover = rest
    .split(" ")
    .filter((w) => w && !["people", "person", "find", "show", "me", "in", "at", "the", "who", "are", "with", "and", "of", "for", "working", "work", "my", "connections", "all", "a", "an", "to", "from", "that"].includes(w))
    .join(" ")
    .trim();
  if (leftover) filters.q = leftover;
  return { filters, understood };
}

// ---------------------------------------------------------------------------

export function describeFilters(f: Filters, settings: Settings): Array<{ key: keyof Filters; label: string }> {
  const out: Array<{ key: keyof Filters; label: string }> = [];
  const list = (key: keyof Filters, values: string[] | undefined, fmt: (v: string) => string, noun: string) => {
    if (!has(values)) return;
    out.push({ key, label: values.length <= 2 ? values.map(fmt).join(", ") : `${fmt(values[0])} +${values.length - 1} ${noun}` });
  };
  list("domains", f.domains, domainLabel, "domains");
  list("functions", f.functions, functionLabel, "functions");
  list("roles", f.roles, (v) => v, "roles");
  list("seniorities", f.seniorities, (v) => v, "levels");
  list("companies", f.companies, (v) => v.replace(/\b\w/g, (c) => c.toUpperCase()), "companies");
  list("industries", f.industries, (v) => v, "industries");
  list("locations", f.locations, (v) => v, "locations");
  list("statuses", f.statuses, (v) => settings.statuses.find((s) => s.id === v)?.label ?? v, "statuses");
  list("priorities", f.priorities, (v) => `${v[0].toUpperCase()}${v.slice(1)} priority`, "priorities");
  list("tags", f.tags, (v) => v, "tags");
  list("audiences", f.audiences, (v) => AUDIENCES.find((a) => a.id === v)?.label ?? v, "audiences");
  if (f.targetOnly) out.push({ key: "targetOnly", label: "Target companies" });
  if (f.inPipeline) out.push({ key: "inPipeline", label: "In your pipeline" });
  if (f.needsReview) out.push({ key: "needsReview", label: "Needs review" });
  if (f.hasEmail !== undefined) out.push({ key: "hasEmail", label: f.hasEmail ? "Has email" : "No email" });
  if (f.hasLinkedIn !== undefined) out.push({ key: "hasLinkedIn", label: f.hasLinkedIn ? "Has LinkedIn" : "No LinkedIn" });
  if (f.connectedAfter) out.push({ key: "connectedAfter", label: `Connected after ${f.connectedAfter}` });
  if (f.connectedBefore) out.push({ key: "connectedBefore", label: `Connected before ${f.connectedBefore}` });
  if (f.followUp) out.push({ key: "followUp", label: { overdue: "Follow-up overdue", scheduled: "Follow-up scheduled", none: "No follow-up" }[f.followUp] });
  if (f.health) out.push({ key: "health", label: HEALTH_LABELS[f.health] });
  if (f.history) out.push({ key: "history", label: HISTORY_LABELS[f.history] });
  list("pastCompanies", f.pastCompanies, (v) => `Ex-${v}`, "past companies");
  if (f.connectedWithinDays !== undefined) out.push({ key: "connectedWithinDays", label: `Connected in last ${f.connectedWithinDays} days` });
  if (f.dormant) out.push({ key: "dormant", label: "Dormant (never contacted)" });
  return out;
}

/**
 * A dead-end search should be one click from a live one: drop the narrowest
 * filter and say which one went.
 */
export function broaden(f: Filters, settings: Settings): { filters: Filters; removed: string } | null {
  const order: Array<keyof Filters> = [
    "roles", "seniorities", "audiences", "statuses", "history", "followUp", "hasEmail", "hasLinkedIn",
    "tags", "needsReview", "dormant", "connectedWithinDays", "connectedAfter", "connectedBefore",
    "targetOnly", "inPipeline", "industries", "companies", "pastCompanies", "functions", "domains", "q",
  ];
  const described = describeFilters(f, settings);
  for (const key of order) {
    const v = f[key];
    const set = Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "" && v !== false;
    if (!set) continue;
    return {
      filters: { ...f, [key]: undefined },
      removed: described.find((d) => d.key === key)?.label ?? String(key),
    };
  }
  return null;
}

export const HISTORY_LABELS: Record<NonNullable<Filters["history"]>, string> = {
  messaged: "You have messaged them",
  replied: "They replied to you",
  "no-reply": "Messaged, no reply",
  never: "Never messaged",
  "they-invited": "They invited you",
};

export const HEALTH_LABELS: Record<HealthIssue, string> = {
  duplicates: "Duplicates",
  "missing-position": "Missing position",
  "missing-company": "Missing company",
  "missing-email": "Missing email",
  "missing-linkedin": "Missing LinkedIn URL",
  unclassified: "No job title shared",
  "low-confidence": "Job title hard to place",
  manual: "Manually classified",
};

export const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
export const SENIORITY_ORDER = new Map<string, number>(SENIORITY_LEVELS.map((s, i) => [s, i]));
