"use client";

import { useMemo, useState } from "react";
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

function WavingOwl() {
  return (
    <svg width="72" height="72" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="95" rx="25" ry="6" fill="#D4C9A8" opacity="0.3" />
      <ellipse cx="60" cy="72" rx="28" ry="32" fill="#8B7355" />
      <ellipse cx="60" cy="72" rx="22" ry="26" fill="#A0895C" />
      <ellipse cx="60" cy="75" rx="16" ry="18" fill="#F5E6C8" />
      <ellipse cx="50" cy="58" rx="10" ry="11" fill="#F5E6C8" />
      <ellipse cx="70" cy="58" rx="10" ry="11" fill="#F5E6C8" />
      <circle cx="50" cy="57" r="5" fill="white" />
      <circle cx="70" cy="57" r="5" fill="white" />
      <circle cx="51" cy="57" r="2.5" fill="#1a1a2e" />
      <circle cx="71" cy="57" r="2.5" fill="#1a1a2e" />
      <circle cx="51.8" cy="56.2" r="0.8" fill="white" />
      <circle cx="71.8" cy="56.2" r="0.8" fill="white" />
      <path d="M57 64 L60 68 L63 64" fill="#E8A020" stroke="#D4901A" strokeWidth="0.5" />
      <path d="M45 45 Q42 30 35 28" stroke="#8B7355" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M75 45 Q78 30 85 28" stroke="#8B7355" strokeWidth="3" strokeLinecap="round" fill="none" />
      <g style={{ transformOrigin: "30px 50px" }} className="animate-wave">
        <path d="M32 62 Q22 55 18 45 Q16 40 20 38 Q24 36 26 40 Q28 44 32 48" fill="#8B7355" />
        <path d="M20 38 Q18 32 22 28" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M24 36 Q22 30 26 26" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M26 40 Q28 34 30 32" stroke="#8B7355" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>
      <path d="M48 88 Q50 95 52 88" stroke="#A0895C" strokeWidth="1" fill="none" />
      <path d="M56 90 Q58 97 60 90" stroke="#A0895C" strokeWidth="1" fill="none" />
      <path d="M64 88 Q66 95 68 88" stroke="#A0895C" strokeWidth="1" fill="none" />
      <style>{`
        @keyframes wave { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-15deg); } 50% { transform: rotate(10deg); } 75% { transform: rotate(-10deg); } }
        .animate-wave { animation: wave 1.5s ease-in-out infinite; }
      `}</style>
    </svg>
  );
}

