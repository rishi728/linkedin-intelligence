"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { applyFilters } from "@/lib/workspace/filters";
import { focusFilters, focusIsUseful } from "@/lib/workspace/focus";
import { followUpBuckets } from "@/lib/workspace/insights";
import { todayISO } from "@/lib/workspace/dates";
import type { Filters } from "@/lib/workspace/types";
import { Button } from "@/components/ui";
import { ArchiveImport } from "@/components/workspace/ArchiveImport";
import { NetworkShape } from "@/components/home/NetworkShape";
import { useUI, useWorkspace } from "@/components/workspace/store";

export function HomeView() {
  const { people, settings, archive } = useWorkspace();
  const { setPeopleFilters } = useUI();
  const router = useRouter();
  const today = todayISO();

  const goTo = (f: Filters, route = "/people") => {
    setPeopleFilters(f);
    router.push(route);
  };

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
    : "Everything is up to date.";

  const unreachedPct = people.length ? Math.round((toContact / people.length) * 100) : 0;
  const responsePct = replied && people.length ? ((replied / people.length) * 100).toFixed(1) : "0";

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 40px" }}>
      {/* ====== GREETING ====== */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <img src="/nest-logo.webp" alt="" style={{ width: 56, height: 56, objectFit: "contain", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {greeting}{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p style={{ fontSize: 14, color: "#94a3b8", marginTop: 2 }}>{context}</p>
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 12,
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", whiteSpace: "nowrap", marginTop: 1 }}>
              NeST INTELLIGENCE ASSISTANT
            </span>
            <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
              &ldquo;Wooaah, you are so much active! of <strong>{people.length.toLocaleString()} connections</strong> is an incredible network. Let&rsquo;s find your warmest signals.&rdquo;
            </p>
          </div>
        </div>
        {!focused && (
          <div style={{
            flexShrink: 0, padding: "8px 14px", borderRadius: 10,
            border: "1px solid #E8E6DF", background: "#fff",
            textAlign: "center",
          }}>
            <p style={{ fontSize: 11, color: "#94a3b8" }}>Looking for warm intros?</p>
            <button
              onClick={() => router.push("/settings")}
              style={{
                fontSize: 12, fontWeight: 600, color: "#059669", cursor: "pointer",
                background: "none", border: "none", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 4, marginTop: 2,
              }}
            >
              Set your target focus &gt;
            </button>
          </div>
        )}
      </div>

      {/* ====== STAT CARDS ====== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" style={{ marginBottom: 32 }}>
        <button
          type="button"
          onClick={() => goTo({})}
          style={{
            textAlign: "left", padding: "20px 18px", borderRadius: 16,
            border: "1px solid #E8E6DF", background: "#fff", cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" fill="none" stroke="#D97706" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#94a3b8" }}>Total Connections</span>
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: "#059669", background: "#ecfdf5", padding: "2px 6px", borderRadius: 4 }}>
              +{Math.min(people.length, 48)} this mo
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>Everyone in your network</div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
            {people.length.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#059669", marginTop: 2 }}>All synced profiles</div>
        </button>

        <button
          type="button"
          onClick={() => goTo({ ...focus, statuses: ["not_contacted"] })}
          style={{
            textAlign: "left", padding: "20px 18px", borderRadius: 16,
            border: "1px solid #E8E6DF", background: "#fff", cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#94a3b8" }}>People to Contact</span>
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: "#DC2626", background: "#FEF2F2", padding: "2px 6px", borderRadius: 4 }}>
              {unreachedPct}% unreached
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{focused ? "Match your focus, not yet contacted" : "Not yet contacted"}</div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
            {toContact.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#EA580C", marginTop: 2 }}>High outreach potential</div>
        </button>

        <button
          type="button"
          onClick={() => goTo({ history: "replied" }, "/outreach")}
          style={{
            textAlign: "left", padding: "20px 18px", borderRadius: 16,
            border: "1px solid #E8E6DF", background: "#fff", cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" fill="none" stroke="#2563EB" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#94a3b8" }}>Have Replied</span>
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: "#059669", background: "#ecfdf5", padding: "2px 6px", borderRadius: 4 }}>
              {responsePct}% response
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{archive ? "From your message history" : "Add your archive to fill this in"}</div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
            {replied.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#059669", marginTop: 2 }}>Active conversations</div>
        </button>
      </div>

      {/* ====== VIEW NETWORK + FOCUS ====== */}
      <div style={{ borderTop: "1px solid #E8E6DF", paddingTop: 20, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => router.push("/analytics")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 14, fontWeight: 600, color: "#0f172a",
            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          View network overview
          <ArrowRight size={14} style={{ color: "#94a3b8" }} />
        </button>
        {!focused && (
          <p style={{ marginTop: 12, maxWidth: 520, fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
            You have not told this what you are looking for yet, so &ldquo;people to contact&rdquo; is simply everyone you have not spoken to.{" "}
            <Button size="sm" variant="ghost" className="align-baseline" onClick={() => router.push("/settings")}>
              Set your focus
            </Button>
          </p>
        )}
      </div>

      {/* ====== NETWORK SHAPE (donut + bars) ====== */}
      <NetworkShape people={people} onExplore={(f) => goTo(f)} />

      {!archive && (
        <div style={{ marginTop: 40 }}>
          <ArchiveImport />
        </div>
      )}
    </div>
  );
}
