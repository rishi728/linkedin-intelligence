"use client";

import { useMemo, useState } from "react";
import { Briefcase, Building2, MessageSquare, Search, Send, SlidersHorizontal, Sparkles, Users, X } from "lucide-react";
import { domainLabel, functionLabel } from "@/lib/intelligence";
import { DOMAINS, INDUSTRIES } from "@/lib/roles";
import { SENIORITY_LEVELS, TAGS } from "@/lib/taxonomy";
import { applyFilters, AUDIENCES, describeFilters, parseQuery } from "@/lib/workspace/filters";
import type { Filters, Person, Priority, Settings } from "@/lib/workspace/types";
import { Button, Checkbox, Input, Menu, MenuItem, MenuLabel, Pill, Select, cx } from "@/components/ui";

type ListKey = "domains" | "functions" | "roles" | "seniorities" | "companies" | "industries" | "statuses" | "priorities" | "tags" | "audiences";

interface Option {
  value: string;
  label: string;
  count?: number;
}

function MultiSelect({ label, options, selected, onChange, searchable }: { label: string; options: Option[]; selected: string[]; onChange: (v: string[]) => void; searchable?: boolean }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;
    return filtered.slice(0, 200);
  }, [options, q]);
  return (
    <>
      <MenuLabel>{label}</MenuLabel>
      {searchable ? (
        <div className="px-1 pb-1">
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-7 text-[12px]" />
        </div>
      ) : null}
      {shown.map((o) => (
        <MenuItem
          key={o.value}
          selected={selected.includes(o.value)}
          onClick={() => onChange(selected.includes(o.value) ? selected.filter((v) => v !== o.value) : [...selected, o.value])}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="truncate">{o.label}</span>
            {o.count !== undefined ? <span className="tabular shrink-0 text-[11px] text-muted">{o.count.toLocaleString()}</span> : null}
          </span>
        </MenuItem>
      ))}
      {!shown.length ? <p className="px-2 py-2 text-[12px] text-muted">No matches</p> : null}
    </>
  );
}

function TriggerButton({ label, icon, active, toggle }: { label: string; icon: typeof Users; active: number; toggle: () => void }) {
  return (
    <Button icon={icon} onClick={toggle} className={active ? "border-accent/60" : undefined}>
      {label}{active ? ` · ${active}` : ""}
    </Button>
  );
}

/** Filters worth one click, in the order a student actually reaches for them. */
const QUICK: Array<{ label: string; patch: Filters; on: (f: Filters) => boolean }> = [
  { label: "Target companies", patch: { targetOnly: true }, on: (f) => !!f.targetOnly },
  { label: "Never contacted", patch: { statuses: ["not_contacted"] }, on: (f) => f.statuses?.[0] === "not_contacted" && f.statuses.length === 1 },
  { label: "I've spoken to", patch: { history: "messaged" }, on: (f) => f.history === "messaged" },
  { label: "They replied", patch: { history: "replied" }, on: (f) => f.history === "replied" },
  { label: "Founders", patch: { audiences: ["founders"] }, on: (f) => f.audiences?.includes("founders") ?? false },
  { label: "Senior people", patch: { seniorities: ["Senior", "Manager / Lead", "Director / Head", "VP", "C-Level", "Founder"] }, on: (f) => (f.seniorities?.length ?? 0) > 3 },
  { label: "Has email", patch: { hasEmail: true }, on: (f) => f.hasEmail === true },
  { label: "Follow-up due", patch: { followUp: "overdue" }, on: (f) => f.followUp === "overdue" },
];

