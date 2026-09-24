"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, Cloud, Compass, Home, Plus, Search, Send, Settings as SettingsIcon, Users, X } from "lucide-react";
import { followUpBuckets } from "@/lib/workspace/insights";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { Composer } from "@/components/outreach/Composer";
import { ExportDialog } from "@/components/outreach/ExportDialog";
import { OpportunityWizard } from "@/components/find/OpportunityWizard";
import { PersonPanel } from "@/components/people/PersonPanel";
import { AddData } from "@/components/workspace/AddData";
import { Button, Spinner, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

// Five places, in the order you use them. Everything else lives inside a page.
const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/find", label: "Find people", icon: Search },
  { href: "/people", label: "People", icon: Users },
  { href: "/outreach", label: "Outreach", icon: Send },
  { href: "/analytics", label: "Intelligence", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { ready, dataset, people, settings, savedAt } = useWorkspace();
  const { setPeopleFilters, toasts, dismissToast } = useUI();
  const pathname = usePathname();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (ready && !dataset) router.replace("/");
  }, [ready, dataset, router]);

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

  const counts: Record<string, number | undefined> = {
    "/people": people.length,
    "/outreach": inPipeline || undefined,
  };

  return (
    <div className="flex h-full">
      <aside className="flex w-[228px] shrink-0 flex-col border-r border-line bg-sidebar">
        <div className="flex h-12 items-center gap-2 px-4">
          <span className="grid size-6 place-items-center rounded-md bg-accent text-[12px] font-bold text-accent-ink">N</span>
          <span className="text-[13.5px] font-semibold tracking-tight">NetLens</span>
        </div>

        <nav className="flex-1 overflow-auto px-2 pb-3 scroll-thin">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <div key={item.href}>
              <Link
                href={item.href}
                prefetch={false}
                className={cx(
                  "mb-0.5 flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] transition",
                  active ? "bg-panel font-medium text-ink shadow-pop" : "text-ink-2 hover:bg-hover hover:text-ink",
                )}
              >
                <item.icon size={15} className={active ? "text-accent" : "text-muted"} />
                <span className="flex-1 truncate">{item.label}</span>
                {counts[item.href] !== undefined ? (
                  <span className={cx("tabular rounded px-1 text-[11px]", item.href === "/outreach" && due ? "tone-orange" : "text-muted")}>
                    {counts[item.href]!.toLocaleString()}
                  </span>
                ) : null}
              </Link>
              </div>
            );
          })}

          {settings.segments.length > 0 ? (
            <>
              <p className="px-2 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wide text-muted">Segments</p>
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

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-canvas">{children}</main>

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
