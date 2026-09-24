"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, CheckCircle2, Compass, Search, Sparkles, Target, Users } from "lucide-react";
import { domainLabel, functionLabel } from "@/lib/intelligence";
import { applyFilters } from "@/lib/workspace/filters";
import { followUpBuckets } from "@/lib/workspace/insights";
import { hasGoals } from "@/lib/workspace/priority";
import { formatDate, relativeDue, todayISO } from "@/lib/workspace/dates";
import type { Filters, Person } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { Avatar, Button, Card, CardTitle, EmptyState, Pill, cx } from "@/components/ui";
import { StatusBadge } from "@/components/people/common";
import { ArchiveImport } from "@/components/workspace/ArchiveImport";
import { useUI, useWorkspace } from "@/components/workspace/store";

function ActionCard({ label, value, hint, icon: Icon, tone = "gray", onClick }: { label: string; value: string; hint: string; icon: React.ComponentType<{ size?: number; className?: string }>; tone?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col rounded-xl border border-line bg-panel p-4 text-left transition hover:border-line-strong hover:shadow-pop"
    >
      <span className="flex items-center justify-between">
        <span className={cx("grid size-7 place-items-center rounded-lg", `tone-${tone}`)}>
          <Icon size={14} />
        </span>
        <ArrowRight size={14} className="text-faint transition group-hover:translate-x-0.5 group-hover:text-accent" />
      </span>
      <span className="tabular mt-3 text-[26px] font-semibold leading-none tracking-tight">{value}</span>
      <span className="mt-1.5 text-[13px] font-medium">{label}</span>
      <span className="mt-0.5 text-[12px] text-muted">{hint}</span>
    </button>
  );
}

