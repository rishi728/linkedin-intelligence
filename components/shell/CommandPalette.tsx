"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, BarChart3, Bell, Building2, Compass, Download, Home, KanbanSquare, ListChecks, Search,
  Send, Settings as SettingsIcon, Sparkles, Stethoscope, Users,
} from "lucide-react";
import { searchEverything } from "@/lib/workspace/search";
import { warmSearchIndex } from "@/lib/workspace/textmatch";
import type { Filters } from "@/lib/workspace/types";
import { Avatar, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  run: () => void;
}

/** ⌘K / Ctrl-K: jump anywhere, find anyone, start anything. */
export function CommandPalette() {
  const { people, companies, settings, dataset } = useWorkspace();
  const { openPerson, setPeopleFilters, openWizard, openExport } = useUI();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQ("");
        setActive(0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => {
      setOpen(true);
      setQ("");
      setActive(0);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("li:open-search", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("li:open-search", onOpen);
    };
  }, []);

  const go = (path: string, filters?: Filters) => {
    if (filters) setPeopleFilters(filters);
    router.push(path);
    setOpen(false);
  };

  const base: Command[] = useMemo(() => [
    { id: "home", label: "Home", icon: Home, run: () => go("/home") },
    { id: "find", label: "Find people", icon: Search, run: () => go("/find") },
    { id: "people", label: "All people", icon: Users, run: () => go("/people", {}) },
    { id: "companies", label: "Companies", icon: Building2, run: () => go("/companies") },
    { id: "outreach", label: "Outreach board", icon: KanbanSquare, run: () => go("/outreach") },
    { id: "review", label: "Review classifications", hint: `${people.filter((p) => p.needsReview || p.category === "unclassified").length} to check`, icon: ListChecks, run: () => go("/review") },
    { id: "session", label: "Start an outreach session", icon: Send, run: () => go("/session") },
    { id: "analytics", label: "Analytics", icon: BarChart3, run: () => go("/analytics") },
    { id: "health", label: "Data health", icon: Stethoscope, run: () => go("/health") },
    { id: "settings", label: "Settings", icon: SettingsIcon, run: () => go("/settings") },
    { id: "wizard", label: "Guided search", icon: Sparkles, run: () => { setOpen(false); openWizard(true); } },
    { id: "export", label: "Export to Excel", icon: Download, run: () => { setOpen(false); openExport({ filters: {}, title: "Full network" }); } },
    { id: "to-contact", label: "Show: to contact", icon: Compass, run: () => go("/people", { statuses: ["to_contact"] }) },
    { id: "replied", label: "Show: people who replied", icon: Compass, run: () => go("/people", { history: "replied" }) },
    { id: "dormant", label: "Show: dormant connections", icon: Compass, run: () => go("/people", { dormant: true }) },
    { id: "new", label: "Show: connected in the last 30 days", icon: Compass, run: () => go("/people", { connectedWithinDays: 30 }) },
    ...settings.segments.map((seg) => ({ id: `seg-${seg.id}`, label: `Segment: ${seg.name}`, icon: Compass, run: () => go("/people", seg.filters) })),
  ], [people, settings.segments]); // eslint-disable-line react-hooks/exhaustive-deps

  // Index everyone in the background as soon as the bar opens, so the first keystroke is not slow.
  useEffect(() => (open ? warmSearchIndex(people) : undefined), [open, people]);

  // Searching 50,000 people per keystroke is cheap, but typing should never wait on it.
  const deferredQ = useDeferredValue(q);
  const stale = deferredQ !== q;
  const search = useMemo(
    () => (open ? searchEverything(deferredQ, { people, companies, settings }) : null),
    [open, deferredQ, people, companies, settings],
  );

  type Row =
    | { kind: "all" }
    | { kind: "command"; c: Command }
    | { kind: "person"; p: (typeof people)[number] }
    | { kind: "company"; c: (typeof companies)[number] };

  const term = deferredQ.trim().toLowerCase();
  const flat = useMemo<Row[]>(() => {
    if (!term) return base.slice(0, 9).map((c) => ({ kind: "command", c }));
    const commands: Row[] = base.filter((c) => c.label.toLowerCase().includes(term)).slice(0, 4).map((c) => ({ kind: "command", c }));
    if (!search) return commands;
    const persons: Row[] = search.people.map((p) => ({ kind: "person", p }));
    const comps: Row[] = search.companies.map((c) => ({ kind: "company", c }));
    // Opening everything the search found is worth a row when there is more than the few shown,
    // or when the words were understood as a filter (even an honest zero).
    const all: Row[] = search.total > search.people.length || search.understood.length > 0 ? [{ kind: "all" }] : [];

    // Enter takes the first row, so the order says what the query most likely meant.
    if (commands.length && base.some((c) => c.label.toLowerCase() === term)) return [...commands, ...all, ...persons, ...comps];
    if (search.intent === "name") return [...persons, ...all, ...comps, ...commands];
    if (search.intent === "company") return [...comps, ...all, ...persons, ...commands];
    if (search.intent === "people") return [...all, ...persons, ...comps, ...commands];
    return [...all, ...commands, ...comps];
  }, [term, base, search]);

  if (!open || !dataset) return null;

  const runAt = (i: number) => {
    const item = flat[i];
    if (!item) return;
    if (item.kind === "command") item.c.run();
    if (item.kind === "person") {
      openPerson(item.p.id);
      setOpen(false);
    }
    if (item.kind === "company") go("/people", { companies: [item.c.key] });
    if (item.kind === "all" && search) go("/people", search.filters);
  };

  const label = (k: Row["kind"]) => (k === "person" ? "People" : k === "company" ? "Companies" : k === "command" ? "Go to" : "");

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/30 p-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="anim-pop w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-panel shadow-float">
        <div className="flex items-center gap-2 border-b border-line px-3.5">
          <Search size={15} className="text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, flat.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                runAt(active);
              }
            }}
            placeholder="Search a name, company, role or phrase…"
            className="h-11 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">esc</kbd>
        </div>

        <div className={cx("scroll-thin max-h-[52vh] overflow-auto p-1.5 transition-opacity", stale && "opacity-60")}>
          {search?.shownFor ? (
            <p className="px-2.5 pb-1 pt-1.5 text-[12px] text-muted">Showing results for <span className="font-medium text-ink">{search.shownFor}</span></p>
          ) : null}
          {search && search.dropped.length ? (
            <p className="px-2.5 pb-1 pt-1.5 text-[12px] text-muted">
              Nobody matches everything. Showing the closest, without {search.dropped.join(", ")}.
            </p>
          ) : null}
          {flat.length === 0 ? <p className="px-3 py-6 text-center text-[12.5px] text-muted">Nothing matches &ldquo;{q}&rdquo;. Try a name, a company or a role.</p> : null}

          {flat.map((item, i) => {
            const selected = i === active;
            const cls = cx("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition", selected ? "bg-accent-soft" : "hover:bg-hover");
            const heading = i > 0 && flat[i - 1].kind === item.kind ? "" : label(item.kind);
            const head = heading ? <p className="px-2.5 pb-0.5 pt-2 text-[10.5px] font-medium uppercase tracking-wide text-muted">{heading}</p> : null;
            let row: React.ReactNode = null;
            if (item.kind === "all" && search) {
              row = (
                <button type="button" onMouseEnter={() => setActive(i)} onClick={() => runAt(i)} className={cls}>
                  <Users size={14} className="text-accent" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">
                      {search.total ? `Show all ${search.total.toLocaleString()} ${search.total === 1 ? "person" : "people"}` : `Show ${search.understood.join(" · ")}`}
                    </span>
                    <span className="block truncate text-[11.5px] text-muted">
                      {search.total ? (search.dropped.length ? "Closest match" : search.understood.join(" · ") || `matching "${search.shownFor ?? search.query}"`) : "Nobody matches yet"}
                    </span>
                  </span>
                  <ArrowRight size={12} className={cx("text-faint", selected ? "opacity-100" : "opacity-0")} />
                </button>
              );
            } else if (item.kind === "command") {
              row = (
                <button type="button" onMouseEnter={() => setActive(i)} onClick={() => runAt(i)} className={cls}>
                  <item.c.icon size={14} className="text-muted" />
                  <span className="flex-1 truncate text-[13px]">{item.c.label}</span>
                  {item.c.hint ? <span className="text-[11.5px] text-muted">{item.c.hint}</span> : null}
                  <ArrowRight size={12} className={cx("text-faint", selected ? "opacity-100" : "opacity-0")} />
                </button>
              );
            } else if (item.kind === "person") {
              row = (
                <button type="button" onMouseEnter={() => setActive(i)} onClick={() => runAt(i)} className={cls}>
                  <Avatar name={item.p.name} size={22} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{item.p.name}</span>
                    <span className="block truncate text-[11.5px] text-muted">{[item.p.position || item.p.roleFamily, item.p.company].filter(Boolean).join(" · ")}</span>
                  </span>
                </button>
              );
            } else if (item.kind === "company") {
              row = (
                <button type="button" onMouseEnter={() => setActive(i)} onClick={() => runAt(i)} className={cls}>
                  <Building2 size={14} className="text-muted" />
                  <span className="flex-1 truncate text-[13px]">{item.c.name}</span>
                  <span className="tabular text-[11.5px] text-muted">{item.c.count} {item.c.count === 1 ? "person" : "people"}</span>
                </button>
              );
            }
            return (
              <div key={`r-${i}`}>
                {head}
                {row}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 border-t border-line px-3.5 py-1.5 text-[11px] text-muted">
          <span><kbd className="rounded border border-line px-1">&uarr;</kbd> <kbd className="rounded border border-line px-1">&darr;</kbd> move</span>
          <span><kbd className="rounded border border-line px-1">Enter</kbd> open</span>
          <span className="ml-auto hidden sm:inline">Try a name, a company, a role or a phrase like &ldquo;engineer at amazon&rdquo;</span>
        </div>
      </div>
    </div>
  );
}
