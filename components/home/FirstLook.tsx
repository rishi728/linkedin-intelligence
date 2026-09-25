"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Target } from "lucide-react";
import { domainLabel } from "@/lib/intelligence";
import type { Filters, Person, Settings } from "@/lib/workspace/types";
import { Button, cx } from "@/components/ui";

interface Finding {
  n: number;
  headline: string;
  body: string;
  action: string;
  filters: Filters;
}

/**
 * The first thing someone sees after an import. Every card is a count taken
 * straight from their own connections, so it is a genuine look at what arrived
 * rather than a welcome screen dressed up with sample numbers. Cards with nothing
 * behind them are dropped instead of showing a zero.
 */
export function FirstLook({
  people,
  settings,
  onExplore,
  onSetGoals,
  onFind,
}: {
  people: Person[];
  settings: Settings;
  onExplore: (f: Filters) => void;
  onSetGoals: () => void;
  onFind: () => void;
}) {
  const findings = useMemo<Finding[]>(() => {
    const companies = new Set(people.map((p) => p.companyKey).filter(Boolean)).size;
    const founders = people.filter((p) => p.isFounder).length;
    const replied = people.filter((p) => p.history?.theyReplied).length;
    const senior = people.filter((p) =>
      ["Senior", "Manager / Lead", "Director / Head", "VP", "C-Level", "Founder"].includes(p.seniority),
    ).length;
    const alumni = people.filter((p) => p.isAlumni).length;

    const byDomain = new Map<string, number>();
    for (const p of people) {
      if (p.domain === "unclassified" || p.domain === "students") continue;
      byDomain.set(p.domain, (byDomain.get(p.domain) ?? 0) + 1);
    }
    const top = [...byDomain.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);

    const out: Finding[] = [
      {
        n: people.length,
        headline: "people are already in your network",
        body: `Across ${companies.toLocaleString()} companies. Every one has been sorted by what they do and how senior they are.`,
        action: "Look through them",
        filters: {},
      },
      ...top.map(([domain, n]) => ({
        n,
        headline: `work in ${domainLabel(domain).toLowerCase()}`,
        body: "One of the largest areas you have access to, and most of them have never been contacted.",
        action: `Explore ${domainLabel(domain).toLowerCase()}`,
        filters: { domains: [domain] } as Filters,
      })),
      {
        n: founders,
        headline: founders === 1 ? "founder is in your network" : "founders are in your network",
        body: "People who started something themselves, which usually means a short route to a decision.",
        action: "Explore founders",
        filters: { audiences: ["founders"] },
      },
      {
        n: senior,
        headline: "are senior enough to advise or refer",
        body: "Managers, directors and above. These are the people worth a considered message rather than a quick one.",
        action: "See who",
        filters: { seniorities: ["Senior", "Manager / Lead", "Director / Head", "VP", "C-Level", "Founder"] },
      },
      {
        n: replied,
        headline: "have written back to you before",
        body: "The warmest people you have. A second conversation is far easier than a first.",
        action: "See them",
        filters: { history: "replied" },
      },
      {
        n: alumni,
        headline: settings.profile.schools.length ? "share your school or campus" : "",
        body: "Shared ground makes an introduction easy to open.",
        action: "See alumni",
        filters: { audiences: ["alumni"] },
      },
    ];

    return out.filter((f) => f.n > 0 && f.headline);
  }, [people, settings.profile.schools.length]);

  const [i, setI] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  if (!findings.length) return null;

  const at = (n: number) => findings[((n % findings.length) + findings.length) % findings.length];
  const move = (d: 1 | -1) => {
    setDir(d === 1 ? "next" : "prev");
    setI((v) => v + d);
  };
  const f = at(i);

  return (
    <section className="anim-rise">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">Here is what came through</p>

      <div className="mt-3 flex items-stretch gap-3">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => move(-1)}
          className="grid w-8 shrink-0 place-items-center rounded-xl text-faint transition hover:bg-hover hover:text-ink"
        >
          <ChevronLeft size={18} />
        </button>

        <article
          key={i}
          className={cx(
            "min-w-0 flex-1 rounded-2xl border border-line bg-panel px-6 py-7",
            dir === "next" ? "anim-next" : "anim-prev",
          )}
        >
          <p className="tabular text-[42px] font-semibold leading-none tracking-tight">{f.n.toLocaleString()}</p>
          <p className="mt-2 text-[17px] font-medium tracking-tight">{f.headline}</p>
          <p className="mt-2 max-w-[56ch] text-[13px] leading-relaxed text-muted">{f.body}</p>
          <Button variant="primary" className="mt-4" onClick={() => onExplore(f.filters)}>{f.action}</Button>
        </article>

        <button
          type="button"
          aria-label="Next"
          onClick={() => move(1)}
          className="grid w-8 shrink-0 place-items-center rounded-xl text-faint transition hover:bg-hover hover:text-ink"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {findings.map((x, n) => (
          <button
            key={x.headline}
            type="button"
            aria-label={`Go to ${x.headline}`}
            onClick={() => { setDir(n > ((i % findings.length) + findings.length) % findings.length ? "next" : "prev"); setI(n); }}
            className={cx(
              "h-1.5 rounded-full transition-all",
              n === ((i % findings.length) + findings.length) % findings.length ? "w-6 bg-accent" : "w-1.5 bg-line-strong",
            )}
          />
        ))}
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <p className="max-w-[60ch] text-[14px] leading-relaxed">
          Next, say what you are actually after. Target areas, seniority and companies turn this from a list of names
          into a ranked shortlist, everywhere in the app.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" icon={Target} onClick={onSetGoals}>Set what you are looking for</Button>
          <Button icon={Search} onClick={onFind}>Or just go looking</Button>
        </div>
      </div>
    </section>
  );
}
