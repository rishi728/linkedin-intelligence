"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, ListChecks, Search, Send, Sparkles } from "lucide-react";
import { domainLabel } from "@/lib/intelligence";
import { applyFilters } from "@/lib/workspace/filters";
import { followUpBuckets } from "@/lib/workspace/insights";
import { hasGoals } from "@/lib/workspace/priority";
import { formatDate, relativeDue, todayISO } from "@/lib/workspace/dates";
import type { Filters, Person } from "@/lib/workspace/types";
import { PageBody } from "@/components/shell/AppShell";
import { Avatar, Button, EmptyState, cx } from "@/components/ui";
import { StatusMenu } from "@/components/people/StatusMenu";
import { ArchiveImport } from "@/components/workspace/ArchiveImport";
import { PeopleCarousel } from "@/components/home/PeopleCarousel";
import { Spark } from "@/components/shell/Spark";
import { useUI, useWorkspace } from "@/components/workspace/store";

const SENIOR = ["Senior", "Manager / Lead", "Director / Head", "VP", "C-Level", "Founder"];

/** A number you can act on. The arrow is the point: every figure goes somewhere. */
function Stat({ n, label, hint, onClick }: { n: number; label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group block text-left">
      <span className="tabular flex items-baseline gap-1.5 text-[28px] font-semibold leading-none tracking-tight">
        {n.toLocaleString()}
        <ArrowRight size={14} className="mb-1 text-faint opacity-0 transition group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100" />
      </span>
      <span className="mt-1.5 block text-[13px] font-medium text-ink group-hover:text-accent">{label}</span>
      {hint ? <span className="mt-0.5 block text-[12px] text-muted">{hint}</span> : null}
    </button>
  );
}

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">{children}</h2>
      {action}
    </div>
  );
}

function PersonRow({ person, onOpen, right }: { person: Person; onOpen: () => void; right?: React.ReactNode }) {
  return (
    <div className="group flex items-center gap-3 border-b border-line/50 py-2 last:border-0">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <Avatar name={person.name} size={28} />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium group-hover:text-accent">{person.name}</span>
          <span className="block truncate text-[12px] text-muted">
            {person.role}
            {person.company ? <span className="text-faint"> · {person.company}</span> : null}
          </span>
        </span>
      </button>
      {right}
    </div>
  );
}

