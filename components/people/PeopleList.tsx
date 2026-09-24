"use client";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ExternalLink } from "lucide-react";
import { domainLabel, functionLabel } from "@/lib/intelligence";
import { formatDate, relativeDue, todayISO } from "@/lib/workspace/dates";
import type { Person } from "@/lib/workspace/types";
import { Avatar, Checkbox, EmptyState, Pill, cx } from "@/components/ui";
import { ConfidenceBadge, PRIORITY_LABEL, PRIORITY_TONE } from "./common";
import { StatusMenu } from "./StatusMenu";

export type ViewMode = "table" | "cards" | "compact";

const ROW_HEIGHT: Record<ViewMode, number> = { table: 54, cards: 196, compact: 34 };

function FollowUpCell({ person }: { person: Person }) {
  const today = todayISO();
  if (person.followUpAt) {
    const overdue = person.followUpAt < today;
    return (
      <span className={cx("text-[12px]", overdue ? "font-medium text-[var(--t-orange)]" : "text-ink-2")}>
        {relativeDue(person.followUpAt, today)}
      </span>
    );
  }
  if (person.nextAction) return <span className="truncate text-[12px] text-ink-2">{person.nextAction}</span>;
  if (person.lastContactedAt) return <span className="text-[12px] text-muted">Contacted {formatDate(person.lastContactedAt)}</span>;
  return <span className="text-[12px] text-faint">—</span>;
}

