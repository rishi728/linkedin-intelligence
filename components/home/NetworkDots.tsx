"use client";

import { useMemo } from "react";
import { domainLabel } from "@/lib/intelligence";
import type { Filters, Person } from "@/lib/workspace/types";
import { cx } from "@/components/ui";

/** One dot is one person, capped so a big area stays a shape rather than a wall. */
const MAX_DOTS = 48;

/**
 * The shape of the network, as clusters rather than bars. Hovering a dot names the
 * person; clicking opens them. Nothing is simulated — a dot exists because a
 * person does, and the overflow count says exactly how many are not drawn.
 */
export function NetworkDots({
  people,
  onOpenPerson,
  onOpenGroup,
}: {
  people: Person[];
  onOpenPerson: (id: string) => void;
  onOpenGroup: (f: Filters) => void;
}) {
  const groups = useMemo(() => {
    const m = new Map<string, Person[]>();
    for (const p of people) {
      if (p.domain === "unclassified") continue;
      const list = m.get(p.domain) ?? [];
      list.push(p);
      m.set(p.domain, list);
    }
    return [...m.entries()]
      .map(([domain, list]) => ({
        domain,
        list: [...list].sort((a, b) => b.priorityScore - a.priorityScore),
      }))
      .sort((a, b) => b.list.length - a.list.length)
      .slice(0, 6);
  }, [people]);

  if (!groups.length) return null;

  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      {groups.map(({ domain, list }) => {
        const shown = list.slice(0, MAX_DOTS);
        const hidden = list.length - shown.length;
        return (
          <div key={domain}>
            <button
              type="button"
              onClick={() => onOpenGroup({ domains: [domain] })}
              className="group mb-2 flex w-full items-baseline justify-between gap-2 text-left"
            >
              <span className="truncate text-[12.5px] font-medium transition group-hover:text-accent">
                {domainLabel(domain)}
              </span>
              <span className="tabular shrink-0 text-[12px] text-muted">{list.length.toLocaleString()}</span>
            </button>
            <div className="flex flex-wrap gap-[3px]">
              {shown.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={`${p.name} — ${p.role}${p.company ? ` · ${p.company}` : ""}`}
                  aria-label={`${p.name}, ${p.role}`}
                  onClick={() => onOpenPerson(p.id)}
                  className={cx(
                    "size-[9px] rounded-full transition hover:scale-[1.5]",
                    p.status !== "not_contacted"
                      ? "bg-accent"
                      : p.history?.messageCount
                        ? "bg-accent/55"
                        : "bg-line-strong hover:bg-accent/70",
                  )}
                />
              ))}
              {hidden > 0 ? (
                <button
                  type="button"
                  onClick={() => onOpenGroup({ domains: [domain] })}
                  className="ml-1 self-center text-[11px] text-faint transition hover:text-accent"
                >
                  +{hidden.toLocaleString()}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
