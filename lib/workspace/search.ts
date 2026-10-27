// Ranked search over people and companies for the top search bar: reads the words with the
// same natural-language parser as the People page, ranks by how well each person matches,
// and decides what the first result (the one Enter opens) should be.

import type { CompanyOption } from "./engine";
import { applyFilters, describeFilters, parseQuery } from "./filters";
import { companyField, correctTypos, isAbbreviation, makeRanker, nameMatches, norm, tokenizeQuery } from "./textmatch";
import type { Filters, Person, Settings } from "./types";

// ---------------------------------------------------------------------------
// The whole search

export type SearchIntent = "name" | "company" | "people" | "none";

export interface SearchOutcome {
  query: string;
  /** Set when a typo was corrected: the text the results are actually for. */
  shownFor?: string;
  intent: SearchIntent;
  /** The best few people, best first. */
  people: Person[];
  /** Everyone the search finds, which is what "see all" opens. */
  total: number;
  filters: Filters;
  /** How the words were read, for display ("Product Management", "At Google"). */
  understood: string[];
  /** Conditions dropped because nobody matched all of them ("senior"), so the list is not empty. */
  dropped: string[];
  companies: CompanyOption[];
}

const EMPTY: Omit<SearchOutcome, "query"> = { intent: "none", people: [], total: 0, filters: {}, understood: [], dropped: [], companies: [] };

function companyRank(c: CompanyOption, words: string[]): number {
  const n = companyField(c);
  const joined = words.join(" ");
  if (n.trim() === joined) return 0;
  if (n.startsWith(` ${joined}`)) return 1;
  return words.every((w) => n.includes(` ${w}`)) ? 2 : 9;
}

/** What to give up first when nobody matches everything. The role or audience asked for goes last. */
const DROP_ORDER: Array<keyof Filters> = [
  "q", "sectors", "pastCompanies", "companies", "bands", "statuses", "history", "followUp", "hasEmail", "tags",
  "targetOnly", "dormant", "connectedWithinDays", "audiences", "categories", "roleFamilies",
];

/** Drops the least important condition, never the last one. */
function relax(f: Filters, settings: Settings): { filters: Filters; label: string } | null {
  const present = (Object.keys(f) as Array<keyof Filters>).filter((k) => {
    const v = f[k];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "" && v !== false;
  });
  if (present.length < 2) return null;
  const key = DROP_ORDER.find((k) => present.includes(k)) ?? present[present.length - 1];
  const next = { ...f };
  delete next[key];
  const label = key === "q" ? `"${f.q}"` : describeFilters({ [key]: f[key] } as Filters, settings)[0]?.label ?? String(key);
  return { filters: next, label };
}

/** "ex-flipkart", "former google", "previously at amazon" */
function pastCompanyOf(text: string): string | null {
  const m = /(?:^|\s)(?:ex|former|formerly|previously)[\s-]+(?:at\s+)?([\p{L}\p{N}&. ]{2,40})$/u.exec(text.toLowerCase().trim());
  return m ? m[1].trim() : null;
}

function run(text: string, ctx: { people: Person[]; companies: CompanyOption[]; settings: Settings }, limit: number) {
  const { people, companies, settings } = ctx;
  const { words } = tokenizeQuery(text);

  const past = pastCompanyOf(text);
  const parsed = past || isAbbreviation(text) ? { filters: {} as Filters, understood: [] as string[] } : parseQuery(text, companies, { schools: settings.profile.schools });
  let understood = parsed.understood;
  let filters: Filters = past ? { pastCompanies: [past] } : understood.length ? parsed.filters : { q: text };
  if (past) understood = [`Ex-${past.replace(/\w/g, (c) => c.toUpperCase())}`];
  const structured = understood.length > 0;

  let pool = applyFilters(people, filters, settings);
  if (past && !pool.length) {
    filters = { q: text };
    understood = [];
    pool = applyFilters(people, filters, settings);
  }

  // A dead end is one click from a live one: drop the narrowest condition and say which.
  const dropped: string[] = [];
  if (!pool.length && structured) {
    let f = filters;
    for (let i = 0; i < 3 && !pool.length; i++) {
      const b = relax(f, settings);
      if (!b) break;
      f = b.filters;
      dropped.push(b.label);
      pool = applyFilters(people, f, settings);
    }
    if (pool.length) filters = f;
    else dropped.length = 0;
  }

  const rank = makeRanker(text);
  const ranked = pool
    .map((p) => ({ p, s: (rank ? rank(p) : 0) + p.priorityScore / 100 }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);

  const named = !structured ? ranked.filter((p) => nameMatches(p, words)) : [];
  const top = (named.length ? named : ranked).slice(0, limit);

  const comps = companies
    .map((c) => ({ c, r: companyRank(c, words) }))
    .filter((x) => x.r < 9)
    .sort((a, b) => a.r - b.r || b.c.count - a.c.count)
    .slice(0, 4);

  let intent: SearchIntent = "none";
  if (named.length) intent = "name";
  else if (comps[0]?.r === 0 && !structured) intent = "company";
  else if (pool.length) intent = "people";
  else if (comps.length) intent = "company";

  return { intent, people: top, total: pool.length, filters, understood, dropped, companies: comps.map((x) => x.c) };
}

export function searchEverything(
  query: string,
  ctx: { people: Person[]; companies: CompanyOption[]; settings: Settings },
  limit = 6,
): SearchOutcome {
  const text = query.trim();
  if (norm(text).length < 2) return { query: text, ...EMPTY };

  const out = run(text, ctx, limit);
  if (out.total === 0 && out.companies.length === 0) {
    const fixed = correctTypos(text, ctx.people, ctx.companies);
    if (fixed) {
      const again = run(fixed, ctx, limit);
      if (again.total > 0 || again.companies.length > 0) return { query: text, shownFor: fixed, ...again };
    }
  }
  return { query: text, ...out };
}