export function HomeView() {
  const { people, settings, archive, completeFollowUp } = useWorkspace();
  const { setPeopleFilters, openPerson, openComposer, toast } = useUI();
  const router = useRouter();
  const today = todayISO();

  const buckets = useMemo(() => followUpBuckets(people, settings, today), [people, settings, today]);
  const due = [...buckets.overdue, ...buckets.today];
  const goalsSet = hasGoals(settings);

  const goalFilters: Filters = useMemo(
    () =>
      goalsSet
        ? {
            domains: settings.goals.domains.length ? settings.goals.domains : undefined,
            functions: settings.goals.functions.length ? settings.goals.functions : undefined,
          }
        : { seniorities: SENIOR },
    [goalsSet, settings.goals.domains, settings.goals.functions],
  );

  const relevant = useMemo(() => applyFilters(people, goalFilters, settings), [people, goalFilters, settings]);
  const suggestions = useMemo(
    () => relevant.filter((p) => p.status === "not_contacted").sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5),
    [relevant],
  );

  const companies = useMemo(() => new Set(people.map((p) => p.companyKey).filter(Boolean)).size, [people]);
  const founders = useMemo(() => people.filter((p) => p.isFounder), [people]);
  const foundersUncontacted = founders.filter((p) => p.status === "not_contacted").length;
  const inPipeline = people.filter((p) => p.status !== "not_contacted").length;
  const awaiting = people.filter((p) => p.status === "contacted" || p.status === "awaiting").length;
  const replied = people.filter((p) => p.history?.theyReplied).length;

  /** The largest area, used for the one closing insight. Real counts only. */
  const biggestArea = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of people) if (p.domain !== "unclassified" && p.domain !== "students") m.set(p.domain, (m.get(p.domain) ?? 0) + 1);
    const top = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? { domain: top[0], count: top[1] } : null;
  }, [people]);

  const needsReview = useMemo(() => people.filter((p) => p.needsReview && p.classSource === "auto").length, [people]);

  /** The last things you actually did, newest first, straight off each record. */
  const activity = useMemo(
    () =>
      people
        .flatMap((p) => p.activity.map((a) => ({ ...a, person: p })))
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 6),
    [people],
  );

  const goTo = (f: Filters) => {
    setPeopleFilters(f);
    router.push("/people");
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = settings.profile.name ? settings.profile.name.split(" ")[0] : "";

  return (
    <PageBody className="px-6 py-8 sm:px-10">
      <div className="anim-stagger mx-auto w-full max-w-5xl">
        {/* ---- the briefing ------------------------------------------------ */}
        <header>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight">
            {greeting}{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-1.5 max-w-[52ch] text-[14px] leading-relaxed text-muted">
            {people.length.toLocaleString()} people in your network.{" "}
            {due.length > 0
              ? `${due.length} ${due.length === 1 ? "conversation is" : "conversations are"} waiting on you today.`
              : suggestions.length > 0
                ? `${suggestions.length} worth starting a conversation with.`
                : "Everything is up to date."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary" icon={Search} onClick={() => router.push("/find")}>Find someone</Button>
            {inPipeline > 0 ? (
              <Button icon={Send} onClick={() => router.push("/outreach")}>Continue outreach</Button>
            ) : null}
          </div>
        </header>

        {/* ---- today: three things, each one a link ------------------------ */}
        <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3 border-y border-line py-3">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">Today</p>
          {[
            { n: due.length, label: due.length === 1 ? "follow-up due" : "follow-ups due", icon: Bell, go: () => router.push("/follow-ups") },
            { n: suggestions.length, label: "worth reaching out to", icon: Sparkles, go: () => goTo({ ...goalFilters, statuses: ["not_contacted"] }) },
            { n: needsReview, label: "profiles need review", icon: ListChecks, go: () => router.push("/review") },
          ]
            .filter((x) => x.n > 0)
            .map((x) => (
              <button key={x.label} type="button" onClick={x.go} className="group flex items-center gap-2 text-[13px]">
                <x.icon size={14} className="text-muted" />
                <span className="tabular font-semibold">{x.n.toLocaleString()}</span>
                <span className="text-muted transition group-hover:text-accent">{x.label}</span>
              </button>
            ))}
          {due.length + suggestions.length + needsReview === 0 ? (
            <span className="text-[13px] text-muted">Nothing needs you right now.</span>
          ) : null}
        </div>


        {/* ---- the shape of the network ------------------------------------ */}
        <section className="mt-10">
          <SectionLabel action={<button type="button" onClick={() => router.push("/analytics")} className="text-[12px] text-muted transition hover:text-accent">See the whole network →</button>}>
            Your network
          </SectionLabel>
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
            <Stat n={people.length} label="People" hint={`${companies.toLocaleString()} companies`} onClick={() => goTo({})} />
            <Stat
              n={relevant.length}
              label="Worth exploring"
              hint={goalsSet ? "In your target areas" : "Senior and above"}
              onClick={() => goTo(goalFilters)}
            />
            <Stat n={founders.length} label="Founders" hint={foundersUncontacted ? `${foundersUncontacted} not contacted` : "All contacted"} onClick={() => goTo({ audiences: ["founders"] })} />
            <Stat
              n={replied}
              label="Have replied to you"
              hint={archive ? "From your message history" : "Add your archive to fill this in"}
              onClick={() => goTo({ history: "replied" })}
            />
          </div>
        </section>

        {/* ---- today -------------------------------------------------------- */}
        {due.length > 0 ? (
          <section className="mt-10">
            <SectionLabel action={<button type="button" onClick={() => router.push("/follow-ups")} className="text-[12px] text-muted transition hover:text-accent">All follow-ups →</button>}>
              Waiting on you
            </SectionLabel>
            <div>
              {due.slice(0, 4).map((p) => (
                <PersonRow
                  key={p.id}
                  person={p}
                  onOpen={() => openPerson(p.id)}
                  right={
                    <span className="flex shrink-0 items-center gap-2">
                      <span className={cx("text-[12px]", buckets.overdue.includes(p) ? "text-[var(--t-orange)]" : "text-muted")}>
                        {relativeDue(p.followUpAt, today)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          completeFollowUp(p.id);
                          toast(`${p.name}, follow-up done.`);
                        }}
                      >
                        Done
                      </Button>
                    </span>
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* ---- who to talk to ---------------------------------------------- */}
        <section className="mt-10">
          <SectionLabel action={<button type="button" onClick={() => goTo({ ...goalFilters, statuses: ["not_contacted"] })} className="text-[12px] text-muted transition hover:text-accent">See all →</button>}>
            People worth talking to
          </SectionLabel>
          {suggestions.length === 0 ? (
            <EmptyState
              title="Nobody queued up"
              body={goalsSet ? "Everyone in your target areas is already in your pipeline." : "Set what you're looking for in Settings and this fills with the people who match."}
              action={<Button onClick={() => router.push(goalsSet ? "/find" : "/settings")}>{goalsSet ? "Find more people" : "Set your goals"}</Button>}
            />
          ) : (
            <PeopleCarousel
              people={suggestions}
              onOpen={openPerson}
              onStart={(id) => openComposer(id)}
            />
          )}
        </section>

        {/* ---- outreach, as a state of play, not four more boxes ----------- */}
        {inPipeline > 0 ? (
          <section className="mt-10">
            <SectionLabel action={<button type="button" onClick={() => router.push("/outreach")} className="text-[12px] text-muted transition hover:text-accent">Open outreach →</button>}>
              Your conversations
            </SectionLabel>
            <p className="max-w-[60ch] text-[14px] leading-relaxed">
              <button type="button" onClick={() => router.push("/outreach")} className="font-semibold tracking-tight transition hover:text-accent">
                {inPipeline.toLocaleString()} people
              </button>{" "}
              <span className="text-muted">are in your pipeline.</span>{" "}
              {awaiting > 0 ? <span className="text-muted">{awaiting.toLocaleString()} are waiting on a reply. </span> : null}
              {replied > 0 ? <span className="text-muted">{replied.toLocaleString()} have written back.</span> : null}
            </p>
          </section>
        ) : null}


        {/* ---- what you last did -------------------------------------------- */}
        {activity.length ? (
          <section className="mt-10">
            <SectionLabel>Recent activity</SectionLabel>
            <ol>
              {activity.map((a, i) => (
                <li key={`${a.person.id}-${a.at}-${i}`} className="flex items-baseline gap-3 border-b border-line/50 py-2 last:border-0">
                  <span aria-hidden className={cx("mt-1.5 size-1.5 shrink-0 rounded-full", a.kind === "status" ? "bg-accent" : a.kind === "followup" ? "dot-green" : "bg-line-strong")} />
                  <span className="min-w-0 flex-1 text-[13px]">
                    <button type="button" onClick={() => openPerson(a.person.id)} className="font-medium transition hover:text-accent">
                      {a.person.name}
                    </button>
                    <span className="text-muted">, {a.text}</span>
                  </span>
                  <span className="shrink-0 text-[11.5px] text-faint">{formatDate(new Date(a.at), true)}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <Spark categories={["networking", "outreach", "relationships", "conversation"]} className="mt-10" />

        {/* ---- one closing observation, computed, not invented -------------- */}
        {biggestArea ? (
          <section className="mt-10 border-t border-line pt-6">
            <SectionLabel>Worth noticing</SectionLabel>
            <p className="max-w-[58ch] text-[15px] leading-relaxed">
              <strong className="font-semibold">{domainLabel(biggestArea.domain)}</strong> is the largest area in your
              network, <span className="tabular">{biggestArea.count.toLocaleString()}</span> people.
              {foundersUncontacted > 0 ? (
                <>
                  {" "}You also know <span className="tabular">{founders.length.toLocaleString()}</span> founders, and
                  haven&apos;t spoken to <span className="tabular">{foundersUncontacted.toLocaleString()}</span> of them.
                </>
              ) : null}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => goTo({ domains: [biggestArea.domain] })}>
                Explore {domainLabel(biggestArea.domain).toLowerCase()}
              </Button>
              {foundersUncontacted > 0 ? (
                <Button variant="ghost" onClick={() => goTo({ audiences: ["founders"], statuses: ["not_contacted"] })}>
                  Explore founders
                </Button>
              ) : null}
            </div>
          </section>
        ) : null}

        {!archive ? <div className="mt-10"><ArchiveImport /></div> : null}
      </div>
    </PageBody>
  );
}
