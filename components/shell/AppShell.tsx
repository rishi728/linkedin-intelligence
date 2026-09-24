"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3, Bell, Building2, Cloud, Compass, Home, ListChecks, Plus, Search, Send,
  Menu as MenuIcon, Settings as SettingsIcon, Stethoscope, Users, X,
} from "lucide-react";
import { followUpBuckets } from "@/lib/workspace/insights";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { Composer } from "@/components/outreach/Composer";
import { ExportDialog } from "@/components/outreach/ExportDialog";
import { OpportunityWizard } from "@/components/find/OpportunityWizard";
import { PersonPanel } from "@/components/people/PersonPanel";
import { AddData } from "@/components/workspace/AddData";
import { Button, Spinner, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

// Grouped so the shape of the product is visible at a glance: find someone,
// talk to them, understand the whole, keep it clean.
const NAV: Array<{ section?: string; href: string; label: string; icon: typeof Home }> = [
  { href: "/home", label: "Home", icon: Home },
  { section: "Discover", href: "/find", label: "Find people", icon: Search },
  { href: "/people", label: "People", icon: Users },
  { section: "Conversations", href: "/outreach", label: "Outreach", icon: Send },
  { href: "/follow-ups", label: "Follow-ups", icon: Bell },
  { section: "Understand", href: "/analytics", label: "Network", icon: BarChart3 },
  { href: "/companies", label: "Companies", icon: Building2 },
  { section: "Keep it clean", href: "/review", label: "Review & improve", icon: ListChecks },
  { href: "/health", label: "Data health", icon: Stethoscope },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { ready, dataset, people, settings, savedAt } = useWorkspace();
  const { setPeopleFilters, toasts, dismissToast } = useUI();
  const pathname = usePathname();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (ready && !dataset) router.replace("/");
  }, [ready, dataset, router]);

  // Close the drawer when the route changes, without an effect: the compiler
  // rejects setState inside one, and this is the pattern used elsewhere here.
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    setNavPath(pathname);
    if (navOpen) setNavOpen(false);
  }

  if (!ready || !dataset) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label="Opening your workspace…" />
      </div>
    );
  }

  const buckets = followUpBuckets(people, settings);
  const due = buckets.overdue.length + buckets.today.length;
  const inPipeline = people.filter((p) => p.status !== "not_contacted").length;
  const toReview = people.filter((p) => p.needsReview && p.classSource === "auto").length;

  const counts: Record<string, number | undefined> = {
    "/people": people.length,
    "/outreach": inPipeline || undefined,
    "/follow-ups": due || undefined,
    "/review": toReview || undefined,
  };

  return (
    <div className="flex h-full">
      {navOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/25 md:hidden"
        />
      ) : null}

      <aside data-open={navOpen} className="nav-drawer flex w-[228px] shrink-0 flex-col border-r border-line bg-sidebar">
        <div className="flex h-12 items-center gap-2 px-4">
          <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-md bg-accent text-[11px] font-bold tracking-tight text-accent-ink">Li</span>
          <span className="truncate text-[13.5px] font-semibold tracking-tight">LinkedIn Intelligence</span>
        </div>

        <div className="px-2 pb-2">
          <button
            type="button"
            onClick={() => document.dispatchEvent(new CustomEvent("li:open-search"))}
            className="flex h-8 w-full items-center gap-2 rounded-lg border border-line bg-panel px-2 text-[12.5px] text-muted transition hover:border-line-strong hover:text-ink"
          >
            <Search size={14} />
            <span className="flex-1 text-left">Search everything</span>
            <kbd className="rounded border border-line px-1 text-[10.5px] text-faint">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-auto px-2 pb-3 scroll-thin">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const count = counts[item.href];
            return (
              <div key={item.href}>
                {item.section ? (
                  <p className="px-2 pb-1 pt-4 text-[10.5px] font-medium uppercase tracking-[0.1em] text-faint">
                    {item.section}
                  </p>
                ) : null}
                <Link
                  href={item.href}
                  prefetch={false}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "relative mb-0.5 flex h-8 items-center gap-2.5 rounded-lg pl-2.5 pr-2 text-[13px] transition",
                    active ? "bg-accent-soft/60 font-medium text-ink" : "text-ink-2 hover:bg-hover hover:text-ink",
                  )}
                >
                  {active ? (
                    <span aria-hidden className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r bg-accent" />
                  ) : null}
                  <item.icon size={15} className={active ? "text-accent" : "text-muted"} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {count !== undefined ? (
                    <span className={cx("tabular rounded px-1 text-[11px]", item.href === "/follow-ups" && due ? "tone-orange" : "text-muted")}>
                      {count.toLocaleString()}
                    </span>
                  ) : null}
                </Link>
              </div>
            );
          })}

          {settings.segments.length > 0 ? (
            <>
              <p className="mt-4 border-t border-line px-2 pb-1 pt-3 text-[10.5px] font-medium uppercase tracking-[0.1em] text-faint">Saved lists</p>
              {settings.segments.map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => {
                    setPeopleFilters(seg.filters);
                    router.push("/people");
                  }}
                  className="mb-0.5 flex h-7 w-full items-center gap-2 rounded-lg px-2 text-left text-[12.5px] text-ink-2 transition hover:bg-hover hover:text-ink"
                >
                  <Compass size={13} className="text-muted" />
                  <span className="truncate">{seg.name}</span>
                </button>
              ))}
            </>
          ) : null}
        </nav>

        <div className="border-t border-line p-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mb-1 flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-[13px] text-ink-2 transition hover:bg-hover hover:text-ink"
          >
            <Plus size={15} className="text-muted" />
            Add data
          </button>
          <Link
            href="/settings"
            prefetch={false}
            className={cx(
              "mb-1 flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] transition",
              pathname === "/settings" ? "bg-panel font-medium text-ink shadow-pop" : "text-ink-2 hover:bg-hover hover:text-ink",
            )}
          >
            <SettingsIcon size={15} className="text-muted" />
            Settings
          </Link>
          <p className="truncate px-2 text-[11px] text-muted" title={(dataset.files ?? []).map((f) => f.fileName).join(", ") || dataset.fileName}>
            {people.length.toLocaleString()} connections
            {(dataset.files?.length ?? 1) > 1 ? ` · ${dataset.files!.length} files` : ` · ${dataset.fileName}`}
          </p>
          <p className="flex items-center gap-1.5 px-2 pb-1 pt-0.5 text-[11px] text-muted" title="Everything you change is written to this browser automatically. Excel export is for sharing, not for safekeeping.">
            <Cloud size={11} className="text-[var(--t-green)]" />
            {savedAt ? `Saved locally · ${savedRelative(savedAt)}` : "Saved locally"}
          </p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-canvas">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-3 md:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
            className="grid size-8 place-items-center rounded-lg text-ink-2 transition hover:bg-hover"
          >
            <MenuIcon size={17} />
          </button>
          <span className="text-[13px] font-semibold tracking-tight">LinkedIn Intelligence</span>
        </div>
        {children}
      </main>

      <CommandPalette />
      <PersonPanel />
      <Composer />
      <ExportDialog />
      <OpportunityWizard />
      <AddData open={addOpen} onClose={() => setAddOpen(false)} />

      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="anim-pop pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-panel px-3 py-2 text-[13px] shadow-float">
            <span>{t.text}</span>
            {t.action ? (
              <Button
                size="sm"
                variant="subtle"
                onClick={() => {
                  t.action!.run();
                  dismissToast(t.id);
                }}
              >
                {t.action.label}
              </Button>
            ) : null}
            <button type="button" aria-label="Dismiss" onClick={() => dismissToast(t.id)} className="text-muted hover:text-ink">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function savedRelative(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`;
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short" });
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex h-auto min-h-12 shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-2.5">
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="truncate text-[12px] text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("scroll-thin min-h-0 flex-1 overflow-auto px-5 py-5", className)}>{children}</div>;
}
