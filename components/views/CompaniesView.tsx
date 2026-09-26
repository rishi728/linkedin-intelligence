"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Download, Search, Star, UserPlus } from "lucide-react";
import { groupCompanies } from "@/lib/workspace/insights";
import { PageHeader } from "@/components/shell/AppShell";
import { Avatar, BarRow, Button, Card, CardTitle, Input, Pill, Segmented, Toggle, cx } from "@/components/ui";
import { ResearchMenu } from "@/components/people/common";
import { StatusMenu } from "@/components/people/StatusMenu";
import { useUI, useWorkspace } from "@/components/workspace/store";

export function CompaniesView() {
  const { people, settings, toggleTarget, setStatus } = useWorkspace();
  const { openPerson, setPeopleFilters, openExport, toast } = useUI();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"all" | "targets">("all");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const groups = useMemo(() => groupCompanies(people, settings), [people, settings]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return groups.filter((g) => (scope === "targets" ? g.isTarget : true) && (!term || g.name.toLowerCase().includes(term)));
  }, [groups, q, scope]);

  const active = useMemo(() => filtered.find((g) => g.key === activeKey) ?? filtered[0] ?? null, [filtered, activeKey]);

  return (
    <>
      <PageHeader
        title="Companies"
        subtitle={`${groups.length.toLocaleString()} companies · ${settings.targetCompanies.length} targets`}
        actions={
          <Segmented
            value={scope}
            onChange={setScope}
            options={[{ value: "all", label: "All" }, { value: "targets", label: "Targets" }]}
          />
        }
      />
      <div className="flex min-h-0 flex-1">
        <div className="flex w-[320px] shrink-0 flex-col border-r border-line">
          <div className="border-b border-line p-2.5">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies" className="pl-8" />
            </div>
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-auto p-1.5">
            {filtered.slice(0, 400).map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setActiveKey(g.key)}
                className={cx(
                  "mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition",
                  active?.key === g.key ? "bg-accent-soft" : "hover:bg-hover",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-medium">{g.name}</span>
                    {g.isTarget ? <Star size={11} className="shrink-0 fill-current text-accent" /> : null}
                  </span>
                  <span className="block truncate text-[11.5px] text-muted">{g.domains[0]?.[0]}{g.domains.length > 1 ? ` +${g.domains.length - 1}` : ""}</span>
                </span>
                <span className="tabular text-[12px] text-muted">{g.count}</span>
              </button>
            ))}
            {filtered.length === 0 ? <p className="px-2 py-6 text-center text-[12.5px] text-muted">No companies match.</p> : null}
          </div>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-auto p-5">
          {!active ? (
            <p className="text-[13px] text-muted">Pick a company to see who you know there.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-[18px] font-semibold tracking-tight">
                    <Building2 size={16} className="text-muted" />
                    {active.name}
                  </h2>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {active.count.toLocaleString()} connections · {active.sector}
                    {active.contacted ? ` · ${active.contacted} contacted` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1 text-[12.5px]">
                    Target
                    <Toggle checked={active.isTarget} onChange={() => toggleTarget(active.name)} label="Target company" />
                  </span>
                  <ResearchMenu person={{ ...active.people[0], company: active.name }} />
                  <Button size="sm" icon={Download} onClick={() => openExport({ filters: { companies: [active.key] }, title: active.name })}>Export</Button>
                  <Button
                    size="sm"
                    icon={UserPlus}
                    onClick={() => {
                      const ids = active.people.filter((p) => p.status === "not_contacted").map((p) => p.id);
                      setStatus(ids, "to_contact");
                      toast(`${ids.length} people at ${active.name} added to outreach.`);
                    }}
                  >
                    Add all to outreach
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <Card>
                  <CardTitle hint="What they do">Domains</CardTitle>
                  <div className="p-2">
                    {active.domains.slice(0, 8).map(([label, n]) => (
                      <BarRow key={label} label={label} value={n} max={active.count} />
                    ))}
                  </div>
                </Card>
                <Card>
                  <CardTitle hint="What they do there">Sections</CardTitle>
                  <div className="p-2">
                    {active.sections.slice(0, 8).map(([label, n]: [string, number]) => (
                      <BarRow key={label} label={label} value={n} max={active.count} />
                    ))}
                  </div>
                </Card>
                <Card>
                  <CardTitle hint="Most common roles">Roles</CardTitle>
                  <div className="p-2">
                    {active.roles.slice(0, 8).map(([label, n]) => (
                      <BarRow key={label} label={label} value={n} max={active.count} />
                    ))}
                  </div>
                </Card>
              </div>

              {(() => {
                const paths = [...active.people]
                  .map((p) => {
                    const why: string[] = [];
                    let score = 0;
                    if (p.history?.theyReplied) { score += 40; why.push("has replied to you before"); }
                    else if (p.history?.messageCount) { score += 15; why.push("you have messaged before"); }
                    if (p.isAlumni) { score += 25; why.push("shares your school"); }
                    if (p.history?.invited === "them") { score += 10; why.push("invited you to connect"); }
                    if (p.section === "recruitment") { score += 15; why.push("recruits for this company"); }
                    if (p.email) { score += 5; why.push("email available"); }
                    return { p, score, why };
                  })
                  .filter((x) => x.score > 0)
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 5);
                if (!paths.length) return null;
                return (
                  <Card className="mt-3">
                    <CardTitle hint="Ranked on the history in your own data: replies, shared campus, seniority">Best ways in</CardTitle>
                    <div className="p-2">
                      {paths.map(({ p, why }) => (
                        <div key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-hover">
                          <button type="button" onClick={() => openPerson(p.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                            <Avatar name={p.name} size={26} />
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-medium">{p.name}</span>
                              <span className="block truncate text-[11.5px] text-muted">{why.join(" · ")}</span>
                            </span>
                          </button>
                          <StatusMenu person={p} size="sm" align="right" />
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })()}

              <Card className="mt-3">
                <CardTitle
                  hint={`${active.people.length.toLocaleString()} people`}
                  action={<Button size="sm" onClick={() => { setPeopleFilters({ companies: [active.key] }); router.push("/people"); }}>Open in People</Button>}
                >
                  Who you know here
                </CardTitle>
                <div className="p-2">
                  {active.people.slice(0, 60).map((p) => (
                    <button key={p.id} type="button" onClick={() => openPerson(p.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-hover">
                      <Avatar name={p.name} size={26} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{p.name}</span>
                        <span className="block truncate text-[12px] text-muted">{p.position || p.roleLabel}</span>
                      </span>
                      <StatusMenu person={p} size="sm" align="right" />
                    </button>
                  ))}
                  {active.people.length > 60 ? (
                    <p className="px-2 py-2 text-[12px] text-muted">+{active.people.length - 60} more, open in People to see them all.</p>
                  ) : null}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
