import Papa from "papaparse";
import { classify, type Basis, type Confidence } from "./classifier";
import {
  CATEGORY_IDS, SENIORITY_LEVELS, TAG_IDS,
  type CategoryId, type Seniority, type TagId,
} from "./taxonomy";
import { foldText } from "./text";

export interface Connection {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  url: string;
  email: string;
  company: string;
  position: string;
  connectedOn: Date | null;
  category: CategoryId;
  /** The classifier's choice, kept so manual overrides can be undone. */
  autoCategory: CategoryId;
  overridden: boolean;
  confidence: Confidence;
  basis: Basis;
  reasons: string[];
  alternative: CategoryId | null;
  seniority: Seniority;
  tags: TagId[];
}

export class CsvFormatError extends Error {}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

/** LinkedIn writes "15 Jan 2024"; older or localized exports use "01/15/24" or ISO dates. */
export function parseLinkedInDate(raw: string): Date | null {
  const v = raw.trim();
  if (!v) return null;
  let m = /^(\d{1,2})[\s-]([A-Za-z]{3,4})[a-z]*[\s-](\d{2,4})$/.exec(v);
  if (m && MONTHS[m[2].toLowerCase()] !== undefined) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(year, MONTHS[m[2].toLowerCase()], Number(m[1]));
  }
  m = /^([A-Za-z]{3,4})[a-z]*\s+(\d{1,2}),?\s+(\d{4})$/.exec(v);
  if (m && MONTHS[m[1].toLowerCase()] !== undefined) {
    return new Date(Number(m[3]), MONTHS[m[1].toLowerCase()], Number(m[2]));
  }
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(v);
  if (m) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(year, Number(m[1]) - 1, Number(m[2]));
  }
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t);
}

const FIELD_ALIASES: Record<string, string[]> = {
  firstName: ["first name", "firstname", "first", "given name", "vorname", "prenom", "nombre"],
  lastName: ["last name", "lastname", "last", "surname", "family name", "nachname", "apellido"],
  fullName: ["full name", "name", "contact name", "display name", "person"],
  url: ["url", "profile url", "linkedin url", "linkedin", "profile", "public profile url", "link"],
  email: ["email address", "email", "e-mail", "emailaddress", "mail"],
  company: ["company", "organization", "organisation", "employer", "company name", "current company", "account"],
  position: ["position", "title", "job title", "headline", "role", "designation", "current position"],
  connectedOn: ["connected on", "connected", "date connected", "connection date", "connected date", "date"],
};

/** The header row needs a name column plus something we can classify. */
function headerLooksLikeContacts(line: string): boolean {
  const l = line.toLowerCase();
  const hasName = /\bfirst\s*name\b/.test(l) || /\bfull\s*name\b/.test(l) || /(^|[,;\t"])\s*name\s*($|[,;\t"])/.test(l);
  const hasDetail = /\b(last\s*name|company|position|job title|title|organisation|organization|email|url|linkedin)\b/.test(l);
  return hasName && hasDetail;
}

export function parseConnectionsCsv(text: string): Connection[] {
  // LinkedIn puts a "Notes:" preamble above the header row; files that have been
  // re-saved or exported by other tools often start at the header instead.
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const headerIdx = lines.findIndex(headerLooksLikeContacts);
  if (headerIdx === -1) {
    throw new CsvFormatError(
      "We couldn't find a header row with names in this file. Use Connections.csv from your LinkedIn data export, it has First Name, Last Name, Company and Position columns.",
    );
  }

  const parsed = Papa.parse<Record<string, string>>(lines.slice(headerIdx).join("\n"), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.replace(/^﻿/, "").trim().toLowerCase(),
  });

  const headers = parsed.meta.fields ?? [];
  const col = (key: string) => FIELD_ALIASES[key].find((a) => headers.includes(a));
  const cols = Object.fromEntries(Object.keys(FIELD_ALIASES).map((k) => [k, col(k)])) as Record<string, string | undefined>;

  const out: Connection[] = [];
  parsed.data.forEach((row, i) => {
    const get = (k: string) => (cols[k] ? (row[cols[k]!] ?? "").trim() : "");
    // Some exports have a single "Name" column instead of first/last.
    const full = get("fullName");
    const firstName = get("firstName") || full.split(/\s+/)[0] || "";
    const lastName = get("lastName") || full.split(/\s+/).slice(1).join(" ");
    const company = get("company");
    const position = get("position");
    const url = get("url");
    if (!firstName && !lastName && !company && !position && !url) return;

    const c = classify(position, company);
    out.push({
      id: url || `${i}:${firstName}:${lastName}:${company}`,
      firstName,
      lastName,
      name: full || `${firstName} ${lastName}`.trim() || "(no name)",
      url,
      email: get("email"),
      company,
      position,
      connectedOn: parseLinkedInDate(get("connectedOn")),
      category: c.category,
      autoCategory: c.category,
      overridden: false,
      confidence: c.confidence,
      basis: c.basis,
      reasons: c.reasons,
      alternative: c.alternative,
      seniority: c.seniority,
      tags: c.tags,
    });
  });

  if (!out.length) throw new CsvFormatError("The file has a header row but no connections in it.");
  return out;
}

