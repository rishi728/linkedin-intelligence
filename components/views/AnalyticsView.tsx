"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { bucketLabel, roleLabel } from "@/lib/knowledge/roles";
import { sectorLabel } from "@/lib/knowledge/sectors";
import { groupCompanies } from "@/lib/workspace/insights";
import type { Filters, Person } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { Avatar, Button, Input, Segmented, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

type Lens = "area" | "role" | "sector" | "company";

const LENS_LABEL: Record<Lens, string> = {
  area: "area of work",
  role: "job",
  sector: "sector",
  company: "company",
};


interface Group {
  key: string;
  label: string;
  people: Person[];
  filters: Filters;
}

/** How a group splits by where each person stands with you. Counts, never guesses. */
function split(people: Person[]) {
  let pipeline = 0;
  let spoken = 0;
  for (const p of people) {
    if (p.status !== "not_contacted") pipeline++;
    else if (p.history?.messageCount) spoken++;
  }
  return { pipeline, spoken, fresh: people.length - pipeline - spoken };
}

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">{children}</h2>
      {action}
    </div>
  );
}

/**
 * One group, as a proportional bar rather than a field of dots. The bar is the
 * navigation: each segment goes to exactly the people it represents.
 */
function GroupRow({ group, onGo }: { group: Group; onGo: (f: Filters) => void }) {
  const total = group.people.length;
  const { pipeline, spoken, fresh } = split(group.people);
  const pct = (n: number) => (total ? (n / total) * 100 : 0);

  return (
    <div className="group border-b border-line/60 py-3 last:border-0">
      <button
        type="button"
        onClick={() => onGo(group.filters)}
        className="flex w-full items-baseline justify-between gap-3 text-left"
      >
        <span className="truncate text-[13.5px] font-medium transition group-hover:text-accent">{group.label}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="tabular text-[13.5px] font-semibold">{total.toLocaleString()}</span>
          <ArrowRight size={13} className="text-faint opacity-0 transition group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100" />
        </span>
      </button>

      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-line/70">
        {pipeline > 0 ? (
          <button
            type="button"
            title={`${pipeline.toLocaleString()} in your pipeline`}
            aria-label={`${pipeline} in your pipeline`}
            onClick={() => onGo({ ...group.filters, statuses: undefined, history: undefined, inPipeline: true })}
            className="anim-bar bg-accent transition hover:brightness-110"
            style={{ width: `${pct(pipeline)}%` }}
          />
        ) : null}
        {spoken > 0 ? (
          <button
            type="button"
            title={`${spoken.toLocaleString()} you have spoken to`}
            aria-label={`${spoken} you have spoken to`}
            onClick={() => onGo({ ...group.filters, history: "messaged" })}
            className="anim-bar bg-accent/40 transition hover:brightness-110"
            style={{ width: `${pct(spoken)}%` }}
          />
        ) : null}
        {fresh > 0 ? (
          <button
            type="button"
            title={`${fresh.toLocaleString()} not contacted`}
            aria-label={`${fresh} not contacted`}
            onClick={() => onGo({ ...group.filters, statuses: ["not_contacted"], history: "never" })}
            className="anim-bar bg-line-strong/70 transition hover:brightness-95"
            style={{ width: `${pct(fresh)}%` }}
          />
        ) : null}
      </div>

      <p className="mt-1.5 text-[11.5px] text-muted">
        {pipeline > 0 ? <span className="text-ink-2">{pipeline.toLocaleString()} in your pipeline</span> : null}
        {pipeline > 0 && (spoken > 0 || fresh > 0) ? " · " : null}
        {spoken > 0 ? `${spoken.toLocaleString()} already spoken to` : null}
        {spoken > 0 && fresh > 0 ? " · " : null}
        {fresh > 0 ? `${fresh.toLocaleString()} not contacted` : null}
      </p>
    </div>
  );
}

