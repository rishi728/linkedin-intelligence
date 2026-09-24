import { domainLabel } from "../intelligence";
import { companyMatches } from "./build";
import { dueBucket, todayISO, type DueBucket } from "./dates";
import { matchesHealth } from "./filters";
import type { HealthIssue, Person, Settings } from "./types";

export interface CompanyGroup {
  key: string;
  name: string;
  count: number;
  isTarget: boolean;
  industry: string;
  domains: Array<[string, number]>;
  roles: Array<[string, number]>;
  seniorities: Array<[string, number]>;
  contacted: number;
  highPriority: number;
  people: Person[];
}

const tally = (values: string[]) => {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

export function groupCompanies(people: Person[], settings: Settings): CompanyGroup[] {
  const map = new Map<string, Person[]>();
  for (const p of people) {
    if (!p.companyKey) continue;
    const list = map.get(p.companyKey) ?? [];
    list.push(p);
    map.set(p.companyKey, list);
  }
  return [...map.entries()].map(([key, list]) => {
    const names = tally(list.map((p) => p.company));
    return {
      key,
      name: names[0][0],
      count: list.length,
      isTarget: companyMatches(key, settings.targetCompanies),
      industry: tally(list.map((p) => p.industry))[0][0],
      domains: tally(list.map((p) => domainLabel(p.domain))),
      roles: tally(list.map((p) => p.role)),
      seniorities: tally(list.map((p) => p.seniority)),
      contacted: list.filter((p) => p.status !== "not_contacted").length,
      highPriority: list.filter((p) => p.priority === "high").length,
      people: list,
    };
  }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function followUpBuckets(people: Person[], settings: Settings, today = todayISO()) {
  const closed = new Set(settings.statuses.filter((s) => s.kind === "closed").map((s) => s.id));
  const buckets: Record<DueBucket, Person[]> = { overdue: [], today: [], tomorrow: [], week: [], later: [] };
  for (const p of people) {
    if (!p.followUpAt || closed.has(p.status)) continue;
    buckets[dueBucket(p.followUpAt, today)].push(p);
  }
  for (const list of Object.values(buckets)) list.sort((a, b) => a.followUpAt.localeCompare(b.followUpAt));
  return buckets;
}

export const HEALTH_ORDER: HealthIssue[] = [
  "unclassified", "low-confidence", "missing-position", "missing-company", "missing-email", "missing-linkedin", "duplicates", "manual",
];

export function healthCounts(people: Person[]): Record<HealthIssue, number> {
  const out = Object.fromEntries(HEALTH_ORDER.map((h) => [h, 0])) as Record<HealthIssue, number>;
  for (const p of people) for (const h of HEALTH_ORDER) if (matchesHealth(p, h)) out[h]++;
  return out;
}

export function countBy<T extends string>(people: Person[], get: (p: Person) => T): Array<[T, number]> {
  return tally(people.map(get)) as Array<[T, number]>;
}

export interface MonthPoint {
  key: string;
  label: string;
  added: number;
  total: number;
}

const MONTH_LABEL = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

/** Cumulative connections per month, with no gaps. */
export function growthTimeline(people: Array<{ connectedOn: Date | null }>): MonthPoint[] {
  const byMonth = new Map<string, number>();
  let first: Date | null = null;
  let last: Date | null = null;
  for (const p of people) {
    if (!p.connectedOn) continue;
    const d = p.connectedOn;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
    if (!first || d < first) first = d;
    if (!last || d > last) last = d;
  }
  if (!first || !last) return [];
  const out: MonthPoint[] = [];
  let running = 0;
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const end = new Date(last.getFullYear(), last.getMonth(), 1);
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const added = byMonth.get(key) ?? 0;
    running += added;
    out.push({ key, label: MONTH_LABEL.format(cursor), added, total: running });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}