function NestCradle({ color }: { color: string }) {
  return (
    <svg width="100%" height="24" viewBox="0 0 200 24" preserveAspectRatio="none" style={{ display: "block", marginTop: 4 }}>
      <path d="M10,20 Q20,4 40,8 Q60,12 80,6 Q100,0 120,6 Q140,12 160,8 Q180,4 190,20" fill="none" stroke={color} strokeWidth="2" opacity="0.3" />
      <path d="M20,22 Q40,8 60,12 Q80,16 100,8 Q120,4 140,12 Q160,16 180,22" fill="none" stroke={color} strokeWidth="1.5" opacity="0.2" />
      <path d="M30,22 Q50,12 70,14 Q90,16 110,10 Q130,6 150,14 Q170,18 185,22" fill="none" stroke={color} strokeWidth="1" opacity="0.15" />
    </svg>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function ActivityChart({ people }: { people: ReturnType<typeof useWorkspace>["people"] }) {
  const [range, setRange] = useState<"12" | "6" | "all">("12");

  const { connByMonth, msgByMonth, months, peak } = useMemo(() => {
    const connMap = new Map<string, number>();
    const msgMap = new Map<string, number>();

    for (const p of people) {
      if (p.connectedOn) {
        const key = `${p.connectedOn.getFullYear()}-${String(p.connectedOn.getMonth()).padStart(2, "0")}`;
        connMap.set(key, (connMap.get(key) ?? 0) + 1);
      }
      if (p.history?.messages) {
        for (const m of p.history.messages) {
          const d = new Date(m.at);
          if (!isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
            msgMap.set(key, (msgMap.get(key) ?? 0) + 1);
          }
        }
      }
    }

    const allKeys = new Set([...connMap.keys(), ...msgMap.keys()]);
    const sorted = [...allKeys].sort();
    const now = new Date();
    const cutoff = range === "all" ? "" : (() => {
      const d = new Date(now.getFullYear(), now.getMonth() - (range === "12" ? 11 : 5), 1);
      return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    })();
    const filtered = cutoff ? sorted.filter((k) => k >= cutoff) : sorted;

    const months: string[] = [];
    if (filtered.length === 0) {
      for (let i = (range === "6" ? 5 : 11); i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`);
      }
    } else {
      const start = filtered[0];
      const [sy, sm] = start.split("-").map(Number);
      const end = filtered[filtered.length - 1];
      const [ey, em] = end.split("-").map(Number);
      for (let y = sy, m = sm; y < ey || (y === ey && m <= em); m++) {
        if (m > 11) { m = 0; y++; }
        months.push(`${y}-${String(m).padStart(2, "0")}`);
      }
    }

    const connByMonth = months.map((k) => connMap.get(k) ?? 0);
    const msgByMonth = months.map((k) => msgMap.get(k) ?? 0);
    const peak = Math.max(...connByMonth, ...msgByMonth, 1);

    return { connByMonth, msgByMonth, months, peak };
  }, [people, range]);

  if (months.length < 2) return null;

  const W = 700, H = 260, PL = 44, PR = 10, PT = 15, PB = 32;
  const cw = W - PL - PR, ch = H - PT - PB;
  const n = months.length;
  const barW = Math.min(cw / n * 0.55, 28);
  const step = cw / Math.max(n - 1, 1);

  const bezier = (data: number[]) => {
    const pts = data.map((v, i) => [PL + i * step, PT + ch - (v / peak) * ch] as [number, number]);
    if (pts.length < 2) return "";
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const cp = step * 0.4;
      d += ` C${(pts[i - 1][0] + cp).toFixed(1)},${pts[i - 1][1].toFixed(1)} ${(pts[i][0] - cp).toFixed(1)},${pts[i][1].toFixed(1)} ${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`;
    }
    return d;
  };

  const bezierFilled = (data: number[]) => {
    const line = bezier(data);
    if (!line) return null;
    const lastX = PL + (data.length - 1) * step;
    const bottom = PT + ch;
    return `${line} L${lastX.toFixed(1)},${bottom.toFixed(1)} L${PL},${bottom.toFixed(1)} Z`;
  };

  const peakConn = Math.max(...connByMonth);
  const peakIdx = connByMonth.indexOf(peakConn);
  const peakMonth = months[peakIdx] ? MONTHS[parseInt(months[peakIdx].split("-")[1])] : "";

  const totalConn = connByMonth.reduce((a, b) => a + b, 0);
  const avgPerMonth = months.length ? Math.round(totalConn / months.length) : 0;
  const totalMsg = msgByMonth.reduce((a, b) => a + b, 0);

  const gridLines = 4;

  return (
    <div style={{
      marginBottom: 28, padding: "22px 24px", borderRadius: 20,
      border: "1px solid #E8E6DF", background: "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Monthly Connections & Activity Trend</h3>
          <span style={{ fontSize: 9, fontWeight: 600, background: "#ecfdf5", color: "#065f46", padding: "2px 8px", borderRadius: 6 }}>
            Peak: {peakMonth} (+{peakConn.toLocaleString()})
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#0D9488" }} />
            <span style={{ fontSize: 11, color: "#64748b" }}>New Connections</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 3, borderRadius: 2, background: "#F59E0B" }} />
            <span style={{ fontSize: 11, color: "#64748b" }}>Messages</span>
          </div>
          <div style={{ display: "flex", gap: 2, background: "#f1f0eb", borderRadius: 6, padding: 2 }}>
            {(["12", "6", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  fontSize: 11, fontWeight: range === r ? 600 : 400, padding: "3px 10px", borderRadius: 4,
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: range === r ? "#0f172a" : "transparent",
                  color: range === r ? "#fff" : "#94a3b8",
                }}
              >
                {r === "12" ? "12 Months" : r === "6" ? "6M" : "All Time"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="connGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0D9488" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const y = PT + (ch / gridLines) * i;
          const val = Math.round(peak - (peak / gridLines) * i);
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f1f0eb" strokeWidth="1" />
              <text x={PL - 8} y={y + 3} textAnchor="end" style={{ fontSize: 9, fill: "#94a3b8" }}>{val.toLocaleString()}</text>
            </g>
          );
        })}

        {connByMonth.map((v, i) => {
          const x = PL + i * step - barW / 2;
          const h = (v / peak) * ch;
          return (
            <rect key={i} x={x} y={PT + ch - h} width={barW} height={h} rx={3} fill="#0D9488" opacity="0.08" />
          );
        })}

        <path d={bezierFilled(connByMonth) ?? ""} fill="url(#connGrad)" />
        <path d={bezier(connByMonth)} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" />
        <path d={bezierFilled(msgByMonth) ?? ""} fill="url(#msgGrad)" />
        <path d={bezier(msgByMonth)} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 3" />

        {connByMonth.map((v, i) => (
          <circle key={i} cx={PL + i * step} cy={PT + ch - (v / peak) * ch} r={3.5} fill="#fff" stroke="#0D9488" strokeWidth="2" />
        ))}

        {peakIdx >= 0 && (
          <g>
            <rect x={PL + peakIdx * step - 30} y={PT + ch - (peakConn / peak) * ch - 26} width={60} height={20} rx={6} fill="#0D9488" />
            <text x={PL + peakIdx * step} y={PT + ch - (peakConn / peak) * ch - 13} textAnchor="middle" style={{ fontSize: 9, fill: "#fff", fontWeight: 700 }}>
              +{peakConn.toLocaleString()} Conn.
            </text>
          </g>
        )}

        {months.map((k, i) => {
          const label = MONTHS[parseInt(k.split("-")[1])];
          const show = months.length <= 12 || i % Math.ceil(months.length / 12) === 0;
          if (!show) return null;
          return (
            <text key={k} x={PL + i * step} y={H - 4} textAnchor="middle" style={{ fontSize: 10, fill: "#94a3b8" }}>{label}</text>
          );
        })}
      </svg>

      <div style={{
        marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f0eb",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", gap: 20 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Average velocity: <strong style={{ color: "#0f172a" }}>{avgPerMonth.toLocaleString()} new connections/mo</strong>
          </span>
          {totalMsg > 0 && (
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Total messages: <strong style={{ color: "#0f172a" }}>{totalMsg.toLocaleString()}</strong>
            </span>
          )}
        </div>
        <button
          onClick={() => {}}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 12, fontWeight: 600, color: "#059669",
            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Detailed activity breakdown
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
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
        <div style={{ flexShrink: 0 }}>
          <WavingOwl />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {greeting}{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p style={{ fontSize: 14, color: "#94a3b8", marginTop: 2 }}>{context}</p>
          {/* Speech bubble */}
          <div style={{
            position: "relative", marginTop: 12, padding: "12px 16px", borderRadius: 16,
            background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
            border: "1px solid #bbf7d0",
          }}>
            <div style={{
              position: "absolute", top: -8, left: 24, width: 16, height: 16,
              background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
              border: "1px solid #bbf7d0", borderRight: "none", borderBottom: "none",
              transform: "rotate(45deg)",
            }} />
            <div style={{ position: "relative" }}>
              <span style={{
                display: "inline-block", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase" as const, color: "#059669",
                background: "#dcfce7", padding: "2px 8px", borderRadius: 4, marginBottom: 6,
              }}>
                NeST INTELLIGENCE ASSISTANT
              </span>
              <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, marginTop: 4 }}>
                &ldquo;Wooaah, you are so much active! <strong>{people.length.toLocaleString()} connections</strong> is an incredible network. Let&rsquo;s find your warmest signals.&rdquo;
              </p>
            </div>
          </div>
        </div>
        {!focused && (
          <div style={{
            flexShrink: 0, padding: "10px 16px", borderRadius: 12,
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
        {/* Total Connections */}
        <button
          type="button"
          onClick={() => goTo({})}
          style={{
            textAlign: "left", padding: "20px 18px 14px", borderRadius: 18,
            border: "1px solid #E8E6DF", background: "#fff", cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 20px rgba(13,148,136,0.05)",
            position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #0D9488, #10B981)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 4px rgba(217,119,6,0.15)",
            }}>
              <svg width="15" height="15" fill="none" stroke="#D97706" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#94a3b8" }}>Total Connections</span>
            <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 600, color: "#059669", background: "#ecfdf5", padding: "2px 7px", borderRadius: 6 }}>
              +{Math.min(people.length, 48)} this mo
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>Everyone in your network</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
            {people.length.toLocaleString()}
          </div>
          <NestCradle color="#0D9488" />
          <div style={{ fontSize: 11, fontWeight: 600, color: "#059669", marginTop: 4 }}>All synced profiles</div>
        </button>

        {/* People to Contact */}
        <button
          type="button"
          onClick={() => goTo({ ...focus, statuses: ["not_contacted"] })}
          style={{
            textAlign: "left", padding: "20px 18px 14px", borderRadius: 18,
            border: "1px solid #E8E6DF", background: "#fff", cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 20px rgba(220,38,38,0.05)",
            position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #F97316, #EF4444)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, #FEE2E2, #FECACA)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 4px rgba(220,38,38,0.15)",
            }}>
              <svg width="15" height="15" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#94a3b8" }}>People to Contact</span>
            <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 600, color: "#DC2626", background: "#FEF2F2", padding: "2px 7px", borderRadius: 6 }}>
              {unreachedPct}% unreached
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{focused ? "Match your focus, not yet contacted" : "Not yet contacted"}</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
            {toContact.toLocaleString()}
          </div>
          <NestCradle color="#F97316" />
          <div style={{ fontSize: 11, fontWeight: 600, color: "#EA580C", marginTop: 4 }}>High outreach potential</div>
        </button>

        {/* Have Replied */}
        <button
          type="button"
          onClick={() => goTo({ history: "replied" }, "/outreach")}
          style={{
            textAlign: "left", padding: "20px 18px 14px", borderRadius: 18,
            border: "1px solid #E8E6DF", background: "#fff", cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 20px rgba(37,99,235,0.05)",
            position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #3B82F6, #8B5CF6)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 4px rgba(37,99,235,0.15)",
            }}>
              <svg width="15" height="15" fill="none" stroke="#2563EB" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#94a3b8" }}>Have Replied</span>
            <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 600, color: "#059669", background: "#ecfdf5", padding: "2px 7px", borderRadius: 6 }}>
              {responsePct}% response
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{archive ? "From your message history" : "Add your archive to fill this in"}</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
            {replied.toLocaleString()}
          </div>
          <NestCradle color="#3B82F6" />
          <div style={{ fontSize: 11, fontWeight: 600, color: "#059669", marginTop: 4 }}>Active conversations</div>
        </button>
      </div>

      {/* ====== MONTHLY TREND CHART ====== */}
      <ActivityChart people={people} />

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
