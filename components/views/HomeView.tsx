"use client";
import { memo, useMemo, useState } from "react";
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

const WavingOwl = memo(function WavingOwl() {
  return (
    <svg width="192" height="192" viewBox="0 0 340 320" xmlns="http://www.w3.org/2000/svg" fill="none">
      <defs>
        <filter id="nest-owl-shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f2d24" floodOpacity="0.12" /></filter>
        <linearGradient id="nest-straw-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#D99B4B" /><stop offset="50%" stopColor="#C28230" /><stop offset="100%" stopColor="#9C5E19" /></linearGradient>
        <linearGradient id="emerald-signal-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#34D399" /><stop offset="100%" stopColor="#059669" /></linearGradient>
      </defs>
      <g filter="url(#nest-owl-shadow)">
        <path d="M 45 220 C 50 270 120 295 170 295 C 220 295 290 270 295 220 C 265 242 205 252 170 252 C 135 252 75 242 45 220 Z" fill="url(#nest-straw-grad)" stroke="#231F1C" strokeLinejoin="round" strokeWidth="3" />
        <path d="M 35 235 Q 60 238 85 244" stroke="#8C4E15" strokeLinecap="round" strokeWidth="3" />
        <path d="M 40 250 Q 80 260 120 268" stroke="#783F0E" strokeLinecap="round" strokeWidth="3.5" />
        <path d="M 220 268 Q 260 260 300 250" stroke="#783F0E" strokeLinecap="round" strokeWidth="3.5" />
        <path d="M 255 235 Q 280 238 305 235" stroke="#8C4E15" strokeLinecap="round" strokeWidth="3" />
        <path d="M 110 278 Q 170 292 230 278" stroke="#5E2F09" strokeLinecap="round" strokeWidth="3.5" />
        <path d="M 75 260 Q 170 282 265 260" stroke="#B45309" strokeLinecap="round" strokeWidth="2.5" />
        <circle cx="260" cy="235" r="9" fill="url(#emerald-signal-grad)" stroke="#16120E" strokeWidth="2" />
        <circle cx="260" cy="235" r="3.5" fill="#FFFFFF" />
        <path d="M 252 222 C 262 218 274 220 280 228" fill="none" stroke="#10B981" strokeLinecap="round" strokeWidth="2" />
        <path d="M 155 245 L 170 262 L 185 245 Z" fill="#D3A26B" stroke="#231F1C" strokeWidth="2.5" />
        <path d="M 105 130 C 95 170 108 240 170 242 C 232 240 245 170 235 130 C 230 100 215 95 170 95 C 125 95 110 100 105 130 Z" fill="#E8C396" stroke="#231F1C" strokeLinejoin="round" strokeWidth="3.5" />
        <path d="M 125 135 C 120 165 130 230 170 232 C 210 230 220 165 215 135 C 210 115 195 108 170 108 C 145 108 130 115 125 135 Z" fill="#FFF8EE" stroke="#231F1C" strokeWidth="2.5" />
        <path d="M 152 145 Q 160 152 168 145 Q 176 152 184 145" fill="none" stroke="#D3A26B" strokeLinecap="round" strokeWidth="2.5" />
        <path d="M 146 162 Q 156 170 166 162 Q 176 170 186 162 Q 194 170 200 162" fill="none" stroke="#D3A26B" strokeLinecap="round" strokeWidth="2.5" />
        <path d="M 152 180 Q 162 188 172 180 Q 182 188 192 180" fill="none" stroke="#D3A26B" strokeLinecap="round" strokeWidth="2.5" />
        <path d="M 108 135 C 92 148 85 180 98 210 C 105 212 118 208 122 195 C 126 170 125 150 120 135 Z" fill="#DFB27D" stroke="#231F1C" strokeLinejoin="round" strokeWidth="3" />
        <g className="animate-wave-wing">
          <path d="M 230 135 C 255 125 285 95 305 60 C 295 75 280 92 268 98 C 292 72 312 48 316 32 C 314 24 304 26 292 45 C 280 62 268 82 254 94 C 275 62 290 44 288 32 C 284 25 274 30 262 52 C 248 78 236 108 226 135 Z" fill="#DFB27D" stroke="#231F1C" strokeLinejoin="round" strokeWidth="3.5" />
          <path d="M 318 18 C 326 26 328 38 325 50" fill="none" opacity="0.8" stroke="#10B981" strokeDasharray="3 4" strokeLinecap="round" strokeWidth="2.5" />
          <path d="M 328 28 C 334 35 335 44 332 54" fill="none" opacity="0.7" stroke="#F59E0B" strokeLinecap="round" strokeWidth="2" />
        </g>
        <path d="M 80 215 Q 170 238 260 215 Q 268 230 255 242 Q 170 260 85 242 Q 72 230 80 215 Z" fill="#DF9F48" stroke="#231F1C" strokeWidth="2.5" />
        <path d="M 100 225 Q 170 245 240 226" stroke="#9C5E19" strokeLinecap="round" strokeWidth="2" />
        <path d="M 120 235 Q 170 248 220 236" opacity="0.7" stroke="#FFE4B5" strokeLinecap="round" strokeWidth="1.8" />
        <g fill="#F29339" stroke="#231F1C" strokeLinejoin="round" strokeWidth="2.2">
          <ellipse cx="140" cy="222" rx="5" ry="7" transform="rotate(-10 140 222)" />
          <ellipse cx="148" cy="223" rx="5" ry="7.5" />
          <ellipse cx="156" cy="222" rx="5" ry="7" transform="rotate(10 156 222)" />
          <ellipse cx="184" cy="222" rx="5" ry="7" transform="rotate(-10 184 222)" />
          <ellipse cx="192" cy="223" rx="5" ry="7.5" />
          <ellipse cx="200" cy="222" rx="5" ry="7" transform="rotate(10 200 222)" />
        </g>
        <g>
          <path d="M 102 75 C 92 55 100 30 116 25 C 125 35 128 45 130 55 C 142 45 160 40 180 42 C 195 42 208 48 216 58 C 220 45 228 32 240 28 C 248 40 246 60 236 80 C 250 105 248 135 230 155 C 205 175 135 175 108 150 C 95 128 94 98 102 75 Z" fill="#E8C396" stroke="#231F1C" strokeLinejoin="round" strokeWidth="3.5" />
          <path d="M 168 38 C 165 25 172 18 176 12 C 178 20 177 28 175 35" fill="#DFB27D" stroke="#231F1C" strokeLinejoin="round" strokeWidth="2.5" />
          <path d="M 158 40 C 152 30 155 22 160 16 C 163 25 163 32 162 39" fill="#DFB27D" stroke="#231F1C" strokeLinejoin="round" strokeWidth="2.5" />
          <circle cx="138" cy="100" r="32" fill="#FFFFFF" stroke="#231F1C" strokeWidth="6" />
          <circle cx="198" cy="98" r="32" fill="#FFFFFF" stroke="#231F1C" strokeWidth="6" />
          <path d="M 168 98 L 171 98" stroke="#231F1C" strokeLinecap="round" strokeWidth="7" />
          <path d="M 106 102 L 96 106" stroke="#231F1C" strokeLinecap="round" strokeWidth="5" />
          <path d="M 230 98 L 242 100" stroke="#231F1C" strokeLinecap="round" strokeWidth="5" />
          <circle cx="140" cy="100" r="15" fill="#1A1817" />
          <circle cx="136" cy="94" r="5.5" fill="#FFFFFF" />
          <circle cx="144" cy="104" r="2.5" fill="#FFFFFF" />
          <circle cx="196" cy="98" r="15" fill="#1A1817" />
          <circle cx="192" cy="92" r="5.5" fill="#FFFFFF" />
          <circle cx="200" cy="102" r="2.5" fill="#FFFFFF" />
          <path d="M 118 66 Q 136 58 152 66" fill="none" stroke="#231F1C" strokeLinecap="round" strokeWidth="3" />
          <path d="M 184 64 Q 202 56 218 64" fill="none" stroke="#231F1C" strokeLinecap="round" strokeWidth="3" />
          <ellipse cx="114" cy="126" rx="8" ry="5" fill="#F4B5A4" opacity="0.65" />
          <ellipse cx="220" cy="123" rx="8" ry="5" fill="#F4B5A4" opacity="0.65" />
          <polygon points="169,101 160,115 178,115" fill="#F29339" stroke="#231F1C" strokeLinejoin="round" strokeWidth="2.5" />
          <path d="M 162 115 Q 169 125 176 115 Z" fill="#D9534F" stroke="#231F1C" strokeWidth="1.8" />
        </g>
      </g>
      <style>{`
        @keyframes wave-wing { 0%,100% { transform: rotate(0deg); } 15% { transform: rotate(-8deg); } 30% { transform: rotate(5deg); } 45% { transform: rotate(-6deg); } 60% { transform: rotate(3deg); } }
        .animate-wave-wing { transform-origin: 230px 135px; animation: wave-wing 2s ease-in-out infinite; }
      `}</style>
    </svg>
  );
});