export function AnalyticsView() {
  const { people, settings } = useWorkspace();
  const { setPeopleFilters, openPerson } = useUI();
  const router = useRouter();
  const [lens, setLens] = useState<Lens>("area");
  const [q, setQ] = useState("");

  const go = (filters: Filters) => {
    setPeopleFilters(filters);
    router.push("/people");
  };

  const known = useMemo(() => people.filter((p) => p.bucket), [people]);

  const groups: Group[] = useMemo(() => {
    const build = (key: (p: Person) => string, label: (k: string) => string, filters: (k: string) => Filters, source = known) => {
      const m = new Map<string, Person[]>();
      for (const p of source) {
        const k = key(p);
        if (!k) continue;
        (m.get(k) ?? m.set(k, []).get(k)!).push(p);
      }
      return [...m.entries()].map(([k, list]) => ({ key: k, label: label(k), people: list, filters: filters(k) }));
    };

    switch (lens) {
      case "role":
        return build((p) => p.roleId ?? "", (k) => roleLabel(k), (k) => ({ roles: [k] }))
          .sort((a, b) => b.people.length - a.people.length)
          .slice(0, 16);
      case "sector":
        return build((p) => p.sector ?? "", (k) => sectorLabel(k), (k) => ({ sectors: [k] }), people)
          .sort((a, b) => b.people.length - a.people.length);
      case "company":
        return groupCompanies(people, settings)
          .slice(0, 16)
          .map((c) => ({ key: c.key, label: c.name, people: c.people, filters: { companies: [c.key] } as Filters }));
      default:
        return build((p) => p.bucket ?? "", bucketLabel, (k) => ({ buckets: [k] })).sort((a, b) => b.people.length - a.people.length);
    }
  }, [known, people, settings, lens]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? groups.filter((g) => g.label.toLowerCase().includes(term)) : groups;
  }, [groups, q]);

  const biggest = groups[0];
  const companies = useMemo(() => groupCompanies(people, settings).slice(0, 8), [people, settings]);

  const founders = useMemo(() => people.filter((p) => p.isFounder), [people]);
  const unclear = useMemo(() => people.filter((p) => !p.bucket), [people]);
  const recruiters = useMemo(() => people.filter((p) => p.section === "recruitment"), [people]);
  const spokenTo = useMemo(() => people.filter((p) => p.history?.messageCount), [people]);

  /** Where the most people sit that you have never contacted. Computed, not judged. */
  const opportunities = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, fresh: split(g.people).fresh }))
        .filter((g) => g.fresh > 0)
        .sort((a, b) => b.fresh - a.fresh)
        .slice(0, 5),
    [groups],
  );

  const worthExploring = useMemo(
    () => people.filter((p) => p.status === "not_contacted").sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 6),
    [people],
  );

  return (
    <>
      <PageHeader
        title="Your network"
        subtitle={`${people.length.toLocaleString()} people · ${companies.length ? `${new Set(people.map((p) => p.companyKey).filter(Boolean)).size.toLocaleString()} companies` : "no companies yet"}`}
        actions={<Button variant="primary" icon={Search} onClick={() => router.push("/find")}>Find someone</Button>}
      />
      <PageBody className="px-6 py-6 xl:px-10">
        <div className="anim-stagger mx-auto w-full max-w-[1500px]">
          {/* ---- snapshot, as numbers you can walk through ------------------ */}
          <section className="grid grid-cols-2 gap-x-8 gap-y-5 border-b border-line pb-6 lg:grid-cols-4">
            {[
              { n: unclear.length, label: "Role unclear", hint: "Titles that name no job", f: { health: "unclassified" } as Filters },
              { n: founders.length, label: "Founders", hint: `${founders.filter((p) => p.status === "not_contacted").length.toLocaleString()} not contacted`, f: { audiences: ["founders"] } as Filters },
              { n: recruiters.length, label: "Recruiters", hint: "Can point you at openings", f: { audiences: ["recruiters"] } as Filters },
              { n: spokenTo.length, label: "Already spoken to", hint: spokenTo.length ? "From your message history" : "Add your archive to fill this in", f: { history: "messaged" } as Filters },
            ].map((s) => (
              <button key={s.label} type="button" onClick={() => go(s.f)} className="group text-left">
                <span className="tabular flex items-baseline gap-1.5 text-[30px] font-semibold leading-none tracking-tight">
                  {s.n.toLocaleString()}
                  <ArrowRight size={14} className="mb-1 text-faint opacity-0 transition group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100" />
                </span>
                <span className="mt-1.5 block text-[13px] font-medium group-hover:text-accent">{s.label}</span>
                <span className="block text-[11.5px] text-muted">{s.hint}</span>
              </button>
            ))}
          </section>

          {/* ---- the split: composition on the left, people on the right ---- */}
          <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)]">
            <section>
              <SectionLabel
                action={
                  <Segmented
                    value={lens}
                    onChange={(v) => { setLens(v); setQ(""); }}
                    options={[
                      { value: "area", label: "Area" },
                      { value: "role", label: "Job" },
                      { value: "sector", label: "Sector" },
                      { value: "company", label: "Company" },
                    ]}
                  />
                }
              >
                Where your people are
              </SectionLabel>

              {biggest ? (
                <p className="mb-4 max-w-[62ch] text-[14px] leading-relaxed">
                  <strong className="font-semibold">{biggest.label}</strong> is the largest {LENS_LABEL[lens]} in your
                  network, with <span className="tabular">{biggest.people.length.toLocaleString()}</span> people.
                  {split(biggest.people).fresh > 0 ? (
                    <span className="text-muted">
                      {" "}You have not contacted{" "}
                      <span className="tabular">{split(biggest.people).fresh.toLocaleString()}</span> of them.
                    </span>
                  ) : null}
                </p>
              ) : null}

              {groups.length > 8 ? (
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={`Search ${LENS_LABEL[lens]}s…`}
                  className="mb-2 max-w-xs"
                />
              ) : null}

              <div className="grid gap-x-10 xl:grid-cols-2">
                {shown.length ? (
                  shown.map((g) => <GroupRow key={g.key} group={g} onGo={go} />)
                ) : (
                  <p className="py-6 text-[12.5px] text-muted">Nothing matches “{q}”.</p>
                )}
              </div>
              <p className="mt-3 text-[11.5px] text-faint">
                Each bar splits into people in your pipeline, people you have spoken to, and people you have not
                contacted. Click any part to open exactly those people.
              </p>
            </section>

            {/* ---- who to look at, and where you already know someone ------- */}
            <div>
              <section>
                <SectionLabel action={<button type="button" onClick={() => go({ statuses: ["not_contacted"] })} className="text-[12px] text-muted transition hover:text-accent">See all →</button>}>
                  Worth exploring
                </SectionLabel>
                {worthExploring.length ? (
                  <div>
                    {worthExploring.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => openPerson(p.id)}
                        className="group flex w-full items-center gap-2.5 border-b border-line/50 py-2 text-left last:border-0"
                      >
                        <Avatar name={p.name} size={26} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium group-hover:text-accent">{p.name}</span>
                          <span className="block truncate text-[11.5px] text-muted">
                            {p.roleLabel}{p.company ? ` · ${p.company}` : ""}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12.5px] text-muted">Everyone senior is already in your pipeline.</p>
                )}
              </section>

              {companies.length ? (
                <section className="mt-8">
                  <SectionLabel action={<button type="button" onClick={() => router.push("/companies")} className="text-[12px] text-muted transition hover:text-accent">All companies →</button>}>
                    Who you know
                  </SectionLabel>
                  {companies.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => go({ companies: [c.key] })}
                      className="group flex w-full items-center gap-3 border-b border-line/50 py-2 text-left last:border-0"
                    >
                      <span className="flex -space-x-1.5">
                        {c.people.slice(0, 3).map((p) => (
                          <span key={p.id} className="ring-2 ring-[var(--canvas)]">
                            <Avatar name={p.name} size={20} />
                          </span>
                        ))}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium group-hover:text-accent">{c.name}</span>
                      <span className="tabular shrink-0 text-[12px] text-muted">{c.count.toLocaleString()}</span>
                    </button>
                  ))}
                </section>
              ) : null}
            </div>
          </div>

          {/* ---- where the conversations have not started yet -------------- */}
          {opportunities.length ? (
            <section className="mt-10 border-t border-line pt-6">
              <SectionLabel>Where the openings are</SectionLabel>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {opportunities.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => go({ ...g.filters, statuses: ["not_contacted"], history: "never" })}
                    className={cx(
                      "rounded-xl border border-line bg-panel p-3.5 text-left transition",
                      "hover:-translate-y-px hover:border-line-strong hover:shadow-pop",
                    )}
                  >
                    <span className="tabular block text-[20px] font-semibold leading-none tracking-tight">
                      {g.fresh.toLocaleString()}
                    </span>
                    <span className="mt-1.5 block truncate text-[12.5px] font-medium">{g.label}</span>
                    <span className="block text-[11.5px] text-muted">not contacted yet</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </PageBody>
    </>
  );
}