export function PeopleList({
  people, mode, selected, onSelect, onOpen, emptyAction, emptyBody,
}: {
  people: Person[];
  mode: ViewMode;
  selected: Set<string>;
  onSelect: (id: string, checked: boolean, shiftKey: boolean) => void;
  onOpen: (id: string) => void;
  emptyAction?: React.ReactNode;
  emptyBody?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [lanes, setLanes] = useState(2);

  useEffect(() => {
    if (mode !== "cards") return;
    const el = parentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setLanes(el.clientWidth > 1180 ? 3 : el.clientWidth > 720 ? 2 : 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  const virtualizer = useVirtualizer({
    count: people.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT[mode],
    overscan: 8,
    lanes: mode === "cards" ? lanes : 1,
  });

  return (
    <div ref={parentRef} className="scroll-thin min-h-0 flex-1 overflow-auto">
      {mode === "table" ? (
        <div className="sticky top-0 z-10 grid grid-cols-[30px_minmax(190px,2fr)_minmax(130px,1.1fr)_minmax(140px,1.2fr)_150px_34px] items-center gap-3 border-b border-line bg-canvas px-4 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          <span />
          <span>Person</span>
          <span>Company</span>
          <span>What they do</span>
          <span>Status</span>
          <span />
        </div>
      ) : null}

      {people.length === 0 ? (
        <div className="p-6">
          <EmptyState title="No people match these filters" body={emptyBody ?? "Try removing a filter, or search for something broader like “product” or “supply chain”."} action={emptyAction} />
        </div>
      ) : (
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((item) => {
            const person = people[item.index];
            const isSelected = selected.has(person.id);
            const style: React.CSSProperties = mode === "cards"
              ? { position: "absolute", top: 0, left: `${(item.lane * 100) / lanes}%`, width: `${100 / lanes}%`, height: item.size, transform: `translateY(${item.start}px)`, padding: 6 }
              : { position: "absolute", top: 0, left: 0, width: "100%", height: item.size, transform: `translateY(${item.start}px)` };

            if (mode === "cards") {
              return (
                <div key={person.id} style={style} ref={virtualizer.measureElement} data-index={item.index}>
                  <div className={cx("flex h-full flex-col rounded-xl border bg-panel p-3 transition hover:border-line-strong", isSelected ? "border-accent" : "border-line")}>
                    <div className="flex items-start gap-2.5">
                      <Checkbox checked={isSelected} onChange={(v) => onSelect(person.id, v, false)} />
                      <button type="button" onClick={() => onOpen(person.id)} className="flex min-w-0 flex-1 items-start gap-2.5 text-left">
                        <Avatar name={person.name} size={30} />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">{person.name}</span>
                          <span className="block truncate text-[12px] text-muted">{person.position || "No title shared"}</span>
                          <span className="block truncate text-[12px] text-ink-2">{person.company || "—"}</span>
                        </span>
                      </button>
                      {person.url ? (
                        <a href={person.url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent" aria-label={`Open ${person.name} on LinkedIn`}>
                          <ExternalLink size={13} />
                        </a>
                      ) : null}
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {person.domain !== "unclassified" ? <Pill tone="gray">{domainLabel(person.domain)}</Pill> : <Pill tone="gray">No role data</Pill>}
                      <Pill tone="gray">{person.seniority}</Pill>
                      <Pill tone={PRIORITY_TONE[person.priority]}>{PRIORITY_LABEL[person.priority]}</Pill>
                      {person.isTarget ? <Pill tone="teal">Target</Pill> : null}
                    </div>
                    {person.priorityReasons.length ? (
                      <p className="mt-2 line-clamp-2 min-h-[2.1em] text-[11.5px] leading-[1.45] text-muted" title={person.priorityReasons.join(" · ")}>
                        <span className="text-[var(--t-green)]">✓</span> {person.priorityReasons.slice(0, 2).join(" · ")}
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                      <StatusMenu person={person} size="sm" />
                      <FollowUpCell person={person} />
                    </div>
                  </div>
                </div>
              );
            }

            if (mode === "compact") {
              return (
                <div key={person.id} style={style} className={cx("flex items-center gap-3 border-b border-line/60 px-4 text-[12.5px] hover:bg-hover", isSelected && "bg-accent-soft/40")}>
                  <Checkbox checked={isSelected} onChange={(v) => onSelect(person.id, v, false)} />
                  <button type="button" onClick={() => onOpen(person.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span className="w-[190px] shrink-0 truncate font-medium">{person.name}</span>
                    <span className="w-[170px] shrink-0 truncate text-muted">{person.role}</span>
                    <span className="min-w-0 flex-1 truncate text-ink-2">{person.company}</span>
                  </button>
                  <span className="shrink-0"><StatusMenu person={person} size="sm" align="right" /></span>
                </div>
              );
            }

            return (
              <div
                key={person.id}
                style={style}
                className={cx(
                  "grid grid-cols-[30px_minmax(190px,2fr)_minmax(130px,1.1fr)_minmax(140px,1.2fr)_150px_34px] items-center gap-3 border-b border-line/60 px-4 transition hover:bg-hover",
                  isSelected && "bg-accent-soft/40",
                )}
              >
                <Checkbox checked={isSelected} onChange={(v) => onSelect(person.id, v, false)} />
                <button type="button" onClick={() => onOpen(person.id)} className="flex min-w-0 items-center gap-2.5 text-left">
                  <Avatar name={person.name} size={26} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-medium">{person.name}</span>
                      {person.needsReview ? <ConfidenceBadge person={person} showPercent={false} /> : null}
                    </span>
                    <span className="block truncate text-[12px] text-muted">{person.position || "No title shared"}</span>
                  </span>
                </button>
                <span className="truncate text-[12.5px] text-ink-2" title={person.company}>
                  {person.company || "—"}
                  {person.isTarget ? <span className="ml-1 text-[11px] text-accent">★</span> : null}
                </span>
                <span className="min-w-0 truncate text-[12.5px] text-ink-2" title={`${domainLabel(person.domain)} · ${functionLabel(person.fn)}`}>
                  {person.domain === "unclassified" ? <span className="text-muted">Role not shared</span> : (
                    <>
                      {domainLabel(person.domain)}
                      <span className="text-muted"> · {functionLabel(person.fn)}</span>
                    </>
                  )}
                </span>
                <span className="min-w-0"><StatusMenu person={person} /></span>
                {person.url ? (
                  <a href={person.url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent" aria-label={`Open ${person.name} on LinkedIn`}>
                    <ExternalLink size={13} />
                  </a>
                ) : <span />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