const NestCradle = memo(function NestCradle() {
  return (
    <svg className="w-full" style={{ height: 56, overflow: "visible", display: "block" }} viewBox="0 0 320 48" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <ellipse cx="160" cy="38" rx="140" ry="7" fill="#0F2D24" fillOpacity="0.07" />
      <path d="M 20 20 C 60 44 260 44 300 20 C 275 36 200 42 160 42 C 120 42 45 36 20 20 Z" fill="#E8C396" fillOpacity="0.55" stroke="#C28230" strokeWidth="1.8" />
      <path d="M 35 24 Q 160 46 285 24" stroke="#9C5E19" strokeWidth="2" strokeLinecap="round" />
      <path d="M 50 29 Q 160 48 270 29" stroke="#783F0E" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 80 18 Q 120 38 175 32" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 155 33 Q 210 39 250 20" stroke="#8C4E15" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 25 20 L 10 15" stroke="#C28230" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 295 20 L 310 16" stroke="#C28230" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="282" cy="23" r="5.5" fill="#10B981" stroke="#0F2D24" strokeWidth="1.5" />
      <circle cx="282" cy="23" r="2" fill="#FFFFFF" />
      <path d="M 275 15 C 283 12 291 16 294 21" stroke="#10B981" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  );
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function ActivityChart({ people }: { people: ReturnType<typeof useWorkspace>["people"] }) {
  const router = useRouter();
  const [range, setRange] = useState<"12" | "6" | "all">("12");
  const [hover, setHover] = useState<number | null>(null);

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

  const W = 700, H = 270, PL = 44, PR = 10, PT = 30, PB = 32;
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
  const peakMonth = months[peakIdx] ? `${MONTHS[parseInt(months[peakIdx].split("-")[1])]}'${months[peakIdx].split("-")[0].slice(2)}` : "";

  const totalConn = connByMonth.reduce((a, b) => a + b, 0);
  const avgPerMonth = months.length ? Math.round(totalConn / months.length) : 0;
  const totalMsg = msgByMonth.reduce((a, b) => a + b, 0);

  const gridLines = 4;

  return (
    <div style={{
      marginBottom: 28, padding: "22px 24px", borderRadius: 20,
      border: "1px solid #E8E6DF", background: "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden",
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
          <circle key={i} cx={PL + i * step} cy={PT + ch - (v / peak) * ch} r={hover === i ? 5 : 3.5} fill="#fff" stroke="#0D9488" strokeWidth="2" style={{ transition: "r 0.15s" }} />
        ))}

        {hover !== null && (() => {
          const x = PL + hover * step;
          const cv = connByMonth[hover];
          const mv = msgByMonth[hover];
          const [y, m] = months[hover].split("-").map(Number);
          const label = `${MONTHS[m]}'${String(y).slice(2)}`;
          const tooltipW = 120;
          const tx = Math.max(PL, Math.min(x - tooltipW / 2, W - PR - tooltipW));
          const ty = 4;
          return (
            <g>
              <line x1={x} y1={PT} x2={x} y2={PT + ch} stroke="#0D9488" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
              <rect x={tx} y={ty} width={tooltipW} height={46} rx={6} fill="#0f172a" opacity="0.92" />
              <text x={tx + tooltipW / 2} y={ty + 14} textAnchor="middle" style={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}>{label}</text>
              <text x={tx + tooltipW / 2} y={ty + 28} textAnchor="middle" style={{ fontSize: 10, fill: "#6ee7b7", fontWeight: 700 }}>+{cv} connections</text>
              <text x={tx + tooltipW / 2} y={ty + 40} textAnchor="middle" style={{ fontSize: 10, fill: "#fcd34d", fontWeight: 600 }}>{mv} messages</text>
            </g>
          );
        })()}

        {/* Invisible hit areas for hover */}
        {connByMonth.map((_, i) => (
          <rect
            key={`hit-${i}`}
            x={PL + i * step - step / 2}
            y={PT}
            width={step}
            height={ch}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: "crosshair" }}
          />
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
          const [y, m] = k.split("-").map(Number);
          const label = `${MONTHS[m]}'${String(y).slice(2)}`;
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
          onClick={() => router.push("/analytics")}
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
  const addedRecently = useMemo(() => {
    const cutoff = Date.now() - 30 * 86_400_000;
    return people.filter((p) => p.connectedOn && p.connectedOn.getTime() >= cutoff).length;
  }, [people]);

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
      <div className="flex flex-wrap items-start gap-4 max-sm:grid max-sm:grid-cols-[72px_1fr] max-sm:gap-x-3 max-sm:gap-y-3" style={{ marginBottom: 28 }}>
        <div className="max-sm:row-span-2 max-sm:w-[72px] max-sm:[&_svg]:h-auto max-sm:[&_svg]:w-full" style={{ flexShrink: 0 }}>
          <WavingOwl />
        </div>
        <div className="min-w-0 max-sm:contents" style={{ flex: 1 }}>
          <h1 className="max-sm:col-start-2 max-sm:self-end" style={{ fontSize: "clamp(22px, 6vw, 28px)", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {greeting}{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="max-sm:col-start-2 max-sm:self-start" style={{ fontSize: 14, color: "#94a3b8", marginTop: 2 }}>{context}</p>
          {/* Speech bubble */}
          <div className="max-sm:col-span-2" style={{
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
                OWLIE
              </span>
              <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, marginTop: 4 }}>
                &ldquo;{people.length >= 500 ? "Wooaah, you are really active! " : "Nice start! "}<strong>{people.length.toLocaleString()} connections</strong>{people.length >= 500 ? " is an incredible network." : " to work with."} Let&rsquo;s find your warmest signals.&rdquo;
              </p>
            </div>
          </div>
        </div>
        {!focused && (
          <div className="max-sm:col-span-2" style={{
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
            position: "relative", borderTop: "3px solid #0D9488",
          }}
        >
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
            {addedRecently > 0 ? (
              <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 600, color: "#059669", background: "#ecfdf5", padding: "2px 7px", borderRadius: 6 }}>
                +{addedRecently.toLocaleString()} in 30 days
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Everyone in your network</div>
          <div style={{ position: "relative", zIndex: 0 }}>
            <div style={{ fontSize: 42, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginTop: 2, fontVariantNumeric: "tabular-nums", position: "relative", zIndex: 1, textAlign: "center" }}>
              {people.length.toLocaleString()}
            </div>
            <div style={{ marginTop: -28, pointerEvents: "none" }}><NestCradle /></div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#059669", marginTop: 0 }}>All synced profiles</div>
        </button>

        {/* People to Contact */}
        <button
          type="button"
          onClick={() => goTo({ ...focus, statuses: ["not_contacted"] })}
          style={{
            textAlign: "left", padding: "20px 18px 14px", borderRadius: 18,
            border: "1px solid #E8E6DF", background: "#fff", cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 20px rgba(220,38,38,0.05)",
            position: "relative", borderTop: "3px solid #F97316",
          }}
        >
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
          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{focused ? "Match your focus, not yet contacted" : "Not yet contacted"}</div>
          <div style={{ position: "relative", zIndex: 0 }}>
            <div style={{ fontSize: 42, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginTop: 2, fontVariantNumeric: "tabular-nums", position: "relative", zIndex: 1, textAlign: "center" }}>
              {toContact.toLocaleString()}
            </div>
            <div style={{ marginTop: -28, pointerEvents: "none" }}><NestCradle /></div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#EA580C", marginTop: 0 }}>High outreach potential</div>
        </button>

        {/* Have Replied */}
        <button
          type="button"
          onClick={() => goTo({ history: "replied" }, "/outreach")}
          style={{
            textAlign: "left", padding: "20px 18px 14px", borderRadius: 18,
            border: "1px solid #E8E6DF", background: "#fff", cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 20px rgba(37,99,235,0.05)",
            position: "relative", borderTop: "3px solid #3B82F6",
          }}
        >
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
          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{archive ? "From your message history" : "Add your archive to fill this in"}</div>
          <div style={{ position: "relative", zIndex: 0 }}>
            <div style={{ fontSize: 42, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginTop: 2, fontVariantNumeric: "tabular-nums", position: "relative", zIndex: 1, textAlign: "center" }}>
              {replied.toLocaleString()}
            </div>
            <div style={{ marginTop: -28, pointerEvents: "none" }}><NestCradle /></div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#059669", marginTop: 0 }}>Active conversations</div>
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
