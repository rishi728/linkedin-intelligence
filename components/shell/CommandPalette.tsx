"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, BarChart3, Bell, Building2, Compass, Download, Home, KanbanSquare, ListChecks, Search,
  Send, Settings as SettingsIcon, Sparkles, Stethoscope, Users,
} from "lucide-react";
import { groupCompanies } from "@/lib/workspace/insights";
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
  const { people, settings, dataset } = useWorkspace();
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
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (path: string, filters?: Filters) => {
    if (filters) setPeopleFilters(filters);
    router.push(path);
    setOpen(false);
  };

  const companies = useMemo(() => (open ? groupCompanies(people, settings).slice(0, 400) : []), [open, people, settings]);

  const base: Command[] = useMemo(() => [
    { id: "home", label: "Home", icon: Home, run: () => go("/home") },
    { id: "find", label: "Find people", icon: Search, run: () => go("/find") },
    { id: "people", label: "All people", icon: Users, run: () => go("/people", {}) },
    { id: "companies", label: "Companies", icon: Building2, run: () => go("/companies") },
    { id: "outreach", label: "Outreach board", icon: KanbanSquare, run: () => go("/outreach") },
    { id: "followups", label: "Follow-ups", icon: Bell, run: () => go("/follow-ups") },
    { id: "review", label: "Review classifications", hint: `${people.filter((p) => p.needsReview || p.domain === "unclassified").length} to check`, icon: ListChecks, run: () => go("/review") },
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

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return { commands: base.slice(0, 9), persons: [], comps: [] as typeof companies };
    return {
      commands: base.filter((c) => c.label.toLowerCase().includes(term)).slice(0, 5),
      persons: people.filter((p) => p.haystack.includes(term)).slice(0, 6),
      comps: companies.filter((c) => c.name.toLowerCase().includes(term)).slice(0, 4),
    };
  }, [q, base, people, companies]);

  const flat = useMemo(
    () => [
      ...results.commands.map((c) => ({ kind: "command" as const, c })),
      ...results.persons.map((p) => ({ kind: "person" as const, p })),
      ...results.comps.map((c) => ({ kind: "company" as const, c })),
    ],
    [results],
  );

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
  };

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
            placeholder="Search people, companies or actions…"
            className="h-11 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">esc</kbd>
        </div>

        <div className="scroll-thin max-h-[52vh] overflow-auto p-1.5">
          {flat.length === 0 ? <p className="px-3 py-6 text-center text-[12.5px] text-muted">Nothing matches “{q}”.</p> : null}

          {flat.map((item, i) => {
            const selected = i === active;
            const cls = cx("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition", selected ? "bg-accent-soft" : "hover:bg-hover");
            if (item.kind === "command") {
              return (
                <button key={item.c.id} type="button" onMouseEnter={() => setActive(i)} onClick={() => runAt(i)} className={cls}>
                  <item.c.icon size={14} className="text-muted" />
                  <span className="flex-1 truncate text-[13px]">{item.c.label}</span>
                  {item.c.hint ? <span className="text-[11.5px] text-muted">{item.c.hint}</span> : null}
                  <ArrowRight size={12} className={cx("text-faint", selected ? "opacity-100" : "opacity-0")} />
                </button>
              );
            }
            if (item.kind === "person") {
              return (
                <button key={item.p.id} type="button" onMouseEnter={() => setActive(i)} onClick={() => runAt(i)} className={cls}>
                  <Avatar name={item.p.name} size={22} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{item.p.name}</span>
                    <span className="block truncate text-[11.5px] text-muted">{item.p.role}{item.p.company ? ` · ${item.p.company}` : ""}</span>
                  </span>
                </button>
              );
            }
            return (
              <button key={item.c.key} type="button" onMouseEnter={() => setActive(i)} onClick={() => runAt(i)} className={cls}>
                <Building2 size={14} className="text-muted" />
                <span className="flex-1 truncate text-[13px]">{item.c.name}</span>
                <span className="tabular text-[11.5px] text-muted">{item.c.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