export function FilterBar({
  filters, onChange, people, settings, companies, right, placeholder = "Search people, or describe who you need…",
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  people: Person[];
  settings: Settings;
  companies: Array<{ key: string; name: string; count: number }>;
  right?: React.ReactNode;
  placeholder?: string;
}) {
  const [text, setText] = useState(filters.q ?? "");
  const [understood, setUnderstood] = useState<string[]>([]);

  /**
   * Counts shown next to each option reflect the *other* filters already applied,
   * so the numbers tell you what you'd actually get — one pass per facet, memoised.
   */
  const counts = useMemo(() => {
    const tally = <K extends keyof Filters>(key: K, get: (p: Person) => string | string[]) => {
      const m = new Map<string, number>();
      for (const p of applyFilters(people, { ...filters, [key]: undefined }, settings)) {
        const v = get(p);
        for (const one of Array.isArray(v) ? v : [v]) m.set(one, (m.get(one) ?? 0) + 1);
      }
      return m;
    };
    return {
      domains: tally("domains", (p) => p.domain),
      functions: tally("functions", (p) => p.fn),
      roles: tally("roles", (p) => p.role),
      seniorities: tally("seniorities", (p) => p.seniority),
      companies: tally("companies", (p) => p.companyKey),
      industries: tally("industries", (p) => p.industry),
      statuses: tally("statuses", (p) => p.status),
      tags: tally("tags", (p) => p.tags),
    };
  }, [people, settings, filters]);

  const set = (key: ListKey) => (values: string[]) => onChange({ ...filters, [key]: values.length ? values : undefined });
  const chips = describeFilters(filters, settings);
  const companyNames = useMemo(() => new Map(companies.map((c) => [c.key, c.name])), [companies]);

  /** Keep a selected option visible even when nothing else matches it any more. */
  const keep = (selected: string[] | undefined, o: Option) => o.count! > 0 || (selected ?? []).includes(o.value);

  const runSearch = () => {
    if (!text.trim()) {
      setUnderstood([]);
      onChange({ ...filters, q: undefined });
      return;
    }
    const parsed = parseQuery(text, companies, { schools: settings.profile.schools });
    setUnderstood(parsed.understood);
    onChange({ ...filters, ...parsed.filters });
  };

  const n = (...keys: Array<keyof Filters>) => keys.filter((k) => {
    const v = filters[k];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "" && v !== false;
  }).length;

  return (
    <div className="border-b border-line px-5 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (!e.target.value) {
                setUnderstood([]);
                onChange({ ...filters, q: undefined });
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder={placeholder}
            className="pl-8"
          />
          {text ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => { setText(""); setUnderstood([]); onChange({ ...filters, q: undefined }); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        {/* WHO */}
        <Menu width={250} trigger={({ toggle }) => <TriggerButton label="Who" icon={Users} active={n("domains", "seniorities", "audiences")} toggle={toggle} />}>
          {() => (
            <>
              <MultiSelect
                label="Area of work"
                selected={filters.domains ?? []}
                onChange={set("domains")}
                options={DOMAINS.map((d) => ({ value: d.id, label: d.label, count: counts.domains.get(d.id) ?? 0 })).filter((o) => keep(filters.domains, o))}
              />
              <MultiSelect
                label="Seniority"
                selected={filters.seniorities ?? []}
                onChange={set("seniorities")}
                options={SENIORITY_LEVELS.map((s) => ({ value: s, label: s, count: counts.seniorities.get(s) ?? 0 })).filter((o) => keep(filters.seniorities, o))}
              />
              <MultiSelect
                label="Who they are"
                selected={filters.audiences ?? []}
                onChange={(v) => onChange({ ...filters, audiences: v.length ? (v as Filters["audiences"]) : undefined })}
                options={AUDIENCES.map((a) => ({ value: a.id, label: a.label }))}
              />
            </>
          )}
        </Menu>

        {/* ROLE */}
        <Menu width={260} trigger={({ toggle }) => <TriggerButton label="Role" icon={Briefcase} active={n("functions", "roles")} toggle={toggle} />}>
          {() => (
            <>
              <MultiSelect
                label="Function"
                searchable
                selected={filters.functions ?? []}
                onChange={set("functions")}
                options={DOMAINS.flatMap((d) => d.functions.map((f) => ({ value: f.id, label: f.label, count: counts.functions.get(f.id) ?? 0 })))
                  .filter((o) => keep(filters.functions, o))
                  .sort((a, b) => b.count! - a.count!)}
              />
              <MultiSelect
                label="Exact role"
                searchable
                selected={filters.roles ?? []}
                onChange={set("roles")}
                options={[...counts.roles.entries()].sort((a, b) => b[1] - a[1]).map(([r, c]) => ({ value: r, label: r, count: c }))}
              />
            </>
          )}
        </Menu>

        {/* WHERE */}
        <Menu width={260} trigger={({ toggle }) => <TriggerButton label="Where" icon={Building2} active={n("companies", "industries", "targetOnly")} toggle={toggle} />}>
          {() => (
            <>
              <MultiSelect
                label="Company"
                searchable
                selected={filters.companies ?? []}
                onChange={set("companies")}
                options={companies.map((c) => ({ value: c.key, label: c.name, count: counts.companies.get(c.key) ?? 0 })).filter((o) => keep(filters.companies, o))}
              />
              <MultiSelect
                label="Industry"
                selected={filters.industries ?? []}
                onChange={set("industries")}
                options={INDUSTRIES.map((i) => ({ value: i, label: i, count: counts.industries.get(i) ?? 0 })).filter((o) => keep(filters.industries, o))}
              />
              <div className="px-2 pb-2 pt-1">
                <Checkbox checked={!!filters.targetOnly} onChange={(v) => onChange({ ...filters, targetOnly: v || undefined })} label="Target companies only" />
              </div>
            </>
          )}
        </Menu>

        {/* RELATIONSHIP */}
        <Menu width={260} trigger={({ toggle }) => <TriggerButton label="Relationship" icon={MessageSquare} active={n("history", "connectedWithinDays", "dormant", "pastCompanies")} toggle={toggle} />}>
          {() => (
            <>
              <MenuLabel>Conversation</MenuLabel>
              <div className="px-2 pb-2">
                <Select value={filters.history ?? ""} onChange={(e) => onChange({ ...filters, history: (e.target.value || undefined) as Filters["history"] })}>
                  <option value="">Any history</option>
                  <option value="messaged">You have messaged them</option>
                  <option value="replied">They replied to you</option>
                  <option value="no-reply">Messaged, no reply</option>
                  <option value="never">Never messaged</option>
                  <option value="they-invited">They invited you</option>
                </Select>
              </div>
              <MenuLabel>How you connected</MenuLabel>
              <div className="space-y-1.5 px-2 pb-2">
                <Select
                  value={filters.connectedWithinDays?.toString() ?? ""}
                  onChange={(e) => onChange({ ...filters, connectedWithinDays: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Connected any time</option>
                  <option value="30">Connected in the last 30 days</option>
                  <option value="90">Connected in the last 3 months</option>
                  <option value="365">Connected in the last year</option>
                </Select>
                <Checkbox
                  checked={!!filters.dormant}
                  onChange={(v) => onChange({ ...filters, dormant: v || undefined })}
                  label="Dormant — connected over a year ago, never contacted"
                />
              </div>
            </>
          )}
        </Menu>

        {/* OUTREACH */}
        <Menu width={230} trigger={({ toggle }) => <TriggerButton label="Outreach" icon={Send} active={n("statuses", "priorities", "followUp")} toggle={toggle} />}>
          {() => (
            <>
              <MultiSelect
                label="Stage"
                selected={filters.statuses ?? []}
                onChange={set("statuses")}
                options={settings.statuses.map((s) => ({ value: s.id, label: s.label, count: counts.statuses.get(s.id) ?? 0 }))}
              />
              <MultiSelect
                label="Priority"
                selected={filters.priorities ?? []}
                onChange={(v) => onChange({ ...filters, priorities: v.length ? (v as Priority[]) : undefined })}
                options={[{ value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]}
              />
              <MenuLabel>Follow-up</MenuLabel>
              <div className="px-2 pb-2">
                <Select value={filters.followUp ?? ""} onChange={(e) => onChange({ ...filters, followUp: (e.target.value || undefined) as Filters["followUp"] })}>
                  <option value="">Any</option>
                  <option value="overdue">Overdue</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="none">None scheduled</option>
                </Select>
              </div>
            </>
          )}
        </Menu>

        {/* MORE */}
        <Menu width={260} trigger={({ toggle }) => <TriggerButton label="More" icon={SlidersHorizontal} active={n("tags", "hasEmail", "hasLinkedIn", "needsReview", "connectedAfter", "connectedBefore", "locations")} toggle={toggle} />}>
          {() => (
            <>
              <MultiSelect
                label="Tags"
                searchable
                selected={filters.tags ?? []}
                onChange={set("tags")}
                options={[...new Set([...TAGS.map((t) => t.label), ...counts.tags.keys()])]
                  .map((t) => ({ value: t, label: t, count: counts.tags.get(t) ?? 0 }))
                  .filter((o) => keep(filters.tags, o))}
              />
              <MenuLabel>How to reach them</MenuLabel>
              <div className="space-y-1.5 px-2 pb-2">
                <Checkbox checked={filters.hasEmail === true} onChange={(v) => onChange({ ...filters, hasEmail: v || undefined })} label="Has an email address" />
                <Checkbox checked={filters.hasLinkedIn === true} onChange={(v) => onChange({ ...filters, hasLinkedIn: v || undefined })} label="Has a LinkedIn URL" />
              </div>
              <MenuLabel>Classification</MenuLabel>
              <div className="px-2 pb-2">
                <Checkbox checked={!!filters.needsReview} onChange={(v) => onChange({ ...filters, needsReview: v || undefined })} label="Low confidence — needs review" />
              </div>
              <MenuLabel>Connected between</MenuLabel>
              <div className="flex items-center gap-1.5 px-2 pb-2">
                <Input type="date" value={filters.connectedAfter ?? ""} onChange={(e) => onChange({ ...filters, connectedAfter: e.target.value || undefined })} className="h-7 text-[12px]" />
                <Input type="date" value={filters.connectedBefore ?? ""} onChange={(e) => onChange({ ...filters, connectedBefore: e.target.value || undefined })} className="h-7 text-[12px]" />
              </div>
            </>
          )}
        </Menu>

        {right}
      </div>

      {/* One-click shortcuts */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {QUICK.map((q) => {
          const on = q.on(filters);
          return (
            <button
              key={q.label}
              type="button"
              onClick={() => onChange(on ? { ...filters, ...Object.fromEntries(Object.keys(q.patch).map((k) => [k, undefined])) } : { ...filters, ...q.patch })}
              className={cx(
                "rounded-md border px-2 py-0.5 text-[11.5px] transition",
                on ? "border-accent bg-accent-soft/40 text-ink" : "border-line text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {q.label}
            </button>
          );
        })}
      </div>

      {(chips.length > 0 || understood.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {understood.length ? (
            <Pill tone="teal" title="How your search was interpreted">
              <Sparkles size={11} />
              {understood.join(" · ")}
            </Pill>
          ) : null}
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange({ ...filters, [chip.key]: undefined })}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-subtle px-1.5 py-0.5 text-[11.5px] text-ink-2 transition hover:border-line-strong hover:text-ink"
            >
              {chip.key === "companies" && filters.companies?.length === 1 ? companyNames.get(filters.companies[0]) ?? chip.label : chip.label}
              <X size={11} />
            </button>
          ))}
          {chips.length > 1 ? (
            <button type="button" onClick={() => onChange({ q: filters.q })} className="text-[11.5px] text-muted underline-offset-2 hover:text-ink hover:underline">
              Clear all
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export { domainLabel, functionLabel };
