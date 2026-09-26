"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { applyFilters } from "@/lib/workspace/filters";
import { focusFilters, focusIsUseful } from "@/lib/workspace/focus";
import { followUpBuckets } from "@/lib/workspace/insights";
import { todayISO } from "@/lib/workspace/dates";
import type { Filters } from "@/lib/workspace/types";
import { PageBody } from "@/components/shell/AppShell";
import { Button } from "@/components/ui";
import { ArchiveImport } from "@/components/workspace/ArchiveImport";
import { NetworkShape } from "@/components/home/NetworkShape";
import { useUI, useWorkspace } from "@/components/workspace/store";

/**
 * One of the three numbers the whole product hangs off. It is a button, not a
 * card: the figure itself is the way into the people behind it.
 */
function Figure({ n, label, hint, onClick }: { n: number; label: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block rounded-2xl px-4 py-5 text-left transition duration-200 hover:bg-hover focus-visible:bg-hover"
    >
      <span className="tabular block text-[52px] font-semibold leading-none tracking-tight transition duration-200 group-hover:text-accent">
        {n.toLocaleString()}
      </span>
      <span className="mt-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
        {label}
        <ArrowRight
          size={12}
          className="opacity-0 transition duration-200 group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100"
        />
      </span>
      <span className="mt-1 block text-[12.5px] leading-relaxed text-muted">{hint}</span>
    </button>
  );
}

export function HomeView() {
  const { people, settings, archive } = useWorkspace();
  const { setPeopleFilters } = useUI();
  const router = useRouter();
  const today = todayISO();

  const goTo = (f: Filters, route = "/people") => {
    setPeopleFilters(f);
    router.push(route);
  };

  /** What the user said they are after, widened by the goals they picked. */
  const focus = useMemo(() => focusFilters(settings), [settings]);
  const focused = focusIsUseful(settings);

  const toContact = useMemo(
    () => applyFilters(people, { ...focus, statuses: ["not_contacted"] }, settings).length,
    [people, focus, settings],
  );
  const replied = useMemo(() => people.filter((p) => p.history?.theyReplied).length, [people]);

  const due = useMemo(() => {
    const b = followUpBuckets(people, settings, today);
    return b.overdue.length + b.today.length;
  }, [people, settings, today]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = settings.profile.name ? settings.profile.name.split(" ")[0] : "";

  const context = due
    ? `${due} ${due === 1 ? "conversation is" : "conversations are"} waiting on you today.`
    : settings.focus.direction
      ? settings.focus.direction
      : focused
        ? `${toContact.toLocaleString()} people match what you are looking for and have not been contacted.`
        : "Everything is up to date.";

  return (
    <PageBody className="px-6 py-14 sm:px-10">
      <div className="anim-stagger mx-auto w-full max-w-4xl">
        <header>
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight">
            {greeting}
            {firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-2 max-w-[56ch] text-[14.5px] leading-relaxed text-muted">{context}</p>
        </header>

        <section className="mt-12 grid gap-2 sm:grid-cols-3" aria-label="Your network at a glance">
          <Figure
            n={people.length}
            label="Total connections"
            hint="Everyone in your network"
            onClick={() => goTo({})}
          />
          <Figure
            n={toContact}
            label="People to contact"
            hint={focused ? "Match your focus, not yet contacted" : "Not yet contacted"}
            onClick={() => goTo({ ...focus, statuses: ["not_contacted"] })}
          />
          <Figure
            n={replied}
            label="Have replied"
            hint={archive ? "From your message history" : "Add your archive to fill this in"}
            onClick={() => goTo({ history: "replied" }, "/outreach")}
          />
        </section>

        <div className="mt-8 border-t border-line pt-6">
          <button
            type="button"
            onClick={() => router.push("/analytics")}
            className="group inline-flex items-center gap-1.5 text-[14px] font-medium transition duration-200 hover:text-accent"
          >
            View network overview
            <ArrowRight size={14} className="text-muted transition duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
          </button>
          {!focused ? (
            <p className="mt-4 max-w-[58ch] text-[13px] leading-relaxed text-muted">
              You have not told this what you are looking for yet, so &ldquo;people to contact&rdquo; is simply everyone
              you have not spoken to.{" "}
              <Button size="sm" variant="ghost" className="align-baseline" onClick={() => router.push("/settings")}>
                Set your focus
              </Button>
            </p>
          ) : null}
        </div>

        <NetworkShape people={people} onExplore={(f) => goTo(f)} />

        {!archive ? (
          <div className="mt-12">
            <ArchiveImport />
          </div>
        ) : null}
      </div>
    </PageBody>
  );
}