export function applyOverrides(connections: Connection[], overrides: Record<string, CategoryId>): Connection[] {
  return connections.map((c) => {
    const o = overrides[c.id];
    if (o && o !== c.autoCategory) return { ...c, category: o, overridden: true };
    if (c.overridden) return { ...c, category: c.autoCategory, overridden: false };
    return c;
  });
}

// ---------------------------------------------------------------------------
// Summary

export interface MonthPoint {
  key: string;
  label: string;
  added: number;
  total: number;
}

export interface CompanyStat {
  name: string;
  count: number;
}

export interface Summary {
  total: number;
  categoryCounts: Record<CategoryId, number>;
  tagCounts: Record<TagId, number>;
  seniorityCounts: Record<Seniority, number>;
  confidenceCounts: Record<Confidence, number>;
  timeline: MonthPoint[];
  topCompanies: CompanyStat[];
  uniqueCompanies: number;
  firstConnected: Date | null;
  lastConnected: Date | null;
  busiestMonth: MonthPoint | null;
  classifiedPct: number;
}

const LEGAL_SUFFIX = /\b(inc|llc|ltd|limited|pvt|private|corp|corporation|co|company|gmbh|plc|llp|sa|ag|bv|pty|srl)\b\.?/g;

export function companyKey(company: string): string {
  return foldText(company)
    .replace(/\(.*?\)/g, " ")
    .replace(/[&,.]/g, " ")
    .replace(LEGAL_SUFFIX, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MONTH_LABEL = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

export function summarize(connections: Connection[]): Summary {
  const zero = <K extends string>(keys: readonly K[]) => Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  const categoryCounts = zero(CATEGORY_IDS);
  const tagCounts = zero(TAG_IDS);
  const seniorityCounts = zero(SENIORITY_LEVELS);
  const confidenceCounts = zero(["high", "medium", "low"] as const);

  const byMonth = new Map<string, number>();
  const companies = new Map<string, { count: number; names: Map<string, number> }>();
  let first: Date | null = null;
  let last: Date | null = null;

  for (const c of connections) {
    categoryCounts[c.category]++;
    seniorityCounts[c.seniority]++;
    if (c.category !== "unspecified") confidenceCounts[c.confidence]++;
    for (const t of c.tags) tagCounts[t]++;

    if (c.connectedOn) {
      const d = c.connectedOn;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
      if (!first || d < first) first = d;
      if (!last || d > last) last = d;
    }

    const key = companyKey(c.company);
    if (key) {
      const entry = companies.get(key) ?? { count: 0, names: new Map() };
      entry.count++;
      entry.names.set(c.company, (entry.names.get(c.company) ?? 0) + 1);
      companies.set(key, entry);
    }
  }

  const timeline: MonthPoint[] = [];
  if (first && last) {
    let running = 0;
    const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
    const end = new Date(last.getFullYear(), last.getMonth(), 1);
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      const added = byMonth.get(key) ?? 0;
      running += added;
      timeline.push({ key, label: MONTH_LABEL.format(cursor), added, total: running });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  const topCompanies = [...companies.values()]
    .map((e) => ({
      name: [...e.names.entries()].sort((a, b) => b[1] - a[1])[0][0],
      count: e.count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 15);

  const busiestMonth = timeline.reduce<MonthPoint | null>((best, p) => (!best || p.added > best.added ? p : best), null);

  return {
    total: connections.length,
    categoryCounts,
    tagCounts,
    seniorityCounts,
    confidenceCounts,
    timeline,
    topCompanies,
    uniqueCompanies: companies.size,
    firstConnected: first,
    lastConnected: last,
    busiestMonth,
    classifiedPct: connections.length ? 1 - categoryCounts.unspecified / connections.length : 0,
  };
}
