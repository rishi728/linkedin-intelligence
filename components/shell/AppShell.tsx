"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3, Building2, Cloud, Compass, Home, ListChecks, Plus, Search, Send,
  Menu as MenuIcon, Settings as SettingsIcon, Stethoscope, Users, X,
} from "lucide-react";
import { followUpBuckets } from "@/lib/workspace/insights";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { Composer } from "@/components/outreach/Composer";
import { ExportDialog } from "@/components/outreach/ExportDialog";
import { OpportunityWizard } from "@/components/find/OpportunityWizard";
import { PersonPanel } from "@/components/people/PersonPanel";
import { AddData } from "@/components/workspace/AddData";
import { Logo } from "@/components/shell/Logo";
import { Guide } from "@/components/shell/Guide";
import { Setup } from "@/components/setup/Setup";
import { BackupNudge } from "@/components/shell/BackupNudge";
import { Button, Spinner, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

const SIDEBAR_NAV: Array<{ section?: string; href: string; label: string; icon: typeof Home }> = [
  { href: "/home", label: "Home", icon: Home },
  { section: "Discover", href: "/find", label: "Find people", icon: Search },
  { href: "/people", label: "People", icon: Users },
  { section: "Conversations", href: "/outreach", label: "Outreach", icon: Send },
  { section: "Understand", href: "/analytics", label: "Network", icon: BarChart3 },
  { href: "/companies", label: "Companies", icon: Building2 },
  { section: "Keep it clean", href: "/review", label: "Review", icon: ListChecks },
  { href: "/health", label: "Data health", icon: Stethoscope },
];

const BOTTOM_NAV: Array<{ href: string; label: string; short: string; icon: typeof Home; countKey?: string }> = [
  { href: "/home", label: "Home", short: "Home", icon: Home },
  { href: "/find", label: "Find people", short: "Find", icon: Search },
  { href: "/outreach", label: "Outreach", short: "Outreach", icon: Send },
  { href: "/people", label: "People", short: "People", icon: Users },
  { href: "/analytics", label: "Network", short: "Network", icon: BarChart3 },
  { href: "/health", label: "Data health", short: "Health", icon: Stethoscope },
  { href: "/review", label: "Review", short: "Review", icon: ListChecks, countKey: "/review" },
];

/** /session is the Outreach flow, so Outreach stays lit while you are in it. */
const isActive = (pathname: string, href: string) => {
  const path = pathname.replace(/\/$/, "");
  return path === href || (href === "/outreach" && path === "/session");
};

export function AppShell({ children }: { children: ReactNode }) {
  const { ready, dataset, people, building, settings, savedAt } = useWorkspace();
  const { setPeopleFilters, toasts, dismissToast } = useUI();
  const pathname = usePathname();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (ready && !dataset) router.replace("/");
  }, [ready, dataset, router]);

  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    setNavPath(pathname);
    if (sidebarOpen) setSidebarOpen(false);
  }

  if (!ready || !dataset || (building && people.length === 0)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label={ready && dataset ? "Preparing your network…" : "Opening your workspace…"} />
      </div>
    );
  }

  if (!settings.focus.confirmedAt && people.length > 0) return <Setup />;

  const buckets = followUpBuckets(people, settings);
  const due = buckets.overdue.length + buckets.today.length;
  const inPipeline = people.filter((p) => p.status !== "not_contacted").length;
  const toReview = people.filter((p) => p.needsReview && p.classSource === "classifier").length;

  const counts: Record<string, number | undefined> = {
    "/people": people.length,
    "/outreach": inPipeline || undefined,
    "/review": toReview || undefined,
  };

  return (
    <div className="flex h-full flex-col bg-[#FAFAF5]">
      <a
        href="#main"
        className="sr-only z-[80] rounded-lg bg-[#0C2D22] px-3 py-2 text-[13px] font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      {/* ============ TOP BAR ============ */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-[#E8E6DF] bg-white/90 px-4 backdrop-blur-md">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setSidebarOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium text-[#475569] transition hover:bg-[#f1f0eb] md:border md:border-[#E8E6DF] md:px-3"
        >
          <MenuIcon size={18} />
          <span className="hidden md:inline">Menu</span>
        </button>
        <Link href="/home" className="flex items-center gap-2" prefetch={false}>
          <Logo size={56} />
        </Link>
        <span className="hidden items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[11px] font-medium text-[#065f46] sm:flex">
          <span className={cx("size-1.5 rounded-full bg-[#10B981]", building && "animate-pulse")} />
          {building ? "Updating…" : `${people.length.toLocaleString()} conn. synced`}
        </span>
        <div className="mx-auto hidden max-w-xs flex-1 md:block">
          <button
            type="button"
            onClick={() => document.dispatchEvent(new CustomEvent("li:open-search"))}
            className="flex h-8 w-full items-center gap-2 rounded-full border border-[#E8E6DF] bg-[#FAFAF5] px-3 text-[12.5px] text-[#64748b] transition hover:border-[#d6d3c7]"
          >
            <Search size={13} />
            Search connections, companies...
          </button>
        </div>
        {people.length >= 5000 && (
          <span className="hidden items-center gap-1.5 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-semibold text-[#92400e] md:flex">
            Volume: &gt;{Math.floor(people.length / 1000) * 1000} (High Activity!)
          </span>
        )}
        <div className="hidden md:flex">
          <BackupNudge />
        </div>
        <Link
          href="/settings"
          prefetch={false}
          className="hidden items-center gap-1.5 rounded-full border border-[#E8E6DF] px-3 py-1.5 text-[11px] font-medium text-[#64748b] transition hover:bg-[#f1f0eb] hover:text-[#0f172a] md:flex"
        >
          <SettingsIcon size={12} />
          Settings
        </Link>
        <Link
          href="/?welcome"
          prefetch={false}
          className="hidden items-center gap-1.5 rounded-full border border-[#E8E6DF] px-3 py-1.5 text-[11px] font-medium text-[#64748b] transition hover:bg-[#f1f0eb] hover:text-[#0f172a] md:flex"
        >
          <Home size={12} />
          Main site
        </Link>
        <button
          type="button"
          aria-label="Search"
          onClick={() => document.dispatchEvent(new CustomEvent("li:open-search"))}
          className="grid size-9 place-items-center rounded-lg text-[#64748b] transition hover:bg-[#f1f0eb] md:hidden"
        >
          <Search size={17} />
        </button>
      </header>

      {/* ============ SIDEBAR DRAWER (mobile + desktop) ============ */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-50 bg-black/25"
        />
      )}
      <aside
        data-open={sidebarOpen}
        className={cx(
          "fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r border-[#E8E6DF] bg-white shadow-xl transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo size={48} />
            <span className="text-[14px] font-semibold tracking-tight text-[#0C2D22]">NesT</span>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="text-[#64748b] hover:text-[#0f172a]">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-auto px-3 pb-3">
          {SIDEBAR_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const count = counts[item.href];
            return (
              <div key={item.href}>
                {item.section && (
                  <p className="px-2 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                    {item.section}
                  </p>
                )}
                <Link
                  href={item.href}
                  prefetch={false}
                  onClick={() => setSidebarOpen(false)}
                  className={cx(
                    "mb-0.5 flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] transition",
                    active ? "bg-[#ecfdf5] font-medium text-[#065f46]" : "text-[#475569] hover:bg-[#f1f0eb]",
                  )}
                >
                  <item.icon size={15} className={active ? "text-[#047857]" : "text-[#64748b]"} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {count !== undefined && (
                    <span className="tabular text-[11px] text-[#64748b]">{count.toLocaleString()}</span>
                  )}
                </Link>
              </div>
            );
          })}
          {settings.segments.length > 0 && (
            <>
              <p className="mt-4 border-t border-[#E8E6DF] px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">Saved lists</p>
              {settings.segments.map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => { setPeopleFilters(seg.filters); router.push("/people"); setSidebarOpen(false); }}
                  className="mb-0.5 flex h-8 w-full items-center gap-2 rounded-lg px-3 text-left text-[12.5px] text-[#475569] transition hover:bg-[#f1f0eb]"
                >
                  <Compass size={13} className="text-[#64748b]" />
                  <span className="truncate">{seg.name}</span>
                </button>
              ))}
            </>
          )}
        </nav>
        <div className="border-t border-[#E8E6DF] p-3">
          <button
            type="button"
            onClick={() => { setAddOpen(true); setSidebarOpen(false); }}
            className="mb-1 flex h-8 w-full items-center gap-2.5 rounded-lg px-3 text-[13px] text-[#475569] transition hover:bg-[#f1f0eb]"
          >
            <Plus size={15} className="text-[#64748b]" />
            Add data
          </button>
          <Link
            href="/settings"
            prefetch={false}
            onClick={() => setSidebarOpen(false)}
            className="mb-1 flex h-8 items-center gap-2.5 rounded-lg px-3 text-[13px] text-[#475569] transition hover:bg-[#f1f0eb]"
          >
            <SettingsIcon size={15} className="text-[#64748b]" />
            Settings
          </Link>
          <p className="flex items-center gap-1.5 px-3 py-1 text-[11px] text-[#64748b]">
            <Cloud size={11} className="text-[#10B981]" />
            {savedAt ? `Saved locally · ${savedRelative(savedAt)}` : "Saved locally"}
          </p>
          <Link href="/?welcome" prefetch={false} className="flex items-center gap-1.5 px-3 pt-1 text-[11px] text-[#64748b] transition hover:text-[#0f172a]">
            <Home size={11} />
            Back to landing page
          </Link>
          <BackupNudge />
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <main id="main" tabIndex={-1} className="min-h-0 flex-1 overflow-auto pb-20 outline-none">
        {children}
      </main>

      {/* ============ BOTTOM NAV BAR ============ */}
      <div className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-24px)] max-w-4xl -translate-x-1/2">
        <nav aria-label="Primary" className="flex items-center justify-between gap-0.5 rounded-2xl border border-[#1f4a3b] bg-[#0C2D22] p-1.5 shadow-[0_10px_30px_rgba(12,45,34,0.35)] ring-1 ring-black/10">
          {BOTTOM_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const count = item.countKey ? counts[item.countKey] : undefined;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cx(
                  "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-all duration-200 sm:flex-row sm:gap-1.5 sm:px-2 sm:py-2.5 sm:text-[11.5px]",
                  active
                    ? "bg-[#34d399] font-bold text-[#06281d] shadow-md"
                    : "text-[#d1e7dd] hover:bg-white/10 hover:text-white",
                )}
              >
                <item.icon size={16} className={active ? "text-[#06281d]" : "text-[#6ee7b7]"} />
                <span className="hidden tracking-tight sm:inline">{item.label}</span>
                <span className="tracking-tight sm:hidden">{item.short}</span>
                {count !== undefined && count > 0 && (
                  <span className="absolute right-0.5 top-0 rounded-full bg-[#FEF3C7] px-1.5 text-[9px] font-bold text-[#92400e] sm:static sm:ml-0.5">
                    {count > 999 ? `${Math.round(count / 100) / 10}k` : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <CommandPalette />
      <PersonPanel />
      <Composer />
      <ExportDialog />
      <OpportunityWizard />
      <AddData open={addOpen} onClose={() => setAddOpen(false)} />
      <Guide />

      <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-20 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="anim-pop pointer-events-auto flex items-center gap-3 rounded-xl border border-[#E8E6DF] bg-white px-3 py-2 text-[13px] shadow-lg">
            <span>{t.text}</span>
            {t.action ? (
              <Button
                size="sm"
                variant="subtle"
                onClick={() => { t.action!.run(); dismissToast(t.id); }}
              >
                {t.action.label}
              </Button>
            ) : null}
            <button type="button" aria-label="Dismiss" onClick={() => dismissToast(t.id)} className="text-[#64748b] hover:text-[#0f172a]">
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
    <header className="flex h-auto min-h-12 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[#E8E6DF] bg-white px-4 py-2.5 sm:px-5">
      <div className="min-w-0 max-sm:basis-full">
        <h1 className="truncate text-[15px] font-semibold tracking-tight text-[#0f172a]">{title}</h1>
        {subtitle ? <p className="truncate text-[12px] text-[#64748b]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("min-h-0 flex-1 overflow-auto px-5 py-5", className)}>{children}</div>;
}