export function HomeView() {
  const { people, settings, dataset, archive, setStatus, updateRecord } = useWorkspace();
  const { setPeopleFilters, openPerson, openWizard, toast } = useUI();
  const router = useRouter();
  const today = todayISO();

  const buckets = useMemo(() => followUpBuckets(people, settings, today), [people, settings, today]);
  const due = [...buckets.overdue, ...buckets.today];
  const goalsSet = hasGoals(settings);

  const relevant = useMemo(() => {
    const f: Filters = goalsSet
      ? { domains: settings.goals.domains.length ? settings.goals.domains : undefined, functions: settings.goals.functions.length ? settings.goals.functions : undefined, targetOnly: settings.goals.domains.length || settings.goals.functions.length ? undefined : true }
      : { seniorities: ["Senior", "Manager / Lead", "Director / Head", "VP", "C-Level", "Founder"] };
    return applyFilters(people, f, settings);
  }, [people, settings, goalsSet]);

  const suggestions = useMemo(
    () => relevant.filter((p) => p.status === "not_contacted").sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 6),
    [relevant],
  );
  const notContacted = relevant.filter((p) => p.status === "not_contacted").length;
  const inPipeline = people.filter((p) => p.status !== "not_contacted").length;

  const goTo = (f: Filters) => {
    setPeopleFilters(f);
    router.push("/people");
  };

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader
        title={`${greeting}${settings.profile.name ? `, ${settings.profile.name.split(" ")[0]}` : ""}`}
        subtitle={`${people.length.toLocaleString()} connections · imported ${formatDate(new Date(dataset!.importedAt), true)}`}
        actions={
          <>
            <Button icon={Sparkles} onClick={() => openWizard(true)}>Guided search</Button>
            <Button variant="primary" icon={Search} onClick={() => router.push("/find")}>Find people</Button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ActionCard
            label="Your network"
            value={people.length.toLocaleString()}
            hint={`${new Set(people.map((p) => p.companyKey).filter(Boolean)).size.toLocaleString()} companies`}
            icon={Users}
            tone="blue"
            onClick={() => goTo({})}
          />
          <ActionCard
            label="People worth exploring"
            value={relevant.length.toLocaleString()}
            hint={goalsSet ? "In your target areas" : "Senior people — set goals to focus this"}
            icon={Target}
            tone="teal"
            onClick={() => goTo(goalsSet ? { domains: settings.goals.domains, functions: settings.goals.functions } : { seniorities: ["Senior", "Manager / Lead", "Director / Head", "VP", "C-Level", "Founder"] })}
          />
          <ActionCard
            label="Follow-ups due"
            value={due.length.toLocaleString()}
            hint={buckets.overdue.length ? `${buckets.overdue.length} overdue` : "Nothing overdue"}
            icon={Bell}
            tone={due.length ? "orange" : "gray"}
            onClick={() => router.push("/follow-ups")}
          />
          <ActionCard
            label="Not contacted yet"
            value={notContacted.toLocaleString()}
            hint={`${inPipeline.toLocaleString()} already in your pipeline`}
            icon={Compass}
            tone="violet"
            onClick={() => goTo({ statuses: ["not_contacted"], ...(goalsSet ? { domains: settings.goals.domains, functions: settings.goals.functions } : {}) })}
          />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "They replied to you", n: people.filter((p) => p.history?.theyReplied).length, f: { history: "replied" } as Filters, hint: "Warmest people in your network" },
            { label: "Messaged, no reply", n: people.filter((p) => p.history?.messageCount && !p.history.theyReplied).length, f: { history: "no-reply" } as Filters, hint: "Worth one more nudge" },
            { label: "Connected in 30 days", n: applyFilters(people, { connectedWithinDays: 30 }, settings).length, f: { connectedWithinDays: 30 } as Filters, hint: "Best time to say hello" },
            { label: "Dormant ties", n: applyFilters(people, { dormant: true }, settings).length, f: { dormant: true } as Filters, hint: "Old connections, never contacted" },
          ].map((x) => (
            <button
              key={x.label}
              type="button"
              onClick={() => goTo(x.f)}
              className="rounded-xl border border-line bg-panel px-3.5 py-2.5 text-left transition hover:border-line-strong"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] font-medium">{x.label}</span>
                <span className="tabular text-[14px] font-semibold">{x.n.toLocaleString()}</span>
              </span>
              <span className="mt-0.5 block text-[11.5px] text-muted">{x.hint}</span>
            </button>
          ))}
        </div>

        {!archive ? <div className="mt-4"><ArchiveImport /></div> : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <Card>
              <CardTitle hint={due.length ? "Reply or nudge these people today" : "You're all caught up"} action={<Button size="sm" onClick={() => router.push("/follow-ups")}>Open follow-ups</Button>}>
                Due today
              </CardTitle>
              <div className="p-2">
                {due.length === 0 ? (
                  <p className="px-2 py-6 text-center text-[12.5px] text-muted">No follow-ups due. Anyone you mark as contacted gets a reminder automatically.</p>
                ) : (
                  due.slice(0, 6).map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-hover">
                      <button type="button" onClick={() => openPerson(p.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                        <Avatar name={p.name} size={28} />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">{p.name}</span>
                          <span className="block truncate text-[12px] text-muted">{p.role}{p.company ? ` · ${p.company}` : ""}</span>
                        </span>
                      </button>
                      <Pill tone={p.followUpAt < today ? "orange" : "blue"}>{relativeDue(p.followUpAt, today)}</Pill>
                      <Button
                        size="sm"
                        icon={CheckCircle2}
                        onClick={() => {
                          updateRecord(p.id, { followUpAt: "", lastContactedAt: today }, { kind: "followup", text: "Follow-up completed" });
                          toast(`Marked ${p.name} as followed up.`);
                        }}
                      >
                        Done
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardTitle
                hint={goalsSet ? "Highest-priority people you haven't contacted" : "Set your goals to make these suggestions specific"}
                action={<Button size="sm" onClick={() => goTo({ statuses: ["not_contacted"], priorities: ["high"] })}>See all</Button>}
              >
                Suggested next conversations
              </CardTitle>
              <div className="p-2">
                {suggestions.length === 0 ? (
                  <EmptyState title="Nothing queued" body="Everyone in your target areas has been contacted — or you haven't set goals yet." action={<Button icon={Sparkles} onClick={() => openWizard(true)}>Run guided search</Button>} />
                ) : (
                  suggestions.map((p: Person) => (
                    <div key={p.id} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-hover">
                      <button type="button" onClick={() => openPerson(p.id)} className="flex min-w-0 flex-1 items-start gap-2.5 text-left">
                        <Avatar name={p.name} size={28} />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">{p.name}</span>
                          <span className="block truncate text-[12px] text-muted">
                            {p.role}{p.company ? ` · ${p.company}` : ""}
                          </span>
                          <span className="mt-0.5 block truncate text-[11.5px] text-ink-2">{p.priorityReasons[0] ?? `${domainLabel(p.domain)} · ${functionLabel(p.fn)}`}</span>
                        </span>
                      </button>
                      <Button size="sm" onClick={() => { setStatus([p.id], "to_contact"); toast(`${p.name} added to outreach.`); }}>
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardTitle hint="Drives priority and suggestions" action={<Button size="sm" onClick={() => router.push("/settings")}>Edit</Button>}>
                Your goals
              </CardTitle>
              <div className="space-y-2.5 p-4 pt-3">
                {goalsSet ? (
                  <>
                    {settings.goals.opportunityTypes.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {settings.goals.opportunityTypes.map((t) => <Pill key={t} tone="violet">{t}</Pill>)}
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-1.5">
                      {settings.goals.domains.map((d) => <Pill key={d} tone="teal">{domainLabel(d)}</Pill>)}
                      {settings.goals.functions.map((f) => <Pill key={f} tone="teal">{functionLabel(f)}</Pill>)}
                    </div>
                    {settings.targetCompanies.length ? (
                      <div>
                        <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">Target companies</p>
                        <div className="flex flex-wrap gap-1.5">
                          {settings.targetCompanies.slice(0, 8).map((c) => <Pill key={c} tone="gray">{c}</Pill>)}
                          {settings.targetCompanies.length > 8 ? <Pill tone="gray">+{settings.targetCompanies.length - 8}</Pill> : null}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="text-[12.5px] text-muted">Tell NetLens what you’re after — an internship in supply chain, referrals at specific companies — and it will rank your network for you.</p>
                    <Button variant="primary" size="sm" icon={Sparkles} onClick={() => openWizard(true)}>Set goals</Button>
                  </>
                )}
              </div>
            </Card>

            <Card>
              <CardTitle hint="Where your conversations stand" action={<Button size="sm" onClick={() => router.push("/outreach")}>Open board</Button>}>
                Pipeline
              </CardTitle>
              <div className="p-2">
                {settings.statuses.filter((s) => s.onBoard).map((s) => {
                  const n = people.filter((p) => p.status === s.id).length;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => goTo({ statuses: [s.id] })}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-hover"
                    >
                      <StatusBadge status={s.id} settings={settings} />
                      <span className="tabular text-[12.5px] text-ink-2">{n.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {settings.segments.length ? (
              <Card>
                <CardTitle hint="Saved views, always live">Segments</CardTitle>
                <div className="p-2">
                  {settings.segments.map((seg) => (
                    <button key={seg.id} type="button" onClick={() => goTo(seg.filters)} className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-hover">
                      <span className="truncate text-[12.5px]">{seg.name}</span>
                      <span className="tabular text-[12px] text-muted">{applyFilters(people, seg.filters, settings).length.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </PageBody>
    </>
  );
}
