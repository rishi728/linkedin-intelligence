"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { domainLabel, functionLabel } from "@/lib/intelligence";
import { SENIORITY_LEVELS } from "@/lib/taxonomy";
import { applyFilters } from "@/lib/workspace/filters";
import type { Filters, Person } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { BarRow, Card, CardTitle, Segmented } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

type Lens = "area" | "level" | "company" | "role";

const LENS_TITLE: Record<Lens, string> = {
  area: "What they work in",
  level: "How senior they are",
  company: "Where they work",
  role: "What their job is",
};

function tally(people: Person[], key: (p: Person) => string, filterFor: (v: string) => Filters) {
  const m = new Map<string, number>();
  for (const p of people) {
    const v = key(p);
    if (v) m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count, filters: filterFor(value) }));
}

/**
 * One page that answers one question: what kind of people do I actually know?
 * Every bar is a link into that group.
 */
export function AnalyticsView() {
  const { people, settings } = useWorkspace();
  const { setPeopleFilters } = useUI();
  const router = useRouter();
  const [lens, setLens] = useState<Lens>("area");

  const known = useMemo(() => people.filter((p) => p.domain !== "unclassified"), [people]);

  const rows = useMemo(() => {
    switch (lens) {
      case "level":
        return tally(known, (p) => p.seniority, (v) => ({ seniorities: [v] }))
          .sort((a, b) => SENIORITY_LEVELS.indexOf(a.value as never) - SENIORITY_LEVELS.indexOf(b.value as never));
      case "company":
        return tally(known.filter((p) => p.company), (p) => p.company, (v) => ({ q: v.toLowerCase() })).slice(0, 25);
      case "role":
        return tally(known, (p) => p.role, (v) => ({ roles: [v] })).slice(0, 25);
      default:
        return tally(known, (p) => p.domain, (v) => ({ domains: [v] })).map((r) => ({ ...r, value: domainLabel(r.value) , raw: r.value }));
    }
  }, [known, lens]);

  const go = (filters: Filters) => {
    setPeopleFilters(filters);
    router.push("/people");
  };

  const max = Math.max(1, ...rows.map((r) => r.count));
  const founders = people.filter((p) => p.isFounder).length;
  const students = people.filter((p) => p.domain === "students").length;
  const senior = applyFilters(people, { seniorities: ["Senior", "Manager / Lead", "Director / Head", "VP", "C-Level", "Founder"] }, settings).length;
  const talkedTo = people.filter((p) => p.history?.messageCount).length;

  return (
    <>
      <PageHeader title="Your network" subtitle={`${people.length.toLocaleString()} people you're connected to`} />
      <PageBody className="p-5">
        <div className="mx-auto w-full max-w-4xl">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Experienced people", n: senior, hint: "Senior and above", f: { seniorities: ["Senior", "Manager / Lead", "Director / Head", "VP", "C-Level", "Founder"] } as Filters },
              { label: "Founders", n: founders, hint: "People who started something", f: { audiences: ["founders"] } as Filters },
              { label: "Students", n: students, hint: "Still studying", f: { domains: ["students"] } as Filters },
              { label: "You've talked to", n: talkedTo, hint: "There's a conversation already", f: { history: "messaged" } as Filters },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => go(s.f)}
                className="rounded-xl border border-line bg-panel px-3.5 py-3 text-left transition hover:border-line-strong hover:shadow-pop"
              >
                <span className="tabular block text-[20px] font-semibold leading-tight">{s.n.toLocaleString()}</span>
                <span className="mt-0.5 block text-[12.5px] font-medium">{s.label}</span>
                <span className="block text-[11.5px] text-muted">{s.hint}</span>
              </button>
            ))}
          </div>

          <Card className="mt-4">
            <CardTitle
              hint="Click any row to see those people"
              action={
                <Segmented
                  value={lens}
                  onChange={setLens}
                  options={[
                    { value: "area", label: "Area" },
                    { value: "role", label: "Job" },
                    { value: "level", label: "Level" },
                    { value: "company", label: "Company" },
                  ]}
                />
              }
            >
              {LENS_TITLE[lens]}
            </CardTitle>
            <div className="p-2">
              {rows.length === 0 ? (
                <p className="px-2 py-6 text-center text-[12.5px] text-muted">Nothing to show yet.</p>
              ) : (
                rows.map((r) => <BarRow key={r.value} label={r.value} value={r.count} max={max} onClick={() => go(r.filters)} />)
              )}
            </div>
          </Card>

          {lens === "area" ? (
            <Card className="mt-3">
              <CardTitle hint="The most common jobs inside your biggest areas">A closer look</CardTitle>
              <div className="grid gap-4 p-4 pt-3 sm:grid-cols-2">
                {rows.slice(0, 4).map((r) => {
                  const inArea = known.filter((p) => domainLabel(p.domain) === r.value);
                  const byFn = tally(inArea, (p) => p.fn, (v) => ({ functions: [v] })).slice(0, 5);
                  return (
                    <div key={r.value}>
                      <p className="mb-1 text-[12.5px] font-medium">{r.value}</p>
                      {byFn.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => go(f.filters)}
                          className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-0.5 text-left text-[12px] text-muted transition hover:bg-hover hover:text-ink"
                        >
                          <span className="truncate">{functionLabel(f.value)}</span>
                          <span className="tabular shrink-0">{f.count}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}
        </div>
      </PageBody>
    </>
  );
}
