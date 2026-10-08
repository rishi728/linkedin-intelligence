"use client";

import { Playbook } from "./Playbook";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CsvFormatError } from "@/lib/analyzer";
import { isZip, readZipCsvs, splitExport, ZipError } from "@/lib/zip";
import type { Settings } from "@/lib/workspace/types";
import { useWorkspace } from "@/components/workspace/store";

/* ------------------------------------------------------------------ */
/*  Landing page — pixel-faithful port of the Stitch "Refined Owl"    */
/*  design.  Fonts loaded via <link>, all custom colours via inline   */
/*  style vars so the workspace's Tailwind theme is untouched.        */
/* ------------------------------------------------------------------ */

export function WelcomeView() {
  const { ready, dataset, people, settings, updateSettings, importCsv, importArchive, loadSample } = useWorkspace();
  const router = useRouter();
  const destination = useRef("/home");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"summary" | "edit">("summary");
  const [activeTab, setActiveTab] = useState<"home" | "demo" | "privacy">("home");
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  useEffect(() => {
    if (ready && dataset && !showModal) {
      const stayOnLanding = new URLSearchParams(window.location.search).has("welcome");
      if (!stayOnLanding) router.replace(destination.current);
    }
  }, [ready, dataset, router, showModal]);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    if (!isZip(file) && !/\.csv$/i.test(file.name)) {
      setError(`"${file.name}" is neither the export .zip nor a CSV.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (isZip(file)) {
        const { connections, archive } = splitExport(await readZipCsvs(await file.arrayBuffer()));
        if (!connections) throw new CsvFormatError("That zip has no Connections.csv in it.");
        const { total } = importCsv(connections.text, file.name);
        if (!total) throw new CsvFormatError("That export has no connections in it.");
        if (archive.length) importArchive(archive);
      } else {
        const { total } = importCsv(await file.text(), file.name);
        if (!total) throw new CsvFormatError("That file has no connections in it.");
      }
      setShowModal(true);
      setBusy(false);
    } catch (e) {
      setError(
        e instanceof CsvFormatError || e instanceof ZipError
          ? e.message
          : "Could not read that file. Try the export .zip, or the Connections.csv inside it.",
      );
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", background: "#FAF8F5" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div className="landing-spinner" />
          <span style={{ fontFamily: "var(--font-jakarta), sans-serif", fontSize: 14, color: "#64748b" }}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .landing-root {
          --sf: #FAF8F5;
          --sf-card: #FFFFFF;
          --sf-subtle: #F4F3EE;
          --sf-border: #E8E6DF;
          --br-dark: #0C2D22;
          --br-emerald: #114B3A;
          --br-accent: #19614C;
          --br-mint: #EBF6F1;
          --br-sage: #E3ECE6;
          font-family: var(--font-jakarta), -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #FAF8F5;
          background-image:
            radial-gradient(circle at 15% 10%, rgba(17,75,58,0.06) 0%, transparent 45%),
            radial-gradient(circle at 85% 15%, rgba(209,237,226,0.5) 0%, transparent 55%),
            radial-gradient(circle at 50% 60%, rgba(243,237,226,0.4) 0%, transparent 60%),
            radial-gradient(rgba(17,75,58,0.03) 1px, transparent 1px);
          background-size: 100% 100%, 100% 100%, 100% 100%, 24px 24px;
          color: #1e293b;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }
        .landing-root * { box-sizing: border-box; }
        .landing-root ::selection { background: #114B3A; color: #fff; }
        .font-serif { font-family: var(--font-newsreader), Georgia, serif; }
        .font-hand { font-family: var(--font-caveat), cursive; }
        @keyframes floatOwl {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
        }
        @keyframes floatCloud {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-5px) scale(1.03); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .anim-owl { animation: floatOwl 4.5s ease-in-out infinite; }
        .anim-cloud { animation: floatCloud 3.2s ease-in-out infinite; }
        .anim-pulse { animation: pulse-dot 2s ease-in-out infinite; }
        .hero-glow {
          background: radial-gradient(circle at 65% 35%, rgba(212,238,228,0.45) 0%, rgba(250,248,245,0) 70%);
        }
        .shadow-soft { box-shadow: 0 2px 10px rgba(0,0,0,0.03), 0 10px 30px rgba(12,45,34,0.04); }
        .shadow-float-l { box-shadow: 0 20px 45px -10px rgba(12,45,34,0.12), 0 8px 18px -6px rgba(0,0,0,0.04); }
        .shadow-pill-l { box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
        .landing-spinner {
          width: 28px; height: 28px;
          border: 3px solid #E8E6DF;
          border-top-color: #114B3A;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .drop-zone-active { border-color: #114B3A !important; background: #EBF6F1 !important; }

        /* Timeline step hover */
        .tl-step { transition: transform 0.3s ease; }
        .tl-step:hover { transform: translateY(-6px); }
        .tl-step .tl-owl { transition: transform 0.3s ease; }
        .tl-step:hover .tl-owl { transform: scale(1.05); }
        .tl-step .tl-node { transition: transform 0.2s ease; }
        .tl-step:hover .tl-node { transform: scale(1.25); }
        .tl-step .tl-tag {
          transition: background 0.2s, color 0.2s;
        }
        .tl-step:hover .tl-tag {
          background: #114B3A; color: #fff;
        }
        .tl-step .tl-label { transition: color 0.2s; }
        .tl-step:hover .tl-label { color: #114B3A; }

        /* Banner hover */
        .info-banner { transition: border-color 0.2s, box-shadow 0.2s; }
        .info-banner:hover { border-color: rgba(17,75,58,0.4); }
        .info-banner .info-arrow { transition: background 0.2s, color 0.2s; }
        .info-banner:hover .info-arrow { background: #114B3A; color: #fff; }
        .info-banner .info-title { transition: color 0.2s; }
        .info-banner:hover .info-title { color: #114B3A; }

        /* Product window hover */
        .product-window { transition: box-shadow 0.3s; }
        .product-window:hover { box-shadow: 0 25px 50px -12px rgba(12,45,34,0.18), 0 12px 24px -8px rgba(0,0,0,0.06); }

        /* CTA hover */
        .cta-main { transition: background 0.2s, box-shadow 0.2s; }
        .cta-main:hover { background: #114B3A !important; box-shadow: 0 8px 20px rgba(12,45,34,0.3); }
        .cta-main .cta-arrow { transition: transform 0.2s; }
        .cta-main:hover .cta-arrow { transform: translateX(4px); }

        /* Responsive: the landing page is written with inline styles, so the
           narrow-screen overrides live here and must beat them. */
        @media (max-width: 900px) {
          .w-split { grid-template-columns: 1fr !important; gap: 32px !important; }
          .w-split > * { min-width: 0; }
          .w-grid4 { grid-template-columns: repeat(2, 1fr) !important; }
          .w-preview { margin-top: 124px; }
          .w-mascot { left: auto !important; right: 4px; top: -148px !important; }
          .w-mascot .anim-owl { width: 112px !important; height: 112px !important; }
          .w-mockgrid { grid-template-columns: 1fr !important; }
          .w-mockside { display: none !important; }
        }
        @media (max-width: 720px) {
          .w-wrap { padding-left: 16px !important; padding-right: 16px !important; }
          .w-header { height: 64px !important; gap: 8px; }
          .w-logo img { height: 32px !important; }
          .w-nav { gap: 2px !important; }
          .w-nav button { padding: 6px 10px !important; font-size: 13px !important; white-space: nowrap; }
          .w-social { border-left: none !important; padding-left: 0 !important; gap: 6px !important; }
          .w-social a { width: 32px !important; height: 32px !important; }
          .w-grid3 { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 520px) {
          .w-logo { display: none !important; }
          .w-header { justify-content: space-between; }
          .w-grid4, .w-grid3 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="landing-root" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* ==================== HEADER ==================== */}
        <header style={{
          width: "100%", borderBottom: "1px solid rgba(214,211,199,0.5)",
          background: "rgba(250,250,245,0.8)", backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <div className="w-wrap w-header" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px", height: 80, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <a href="#" className="w-logo" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
              <img src="/nest-logo.webp" alt="NesT" style={{ height: 44, objectFit: "contain" }} />
            </a>

            {/* Nav tabs */}
            <nav className="w-nav" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 500 }}>
              {([
                { id: "home" as const, label: "Home" },
                { id: "demo" as const, label: "Demo" },
                { id: "privacy" as const, label: "Privacy First", dot: true },
              ]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: "6px 16px", borderRadius: 9999, border: "none", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 14, fontWeight: activeTab === t.id ? 600 : 500,
                    background: activeTab === t.id ? "#0C2D22" : "transparent",
                    color: activeTab === t.id ? "#fff" : "#64748b",
                    display: "flex", alignItems: "center", gap: 6,
                    transition: "all 0.2s",
                  }}
                >
                  {t.dot && <span className="anim-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: activeTab === t.id ? "#34d399" : "#22c55e", display: "inline-block" }} />}
                  {t.label}
                </button>
              ))}
            </nav>

            {/* Social */}
            <div className="w-social" style={{ display: "flex", alignItems: "center", gap: 8, borderLeft: "1px solid #E8E6DF", paddingLeft: 16 }}>
              <a
                href="https://www.linkedin.com/in/rishiagrawal2004" target="_blank" rel="noopener noreferrer"
                aria-label="LinkedIn profile"
                style={{
                  width: 36, height: 36, borderRadius: 8, background: "#fff", border: "1px solid #E8E6DF",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", textDecoration: "none",
                }}
              >
                <svg style={{ width: 16, height: 16, fill: "currentColor" }} viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              </a>
              <a
                href="mailto:agrawal123rishi@gmail.com"
                aria-label="Send email"
                style={{
                  width: 36, height: 36, borderRadius: 8, background: "#fff", border: "1px solid #E8E6DF",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", textDecoration: "none",
                }}
              >
                <svg style={{ width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 2 }} viewBox="0 0 24 24"><rect height="16" rx="2" width="20" x="2" y="4" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              </a>
            </div>
          </div>
        </header>

        <main style={{ flexGrow: 1 }}>
          {activeTab === "home" && (
          <div>
          {/* ==================== HERO ==================== */}
          <section className="hero-glow" style={{ position: "relative", paddingTop: 40, paddingBottom: 80, overflow: "hidden" }}>
            <div className="w-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
                <img src="/nest-logo.webp" alt="NesT - Network Engagement & Signal Tracker" style={{ maxWidth: 840, width: "100%" }} />
              </div>
              <div className="w-split" style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 48, alignItems: "center", marginBottom: 64 }}>
                {/* Left: headline */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <p style={{ fontSize: "clamp(18px, 1.6vw, 24px)", color: "#64748b", fontWeight: 300, maxWidth: 560, lineHeight: 1.6 }}>
                    Turn your LinkedIn connections into meaningful career and business opportunities.
                  </p>

                  {/* CTAs */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, paddingTop: 16 }}>
                    <button
                      className="cta-main"
                      onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "14px 24px", borderRadius: 9999, border: "none",
                        background: "#0C2D22", color: "#fff", fontSize: 14, fontWeight: 600,
                        cursor: "pointer", boxShadow: "0 4px 12px rgba(12,45,34,0.2)",
                        fontFamily: "inherit",
                      }}
                    >
                      <span>{busy ? "Reading..." : "Start Analysing Free"}</span>
                      <span className="cta-arrow" style={{
                        width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                      </span>
                    </button>

                    <div style={{
                      display: "inline-flex", alignItems: "center",
                      background: "#fff", border: "1px solid #E8E6DF", borderRadius: 9999,
                      padding: 6,
                    }} className="shadow-pill-l">
                      <span style={{
                        padding: "8px 16px", fontSize: 12, fontWeight: 500, color: "#334155",
                        background: "#F4F3EE", borderRadius: 9999,
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <svg style={{ width: 14, height: 14, stroke: "#16a34a", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                        Zero API Key required
                      </span>
                      <span style={{ padding: "8px 16px", fontSize: 12, fontWeight: 500, color: "#64748b" }}>100% Client-side</span>
                    </div>
                  </div>
                </div>

                {/* Right: Owl + Product Preview */}
                <div id="network-preview" className="w-preview" style={{ position: "relative" }}>
                  {/* Mascot */}
                  <div className="w-mascot" style={{ position: "absolute", top: -24, left: -80, zIndex: 30, display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none", userSelect: "none" }}>
                    <div className="anim-cloud" style={{ position: "relative", marginBottom: 2, marginLeft: 56 }}>
                      <div style={{
                        position: "relative", padding: "6px 14px",
                        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)",
                        border: "1px solid #d6d3d1", boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                        borderRadius: 16, display: "flex", alignItems: "center", gap: 4, color: "#1e293b",
                      }}>
                        <span className="font-hand" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1 }}>Hello!</span>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                      </div>
                      <div style={{
                        width: 10, height: 10, background: "#fff",
                        borderRight: "1px solid #d6d3d1", borderBottom: "1px solid #d6d3d1",
                        transform: "rotate(45deg)", position: "absolute", bottom: -4, left: 16,
                        boxShadow: "2px 2px 2px rgba(0,0,0,0.03)",
                      }} />
                    </div>
                    <div className="anim-owl" style={{ position: "relative", width: 176, height: 176 }}>
                      <img
                        alt="Owl Mascot"
                        src="/owl-mascot.png"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    </div>
                  </div>

                  {/* Product window */}
                  <div className="shadow-float-l product-window" style={{
                    background: "#fff", borderRadius: 16, border: "1px solid #E8E6DF",
                    overflow: "hidden", position: "relative", zIndex: 10,
                  }}>
                    {/* Window bar */}
                    <div style={{
                      padding: "14px 20px", background: "rgba(248,250,252,0.8)",
                      borderBottom: "1px solid #E8E6DF",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(255,95,86,0.8)" }} />
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(255,189,46,0.8)" }} />
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(39,201,63,0.8)" }} />
                      </div>
                      <div style={{ position: "relative", maxWidth: 240, width: "100%" }}>
                        <svg style={{ width: 14, height: 14, color: "#64748b", position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        <div style={{
                          width: "100%", paddingLeft: 36, paddingRight: 12, padding: "4px 12px 4px 36px",
                          fontSize: 12, background: "#fff", borderRadius: 6, border: "1px solid #e2e8f0",
                          color: "#64748b",
                        }}>Search people, companies...</div>
                      </div>
                    </div>

                    {/* Window content */}
                    <div className="w-mockgrid" style={{ display: "grid", gridTemplateColumns: "4fr 8fr", minHeight: 360 }}>
                      {/* Sidebar */}
                      <div className="w-mockside" style={{ borderRight: "1px solid #E8E6DF", padding: 12, display: "flex", flexDirection: "column", gap: 4, background: "rgba(244,243,238,0.4)" }}>
                        {[
                          { label: "Home", active: true, d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
                          { label: "People", d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" },
                          { label: "Outreach", d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
                          { label: "Reminders", d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" },
                        ].map((item) => (
                          <div key={item.label} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "8px 12px", borderRadius: 8, fontSize: 12,
                            fontWeight: item.active ? 600 : 500,
                            background: item.active ? "#EBF6F1" : "transparent",
                            color: item.active ? "#114B3A" : "#64748b",
                            cursor: "pointer",
                          }}>
                            <svg style={{ width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 2 }} viewBox="0 0 24 24">
                              <path d={item.d} />
                              {item.label === "People" && <><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>}
                              {item.label === "Reminders" && <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />}
                            </svg>
                            {item.label}
                          </div>
                        ))}
                      </div>

                      {/* Main content */}
                      <div style={{ padding: 16, background: "#fff" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid #E8E6DF" }}>
                          <div>
                            <h4 style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>Your Network</h4>
                            <p style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>1,248 people analysed</p>
                          </div>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: "#f1f5f9", padding: "4px 10px", borderRadius: 4,
                            fontSize: 11, color: "#334155", fontWeight: 500, cursor: "pointer",
                          }}>
                            <span>All Roles</span>
                            <svg style={{ width: 12, height: 12, fill: "none", stroke: "#64748b" }} viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
                          </div>
                        </div>

                        {/* Contact list */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {[
                            { initials: "AM", name: "Aarav Mehta", sub: "Supply Chain . Ex-Flipkart", bg: "#fef3c7", fg: "#92400e", btn: "Connect", btnBg: "#ecfdf5", btnColor: "#065f46", btnBorder: "rgba(16,185,129,0.6)" },
                            { initials: "NS", name: "Neha Sharma", sub: "Product . at Google", bg: "#f3e8ff", fg: "#6b21a8", btn: "Message", btnBg: "#eff6ff", btnColor: "#1d4ed8", btnBorder: "rgba(59,130,246,0.6)" },
                            { initials: "RV", name: "Rohit Verma", sub: "Consulting . Ex-BCG", bg: "#ccfbf1", fg: "#134e4a", btn: "Follow up", btnBg: "#f1f5f9", btnColor: "#334155", btnBorder: "transparent" },
                            { initials: "IK", name: "Isha Kapoor", sub: "Data . at Cred", bg: "#ffe4e6", fg: "#9f1239", btn: "View", btnBg: "transparent", btnColor: "#64748b", btnBorder: "transparent" },
                          ].map((c) => (
                            <div key={c.initials} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: 8, borderRadius: 12, border: "1px solid #f1f5f9",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: "50%",
                                  background: c.bg, color: c.fg,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontWeight: 700, fontSize: 12, flexShrink: 0,
                                  boxShadow: "0 0 0 2px #fff",
                                }}>{c.initials}</div>
                                <div style={{ overflow: "hidden" }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                                  <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.sub}</div>
                                </div>
                              </div>
                              <button style={{
                                flexShrink: 0, fontSize: 12, padding: "4px 12px", fontWeight: 500,
                                color: c.btnColor, background: c.btnBg,
                                borderRadius: 8, border: c.btnBorder !== "transparent" ? `1px solid ${c.btnBorder}` : "none",
                                cursor: "pointer", fontFamily: "inherit",
                              }}>{c.btn}</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Capability pills */}
              <div className="shadow-pill-l" style={{
                background: "#fff", border: "1px solid #E8E6DF", borderRadius: 16,
                padding: 10, maxWidth: 896, margin: "0 auto",
                display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", paddingLeft: 8 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%", background: "#f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#334155",
                  }}>
                    <svg style={{ width: 14, height: 14, fill: "none", stroke: "currentColor", strokeWidth: 2 }} viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                  </span>
                </div>
                <button style={{ padding: "8px 16px", fontWeight: 600, color: "#0f172a", background: "#F4F3EE", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit" }}>Find the right people</button>
                <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />
                <button style={{ padding: "8px 16px", fontWeight: 500, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Run personalised outreach</button>
                <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />
                <button style={{ padding: "8px 16px", fontWeight: 500, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Never miss a follow-up</button>
                <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />
                <button style={{ padding: "8px 16px", fontWeight: 500, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Turn chats to deals</button>
              </div>
            </div>
          </section>

          {/* ==================== CORE FEATURES (OWL TIMELINE) ==================== */}
          <section id="features" style={{ padding: "80px 0", background: "#fff", borderTop: "1px solid #E8E6DF", borderBottom: "1px solid #E8E6DF" }}>
            <div className="w-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
              {/* Section header */}
              <div style={{ textAlign: "center", maxWidth: 768, margin: "0 auto 64px" }}>
                <h2 className="font-serif" style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 700, color: "#0C2D22", marginBottom: 16, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                  Designed to unlock the untapped power of your Linkedin Connections.
                </h2>
                <p style={{ color: "#64748b", fontSize: "clamp(14px, 1.2vw, 18px)", maxWidth: 640, margin: "0 auto", fontWeight: 300, lineHeight: 1.6 }}>
                  No expensive subscriptions. No suspicious browser bots. Just a clear, continuous intelligence workflow from your existing network.
                </p>
              </div>

              {/* Timeline */}
              <div style={{ maxWidth: 896, margin: "0 auto", padding: "48px 16px" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  {/* Track line */}
                  <div style={{
                    position: "absolute", top: 102, left: 32, right: 32, height: 2,
                    background: "linear-gradient(to right, #a7f3d0, rgba(17,75,58,0.4), #a7f3d0)",
                    borderRadius: 9999, zIndex: 0,
                  }} />

                  {/* Step 1 */}
                  <TimelineStep step="01" label={<>Know Your<br />Network</>}>
                    <OwlInspecting />
                  </TimelineStep>

                  {/* Step 2 */}
                  <TimelineStep step="02" label={<>Find<br />Them</>}>
                    <OwlTelescope />
                  </TimelineStep>

                  {/* Step 3 */}
                  <TimelineStep step="03" label={<>Reach<br />Out</>}>
                    <OwlEnvelope />
                  </TimelineStep>

                  {/* Step 4 */}
                  <TimelineStep step="04" label={<>Follow<br />Up</>}>
                    <OwlAlarm />
                  </TimelineStep>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== LINKEDIN STEPS + FILE DROP ZONE ==================== */}
          <section id="how-it-works" style={{ padding: "64px 0" }}>
            <div className="w-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
              <WalkthroughSection walkthroughOpen={walkthroughOpen} setWalkthroughOpen={setWalkthroughOpen} />
              {/* ==================== FILE DROP ZONE ==================== */}
              <div style={{ maxWidth: 640, margin: "48px auto 0" }}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
                  className={dragging ? "drop-zone-active" : ""}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    borderRadius: 16, border: "2px dashed #E8E6DF", padding: "48px 24px",
                    textAlign: "center", cursor: "pointer", background: "#fff",
                    transition: "all 0.2s",
                  }}
                >
                  {busy ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div className="landing-spinner" />
                      <span style={{ fontSize: 14, color: "#64748b" }}>Reading your connections...</span>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: "#ecfdf5", color: "#114B3A",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg style={{ width: 22, height: 22, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" x2="12" y1="3" y2="15" />
                        </svg>
                      </div>
                      <p style={{ marginTop: 12, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Drop the whole .zip here</p>
                      <p style={{ marginTop: 4, fontSize: 13, color: "#64748b" }}>Basic data (Connections) comes in ~10 min. The full archive takes 1-2 days but gives richer insights.</p>
                      <button style={{
                        marginTop: 16, padding: "10px 20px", borderRadius: 9999,
                        background: "#0C2D22", color: "#fff", fontSize: 14, fontWeight: 600,
                        border: "none", cursor: "pointer", fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        Choose file
                        <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                      </button>
                    </>
                  )}
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".zip,.csv,text/csv,application/zip"
                    style={{ display: "none" }}
                    onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }}
                  />
                </div>

                {error ? (
                  <p style={{
                    marginTop: 12, borderRadius: 8, border: "1px solid #ef4444",
                    background: "#fef2f2", padding: "8px 12px", fontSize: 13, color: "#dc2626",
                  }}>{error}</p>
                ) : null}

                <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                    <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Stays in this browser
                  </p>
                  <button
                    onClick={() => {
                      loadSample();
                      updateSettings((s) => ({ ...s, focus: { ...s.focus, confirmedAt: new Date().toISOString() } }));
                      router.push("/home");
                    }}
                    style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                      background: "#F4F3EE", color: "#334155", border: "1px solid #E8E6DF",
                      cursor: "pointer", fontFamily: "inherit",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Explore with sample data
                  </button>
                </div>
              </div>
            </div>
          </section>
          </div>
          )}
          {activeTab === "demo" && (
          <DemoTabContent loadSample={loadSample} updateSettings={updateSettings} router={router} hasData={!!dataset} setDestination={(p) => { destination.current = p; }} />
          )}
          {activeTab === "privacy" && (
          <PrivacyTabContent walkthroughOpen={walkthroughOpen} setWalkthroughOpen={setWalkthroughOpen} />
          )}
        </main>

        {/* ==================== FOOTER ==================== */}
        <footer style={{ marginTop: "auto", borderTop: "1px solid #E8E6DF", background: "#FAF8F5", padding: "48px 0" }}>
          <div className="w-wrap" style={{
            maxWidth: 1280, margin: "0 auto", padding: "0 48px",
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24,
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24, fontSize: 14, color: "#64748b" }}>
              <div style={{ height: 24, width: 1, background: "#cbd5e1" }} />
              <a href="https://www.linkedin.com/in/rishiagrawal2004" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", textDecoration: "none", fontWeight: 500 }}>
                <svg style={{ width: 16, height: 16, fill: "currentColor" }} viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                linkedin.com/in/rishiagrawal2004
              </a>
              <div style={{ height: 24, width: 1, background: "#cbd5e1" }} />
              <a href="mailto:agrawal123rishi@gmail.com" style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", textDecoration: "none", fontWeight: 500 }}>
                <svg style={{ width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 2 }} viewBox="0 0 24 24"><rect height="16" rx="2" width="20" x="2" y="4" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                agrawal123rishi@gmail.com
              </a>
            </div>

            {/* Handwritten note */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, color: "#64748b" }}>
              <svg style={{ width: 32, height: 32, color: "#64748b", transform: "scaleX(-1)", fill: "none", stroke: "currentColor", strokeWidth: 1.8 }} viewBox="0 0 40 40">
                <path d="M30 10 C20 12, 10 22, 12 32 M12 32 L8 25 M12 32 L19 28" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-hand" style={{ fontSize: 20, fontWeight: 600, color: "#334155", letterSpacing: "0.02em", transform: "rotate(-2deg)", display: "inline-block" }}>
                Always open to feedback!
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* ==================== EXPORT MODAL ==================== */}
      {showModal && <ExportModal
        settings={settings}
        people={people}
        modalTab={modalTab}
        setModalTab={setModalTab}
        updateSettings={updateSettings}
        onConfirm={() => { setShowModal(false); router.push("/home"); }}
      />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Export confirmation modal                                          */
/* ------------------------------------------------------------------ */
function ExportModal({
  settings, people, modalTab, setModalTab, updateSettings, onConfirm,
}: {
  settings: { profile: { name: string; background: string; schools: string[] } };
  people: { category?: string }[];
  modalTab: "summary" | "edit";
  setModalTab: (t: "summary" | "edit") => void;
  updateSettings: (fn: (s: Settings) => Settings) => void;
  onConfirm: () => void;
}) {
  const [editName, setEditName] = useState(settings.profile.name);
  const [editBg, setEditBg] = useState(settings.profile.background);
  const [editSchools, setEditSchools] = useState(settings.profile.schools);
  const [newSchool, setNewSchool] = useState("");

  const categoryCounts = new Map<string, number>();
  for (const p of people) {
    if (p.category) categoryCounts.set(p.category, (categoryCounts.get(p.category) ?? 0) + 1);
  }
  const topCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const saveEdits = () => {
    updateSettings((s) => ({
      ...s,
      profile: { ...s.profile, name: editName, background: editBg, schools: editSchools },
    }));
  };

  const confirmAndFinish = () => {
    if (modalTab === "edit") saveEdits();
    updateSettings((s) => ({ ...s, focus: { ...s.focus, confirmedAt: new Date().toISOString() } }));
    onConfirm();
  };

  const tabActive = "padding: 0 12px 8px; borderBottom: 2px solid #114B3A; color: #114B3A; fontWeight: 600;";
  const tabInactive = "padding: 0 12px 8px; color: #94a3b8; fontWeight: 600; cursor: pointer;";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, overflowY: "auto",
      background: "rgba(28,25,23,0.4)", backdropFilter: "blur(8px)",
    }}>
      <div style={{
        position: "relative", width: "100%", maxWidth: 672,
        background: "#fff", borderRadius: 24, border: "1px solid rgba(214,211,199,0.9)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        overflow: "hidden", padding: "24px 40px 32px",
      }}>
        {/* Close button */}
        <button
          onClick={onConfirm}
          style={{
            position: "absolute", top: 20, right: 20, zIndex: 20,
            width: 36, height: 36, borderRadius: "50%", background: "#f5f5f4",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#78716c", fontFamily: "inherit",
          }}
        >
          <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24">
            <line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" />
          </svg>
        </button>

        {/* Owl mascot badge */}
        <div style={{ position: "absolute", top: -12, right: 32, display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none", userSelect: "none" }}>
          <div style={{ position: "relative", marginBottom: 4 }}>
            <div style={{
              background: "#ecfdf5", border: "1px solid rgba(167,243,208,0.8)",
              color: "#065f46", fontSize: 11, fontWeight: 500,
              padding: "4px 10px", borderRadius: 9999, whiteSpace: "nowrap" as const,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}>Archive parsed!</div>
          </div>
          <div style={{ width: 64, height: 64 }}>
            <img
              alt="Inspector Owl Mascot"
              src="https://lh3.googleusercontent.com/aida/AEtjO1UY91Kw-C8aDDOQbSY0SoXF3GkpkHKNCORY6mY0BYEMThqetM8CH6y88MsU3ZG8TrjGiXAJhpu9S-34dHri-z03tE3uBpUZUKGlMvcPsg8L4Y29evZ3xHzEz8JYQiBP75C9mSYO6x2oweSYh0gbeBkM-AMEYLRywoTNbUD4VGQhq0XFuW-0AzKqeHlkr6BDx2jkqulkJNPySHWEZlgIcd7xAydbINIOdBiF05YBbiEXvCArsVhnVe3hHFg"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Header */}
        <div style={{ paddingRight: 96, marginBottom: 24 }}>
          <h2 className="font-serif" style={{ fontSize: "clamp(28px, 3vw, 36px)", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 8 }}>
            Here is what I understand about you.
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>Read from your own export. Only what was actually in the files.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #e7e5e4", marginBottom: 24, paddingBottom: 8, fontSize: 12, fontWeight: 600 }}>
          <button
            onClick={() => setModalTab("summary")}
            style={{
              padding: "0 12px 8px", border: "none", background: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 12, fontWeight: 600,
              borderBottom: modalTab === "summary" ? "2px solid #114B3A" : "2px solid transparent",
              color: modalTab === "summary" ? "#114B3A" : "#94a3b8",
            }}
          >Summary View</button>
          <button
            onClick={() => setModalTab("edit")}
            style={{
              padding: "0 12px 8px", border: "none", background: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 12, fontWeight: 600,
              borderBottom: modalTab === "edit" ? "2px solid #114B3A" : "2px solid transparent",
              color: modalTab === "edit" ? "#114B3A" : "#94a3b8",
            }}
          >Edit Fields</button>
        </div>

        {/* Summary tab */}
        {modalTab === "summary" && (
          <div style={{ borderLeft: "2px solid #6ee7b7", paddingLeft: 16, paddingTop: 4, paddingBottom: 4, marginBottom: 32, display: "flex", flexDirection: "column", gap: 20 }}>
            {settings.profile.background && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#64748b", marginBottom: 4, fontFamily: "monospace" }}>Currently</div>
                <p style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.5 }}>{settings.profile.background}</p>
              </div>
            )}
            {settings.profile.schools.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#64748b", marginBottom: 4, fontFamily: "monospace" }}>Studied At</div>
                <p style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.5 }}>{settings.profile.schools.join(" · ")}</p>
              </div>
            )}
            {topCategories.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#64748b", marginBottom: 6, fontFamily: "monospace" }}>Your Network is Concentrated In</div>
                <p style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.5 }}>
                  {topCategories.map(([cat, count]) => `${cat} (${count})`).join(" · ")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Edit tab */}
        {modalTab === "edit" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>Your name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  width: "100%", padding: "8px 14px", fontSize: 14, color: "#1e293b",
                  border: "1px solid #e7e5e4", borderRadius: 12, background: "rgba(245,245,244,0.5)",
                  fontFamily: "inherit", outline: "none",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>What you do right now</label>
              <input
                type="text"
                value={editBg}
                onChange={(e) => setEditBg(e.target.value)}
                style={{
                  width: "100%", padding: "8px 14px", fontSize: 14, color: "#1e293b",
                  border: "1px solid #e7e5e4", borderRadius: 12, background: "rgba(245,245,244,0.5)",
                  fontFamily: "inherit", outline: "none",
                }}
              />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Schools and colleges</label>
                <span style={{ fontSize: 11, color: "#64748b" }}>Connections from these count as alumni.</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                {editSchools.map((s, i) => (
                  <span key={i} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 12px", background: "#f5f5f4", border: "1px solid #e7e5e4",
                    borderRadius: 8, fontSize: 12, color: "#334155", fontWeight: 500,
                  }}>
                    {s}
                    <button
                      onClick={() => setEditSchools(editSchools.filter((_, j) => j !== i))}
                      style={{ color: "#64748b", cursor: "pointer", border: "none", background: "none", padding: 0, fontFamily: "inherit", fontSize: 14 }}
                    >&times;</button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="text"
                  value={newSchool}
                  onChange={(e) => setNewSchool(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSchool.trim()) {
                      setEditSchools([...editSchools, newSchool.trim()]);
                      setNewSchool("");
                    }
                  }}
                  placeholder="Add a school"
                  style={{
                    flexGrow: 1, padding: "6px 14px", fontSize: 12, color: "#1e293b",
                    border: "1px solid #e7e5e4", borderRadius: 12,
                    fontFamily: "inherit", outline: "none",
                  }}
                />
                <button
                  onClick={() => { if (newSchool.trim()) { setEditSchools([...editSchools, newSchool.trim()]); setNewSchool(""); } }}
                  style={{
                    padding: "6px 16px", fontSize: 12, fontWeight: 600,
                    border: "1px solid #e7e5e4", borderRadius: 12, background: "#fff",
                    color: "#334155", cursor: "pointer", fontFamily: "inherit",
                  }}
                >Add</button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ paddingTop: 16, borderTop: "1px solid #f5f5f4" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#1e293b", marginBottom: 12 }}>Anything I should add or change?</div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={confirmAndFinish}
                style={{
                  padding: "8px 20px", borderRadius: 12, background: "#0F2D24",
                  color: "#fff", fontSize: 12, fontWeight: 600, border: "none",
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >Looks right</button>
              <button
                onClick={() => setModalTab("edit")}
                style={{
                  padding: "8px 16px", borderRadius: 12, border: "1px solid #d6d3d1",
                  color: "#334155", fontSize: 12, fontWeight: 500,
                  background: "none", cursor: "pointer", fontFamily: "inherit",
                }}
              >Add or change</button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 24 }}>
            <div style={{ width: 20, height: 6, borderRadius: 9999, background: "#0F2D24" }} />
            <div style={{ width: 6, height: 6, borderRadius: 9999, background: "#d6d3d1" }} />
            <div style={{ width: 6, height: 6, borderRadius: 9999, background: "#d6d3d1" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Demo tab content                                                   */
/* ------------------------------------------------------------------ */
function DemoTabContent({ loadSample, updateSettings, router, hasData, setDestination }: { loadSample: () => void; updateSettings: (fn: (s: Settings) => Settings) => void; router: ReturnType<typeof useRouter>; hasData: boolean; setDestination: (path: string) => void }) {
  const [activeScreen, setActiveScreen] = useState(0);
  const tryIt = (path: string) => {
    if (!hasData) {
      setDestination(path);
      loadSample();
      updateSettings((s) => ({ ...s, focus: { ...s.focus, confirmedAt: new Date().toISOString() } }));
    }
    router.push(path);
  };
  const screens = [
    {
      title: "Home Dashboard",
      desc: "See your entire network at a glance. Stat cards show total connections, pending follow-ups, active outreach, and response rates. Owlie sits on the dashboard to help you navigate.",
      icon: (
        <svg style={{ width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 2 }} viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
      ),
      mockup: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Total People", val: "1,248", color: "#0C2D22" },
              { label: "To Contact", val: "47", color: "#2563eb" },
              { label: "Awaiting Reply", val: "12", color: "#d97706" },
              { label: "Replied", val: "31", color: "#047857" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8E6DF", padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8E6DF", padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", marginBottom: 8 }}>Recent Activity</div>
            {["Neha Sharma replied to your message", "Follow-up due: Rohit Verma", "Aarav Mehta moved to Contacted"].map((a, i) => (
              <div key={i} style={{ padding: "6px 0", borderTop: i ? "1px solid #f1f5f9" : "none", fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? "#059669" : i === 1 ? "#d97706" : "#2563eb", flexShrink: 0 }} />
                {a}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Find People",
      desc: "Filter your network by role, industry, or intent. Select tiles to narrow down exactly who you need -- product managers at startups, engineers at FAANG, or alumni from your school.",
      icon: (
        <svg style={{ width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 2 }} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
      ),
      mockup: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#334155" }}>Select Roles</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {["Product Manager", "Software Engineer", "Data Scientist", "Consultant", "Designer", "Founder"].map((r, i) => (
              <div key={r} style={{
                padding: "8px 10px", borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: "pointer", textAlign: "center",
                background: i < 2 ? "#ecfdf5" : "#fff",
                border: i < 2 ? "1.5px solid #059669" : "1px solid #E8E6DF",
                color: i < 2 ? "#065f46" : "#64748b",
              }}>
                {i < 2 && <span style={{ marginRight: 4 }}>&#10003;</span>}
                {r}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 4, padding: "8px 12px", borderRadius: 8, background: "#ecfdf5", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#065f46", fontWeight: 500 }}>2 roles selected -- 186 matches</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#047857" }}>Show People &rarr;</span>
          </div>
        </div>
      ),
    },
    {
      title: "People & Outreach",
      desc: "View detailed profiles with relationship context, compose personalized messages from templates, and track every interaction. Never lose track of who you reached out to.",
      icon: (
        <svg style={{ width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 2 }} viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
      ),
      mockup: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { initials: "NS", name: "Neha Sharma", role: "Product Manager at Google", status: "Replied", statusColor: "#059669" },
            { initials: "AM", name: "Aarav Mehta", role: "Supply Chain Lead, Ex-Flipkart", status: "Contacted", statusColor: "#8b5cf6" },
            { initials: "IK", name: "Isha Kapoor", role: "Data Scientist at Cred", status: "To contact", statusColor: "#2563eb" },
          ].map((p) => (
            <div key={p.initials} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10, border: "1px solid #f1f5f9", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f3e8ff", color: "#6b21a8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 }}>{p.initials}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>{p.role}</div>
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: p.statusColor, background: `${p.statusColor}15`, padding: "2px 8px", borderRadius: 6 }}>{p.status}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Reminders & Follow-ups",
      desc: "Automated follow-up cadences ensure you never drop the ball. Set reminders per person, see overdue items, and keep your outreach momentum going week after week.",
      icon: (
        <svg style={{ width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 2 }} viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
      ),
      mockup: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { name: "Rohit Verma", action: "Follow up on referral request", due: "Today", urgent: true },
            { name: "Neha Sharma", action: "Send thank-you after call", due: "Tomorrow", urgent: false },
            { name: "Isha Kapoor", action: "Initial outreach", due: "In 3 days", urgent: false },
          ].map((r) => (
            <div key={r.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10, border: r.urgent ? "1px solid #fca5a5" : "1px solid #f1f5f9", background: r.urgent ? "#fef2f2" : "#fff" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{r.name}</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>{r.action}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: r.urgent ? "#dc2626" : "#64748b", padding: "2px 8px", borderRadius: 6, background: r.urgent ? "#fee2e2" : "#f1f5f9" }}>{r.due}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section className="hero-glow" style={{ position: "relative", paddingTop: 40, paddingBottom: 80, overflow: "hidden" }}>
      <div className="w-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 9999, background: "#ecfdf5", border: "1px solid #a7f3d0", fontSize: 12, fontWeight: 600, color: "#065f46", marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            Interactive Preview
          </div>
          <h2 className="font-serif" style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 700, color: "#0C2D22", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>
            See NEST in action
          </h2>
          <p style={{ color: "#64748b", fontSize: "clamp(14px, 1.2vw, 18px)", fontWeight: 300, lineHeight: 1.6 }}>
            Explore the key screens before importing your own data. Everything runs locally in your browser.
          </p>
        </div>

        {/* Screen selector + preview */}
        <div className="w-split" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, maxWidth: 960, margin: "0 auto" }}>
          {/* Left: screen list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {screens.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setActiveScreen(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit",
                  textAlign: "left", transition: "all 0.2s",
                  background: activeScreen === i ? "#0C2D22" : "#fff",
                  color: activeScreen === i ? "#fff" : "#334155",
                  boxShadow: activeScreen === i ? "0 4px 12px rgba(12,45,34,0.2)" : "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: activeScreen === i ? "rgba(255,255,255,0.15)" : "#EBF6F1",
                  color: activeScreen === i ? "#fff" : "#0C2D22",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>
                    {i === 0 ? "Network overview" : i === 1 ? "Smart filters" : i === 2 ? "Manage contacts" : "Stay on track"}
                  </div>
                </div>
              </button>
            ))}

            {/* CTA */}
            <button
              onClick={() => {
                loadSample();
                updateSettings((s) => ({ ...s, focus: { ...s.focus, confirmedAt: new Date().toISOString() } }));
                router.push("/home");
              }}
              className="cta-main"
              style={{
                marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px 20px", borderRadius: 9999, border: "none",
                background: "#0C2D22", color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 12px rgba(12,45,34,0.2)",
              }}
            >
              Try with Sample Data
              <span className="cta-arrow" style={{
                width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg style={{ width: 12, height: 12, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
              </span>
            </button>
          </div>

          {/* Right: preview card */}
          <div className="shadow-float-l" style={{
            background: "#fff", borderRadius: 16, border: "1px solid #E8E6DF",
            overflow: "hidden",
          }}>
            {/* Window bar */}
            <div style={{
              padding: "12px 16px", background: "rgba(248,250,252,0.8)",
              borderBottom: "1px solid #E8E6DF",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,95,86,0.8)" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,189,46,0.8)" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(39,201,63,0.8)" }} />
              </div>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{screens[activeScreen].title}</span>
              <div style={{ width: 48 }} />
            </div>

            {/* Content */}
            <div style={{ padding: 20 }}>
              {screens[activeScreen].mockup}
            </div>

            {/* Description */}
            <div style={{ padding: "12px 20px 16px", borderTop: "1px solid #E8E6DF", background: "rgba(244,243,238,0.4)" }}>
              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{screens[activeScreen].desc}</p>
            </div>
          </div>
        </div>

        <Playbook hasData={hasData} tryIt={tryIt} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Privacy tab content (inline, same background)                      */
/* ------------------------------------------------------------------ */
function PrivacyTabContent({ walkthroughOpen, setWalkthroughOpen }: { walkthroughOpen: boolean; setWalkthroughOpen: (v: boolean) => void }) {
  return (
    <>
      {/* Hero */}
      <section className="hero-glow" style={{ position: "relative", paddingTop: 40, paddingBottom: 64, overflow: "hidden" }}>
        <div className="w-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
          <div className="w-split" style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 48, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <h1 className="font-serif" style={{
                fontSize: "clamp(48px, 5vw, 72px)", fontWeight: 400,
                letterSpacing: "-0.01em", color: "#0C2D22", lineHeight: 1.08,
              }}>
                Privacy so simple,<br />
                <span style={{ fontStyle: "italic", color: "#114B3A" }}>there&apos;s nothing</span> to hide.
              </h1>
              <p style={{ fontSize: "clamp(16px, 1.4vw, 20px)", color: "#64748b", fontWeight: 300, lineHeight: 1.6, maxWidth: 560 }}>
                No remote cloud databases. No password requests. No automated web-bots scraping your account. All contact intelligence computes right inside your own browser window.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, paddingTop: 8 }}>
                {["Zero data uploads", "Client-side only", "Works offline"].map((t) => (
                  <div key={t} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "#fff", padding: "8px 14px", borderRadius: 8,
                    border: "1px solid #E8E6DF", fontSize: 12, fontWeight: 600, color: "#44403c",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 320, height: 320 }} className="anim-owl">
                <ZenOwlSvg />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Info Cards */}
      <section style={{ padding: "48px 0", background: "#fff", borderTop: "1px solid #E8E6DF", borderBottom: "1px solid #E8E6DF" }}>
        <div className="w-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
            <h2 className="font-serif" style={{ fontSize: "clamp(28px, 3.5vw, 40px)", color: "#0C2D22", fontWeight: 700, letterSpacing: "-0.02em" }}>
              How your privacy is protected
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>Zero technical jargon. Just pure, transparent local software.</p>
          </div>
          <div className="w-grid4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {/* Card 1 */}
            <div className="info-banner" style={{ background: "#FAF8F5", borderRadius: 16, border: "1px solid #E8E6DF", padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ height: 128, borderRadius: 12, background: "#F4F3EE", border: "1px solid #E8E6DF", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", marginBottom: 20 }}>
                  <div style={{ width: 96, height: 64, borderRadius: 6, background: "#292524", border: "2px solid #44403c", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <div style={{ width: 64, height: 36, borderRadius: 4, background: "#0C2D22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div className="anim-pulse" style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }} />
                      </div>
                    </div>
                    <div style={{ position: "absolute", bottom: -6, width: 112, height: 4, background: "#a8a29e", borderRadius: 9999 }} />
                  </div>
                  <span style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 9999 }}>Local Only</span>
                </div>
                <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: 16, marginBottom: 6 }}>Stays In Your Browser</h3>
                <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>Your contacts are read and organized inside your personal browser memory. Never uploaded.</p>
              </div>
              <div style={{ paddingTop: 16, marginTop: 16, borderTop: "1px solid #E8E6DF", fontSize: 12, fontWeight: 600, color: "#065f46" }}>Client-side computing</div>
            </div>
            {/* Card 2 */}
            <div className="info-banner" style={{ background: "#FAF8F5", borderRadius: 16, border: "1px solid #E8E6DF", padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ height: 128, borderRadius: 12, background: "#F4F3EE", border: "1px solid #E8E6DF", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", marginBottom: 20 }}>
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg style={{ width: 64, height: 64, color: "#a8a29e" }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div style={{ position: "absolute", width: 80, height: 2, background: "#ef4444", transform: "rotate(45deg)", borderRadius: 9999 }} />
                  </div>
                  <span style={{ position: "absolute", bottom: 8, padding: "2px 10px", borderRadius: 6, background: "#1c1917", color: "#fbbf24", fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>0 Bytes Sent</span>
                </div>
                <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: 16, marginBottom: 6 }}>Zero Cloud Servers</h3>
                <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>We have no database servers to store or view your contacts, even if we wanted to.</p>
              </div>
              <div style={{ paddingTop: 16, marginTop: 16, borderTop: "1px solid #E8E6DF", fontSize: 12, fontWeight: 600, color: "#065f46" }}>No remote storage</div>
            </div>
            {/* Card 3 */}
            <div className="info-banner" style={{ background: "#FAF8F5", borderRadius: 16, border: "1px solid #E8E6DF", padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ height: 128, borderRadius: 12, background: "#F4F3EE", border: "1px solid #E8E6DF", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", marginBottom: 20 }}>
                  <div style={{ width: 56, height: 64, background: "#fff", borderRadius: 8, border: "2px solid #d6d3d1", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 8, position: "relative" }}>
                    <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: "#57534e" }}>.ZIP</span>
                    <div style={{ width: 24, height: 4, background: "#e7e5e4", marginTop: 4, borderRadius: 9999 }} />
                    <div style={{ width: 16, height: 4, background: "#e7e5e4", marginTop: 4, borderRadius: 9999 }} />
                    <div style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, background: "#10B981", borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                      <svg style={{ width: 12, height: 12, fill: "none", stroke: "currentColor", strokeWidth: 3 }} viewBox="0 0 24 24"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                  <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10, fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em" }}>Direct Import</span>
                </div>
                <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: 16, marginBottom: 6 }}>No Passwords Needed</h3>
                <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>Never share credentials. Simply load your official exported LinkedIn archive.</p>
              </div>
              <div style={{ paddingTop: 16, marginTop: 16, borderTop: "1px solid #E8E6DF", fontSize: 12, fontWeight: 600, color: "#065f46" }}>Zero account risk</div>
            </div>
            {/* Card 4 */}
            <div className="info-banner" style={{ background: "#FAF8F5", borderRadius: 16, border: "1px solid #E8E6DF", padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ height: 128, borderRadius: 12, background: "#F4F3EE", border: "1px solid #E8E6DF", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", marginBottom: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ padding: "8px 16px", background: "#1c1917", color: "#fff", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                      <svg style={{ width: 14, height: 14, color: "#f87171" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Clear Memory</span>
                    </div>
                    <span style={{ fontSize: 10, color: "#78716c", fontFamily: "monospace" }}>100% Instant Wipe</span>
                  </div>
                </div>
                <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: 16, marginBottom: 6 }}>One-Click Erase Anytime</h3>
                <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>Close your tab or hit reset. Every cached record vanishes permanently without a trace.</p>
              </div>
              <div style={{ paddingTop: 16, marginTop: 16, borderTop: "1px solid #E8E6DF", fontSize: 12, fontWeight: 600, color: "#065f46" }}>You hold full control</div>
            </div>
          </div>
        </div>
      </section>

      <WalkthroughSection walkthroughOpen={walkthroughOpen} setWalkthroughOpen={setWalkthroughOpen} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Walkthrough section (shared by Home + Privacy tabs)                */
/* ------------------------------------------------------------------ */
function NestStepOwl({ progress }: { progress: number }) {
  const nestW = 54 + progress * 0.26;
  const nestH = 8 + progress * 0.08;
  return (
    <svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Nest */}
      <ellipse cx="50" cy="82" rx={nestW / 2} ry={nestH / 2} fill="#E8C396" fillOpacity={0.3 + progress * 0.005} stroke="#C28230" strokeWidth="1.5" />
      {progress > 20 && <path d={`M ${50 - nestW / 2 + 5} 80 Q 50 ${86 + progress * 0.04} ${50 + nestW / 2 - 5} 80`} stroke="#9C5E19" strokeWidth="1.5" strokeLinecap="round" fill="none" />}
      {progress > 50 && <path d={`M ${50 - nestW / 2 + 10} 82 Q 50 ${88 + progress * 0.02} ${50 + nestW / 2 - 10} 82`} stroke="#783F0E" strokeWidth="1.2" strokeLinecap="round" fill="none" />}
      {progress >= 100 && <>
        <path d="M 22 79 L 16 76" stroke="#C28230" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 78 79 L 84 76" stroke="#C28230" strokeWidth="1.2" strokeLinecap="round" />
      </>}
      {/* Owl body */}
      <ellipse cx="50" cy="56" rx="22" ry="26" fill="#D9B382" stroke="#4A2E16" strokeWidth="2" />
      <path d="M36 54 Q50 74 64 54 Q58 80 42 80 Q34 78 36 54Z" fill="#FAF2E4" stroke="#C8A26A" strokeWidth="1" />
      {/* Ears */}
      <path d="M32 32 L27 18 Q34 24 38 28" fill="#B0824E" stroke="#4A2E16" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M68 32 L73 18 Q66 24 62 28" fill="#B0824E" stroke="#4A2E16" strokeWidth="1.8" strokeLinejoin="round" />
      {/* Eyes */}
      <circle cx="40" cy="40" r="10" fill="#fff" stroke="#114B3A" strokeWidth="2" />
      <circle cx="60" cy="40" r="10" fill="#fff" stroke="#114B3A" strokeWidth="2" />
      <circle cx="41" cy="40" r="5" fill="#2A180B" />
      <circle cx="59" cy="40" r="5" fill="#2A180B" />
      <circle cx="39.5" cy="38" r="1.8" fill="#fff" />
      <circle cx="57.5" cy="38" r="1.8" fill="#fff" />
      {/* Glasses bridge */}
      <path d="M49.5 40 L50.5 40" stroke="#114B3A" strokeWidth="2" strokeLinecap="round" />
      {/* Beak */}
      <polygon points="50,46 47,52 53,52" fill="#E58B24" stroke="#B8650C" strokeWidth="1" />
      {/* Feet */}
      <path d="M42 80 Q43 86 45 80" stroke="#E58B24" strokeWidth="2" strokeLinecap="round" />
      <path d="M55 80 Q56 86 58 80" stroke="#E58B24" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WalkthroughSection({ walkthroughOpen: _, setWalkthroughOpen: __ }: { walkthroughOpen: boolean; setWalkthroughOpen: (v: boolean) => void }) {
  const steps = [
    { phase: "First Twig", pct: 15, title: "Profile picture", desc: "Open LinkedIn and click the Me option (profile picture)." },
    { phase: "Base Weave", pct: 35, title: "Settings & Privacy", desc: "Go to Settings & Privacy from the account menu." },
    { phase: "Half Nest", pct: 50, title: "Download your data", desc: "Click on Data privacy then \"Download your data\"." },
    { phase: "Cozy Shaping", pct: 70, title: "Larger data only", desc: "Select \"Larger data only\" to capture your connections." },
    { phase: "Final Touches", pct: 90, title: "Request archive", desc: "Click Request archive to begin the LinkedIn export." },
    { phase: "Nest Complete", pct: 100, title: "Wait for email", desc: "Your archive is ready within 24h. Drop your zip into NEST to explore!" },
  ];
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", marginBottom: 32 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0C2D22", textAlign: "center", marginBottom: 24 }}>
        Steps to Download Your LinkedIn Data
      </h3>
      <div className="w-grid3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {steps.map((s, i) => {
          const isLast = i === 5;
          return (
            <div key={i} style={{
              background: isLast ? "#ecfdf5" : "#fff",
              borderRadius: 16, padding: "16px 16px 14px",
              border: isLast ? "2px solid #059669" : "1px solid #E8E6DF",
              boxShadow: isLast ? "0 0 0 3px rgba(16,185,129,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex", flexDirection: "column", position: "relative",
            }}>
              {/* Header row: badge + phase label ... owl */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: isLast ? "#059669" : "#0C2D22", color: "#fff",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, fontFamily: "monospace", flexShrink: 0,
                  }}>{i + 1}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                    textTransform: "uppercase" as const,
                    color: isLast ? "#047857" : "#0C2D22",
                  }}>{s.phase} ({s.pct}%)</span>
                </div>
                <NestStepOwl progress={s.pct} />
              </div>
              {/* Title + desc */}
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{s.title}</h4>
              <p style={{ fontSize: 12, color: "#57534e", lineHeight: 1.5, margin: 0, flex: 1 }}>{s.desc}</p>
              {/* Progress bar */}
              <div style={{ marginTop: 12 }}>
                <div style={{
                  height: 5, borderRadius: 3,
                  background: isLast ? "rgba(16,185,129,0.2)" : "#E8E6DF",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    width: `${s.pct}%`,
                    background: isLast ? "#059669" : "#0C2D22",
                    transition: "width 0.4s",
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, color: "#065f46", fontWeight: 500 }}>
        <svg style={{ width: 14, height: 14, color: "#047857", fill: "none", stroke: "currentColor", strokeWidth: 2.5 }} viewBox="0 0 24 24"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Official LinkedIn feature. No bots or scrapers involved.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Zen Owl SVG (Privacy mascot)                                       */
/* ------------------------------------------------------------------ */
function ZenOwlSvg() {
  return (
    <svg height="100%" viewBox="0 0 320 340" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter height="120%" id="soft-shadow-vault" width="120%" x="-10%" y="-10%">
          <feDropShadow dx="0" dy="6" floodColor="#0f2d24" floodOpacity="0.12" stdDeviation="8" />
        </filter>
      </defs>
      <g filter="url(#soft-shadow-vault)">
        <path d="M 50 270 Q 160 260 270 250" fill="none" stroke="#2D2823" strokeLinecap="round" strokeWidth="3.5" />
        <path d="M 70 273 L 130 267" fill="none" opacity="0.5" stroke="#2D2823" strokeLinecap="round" strokeWidth="2" />
        <path d="M 180 260 L 245 253" fill="none" opacity="0.5" stroke="#2D2823" strokeLinecap="round" strokeWidth="2" />
        <path d="M 105 255 C 100 280 102 300 115 315 C 122 312 125 300 128 285 C 132 305 138 312 144 310 C 148 295 147 280 144 260 Z" fill="#D3A26B" stroke="#2D2823" strokeLinejoin="round" strokeWidth="3" />
        <g>
          <rect fill="#0F2D24" height="38" rx="6" stroke="#2D2823" strokeWidth="2.5" width="34" x="62" y="180" />
          <path d="M 70 180 L 70 168 C 70 159 88 159 88 168 L 88 180" fill="none" stroke="#DDA861" strokeLinecap="round" strokeWidth="3.5" />
          <circle cx="79" cy="195" fill="#E59E3F" r="4" />
          <polygon fill="#E59E3F" points="77,196 81,196 82,206 76,206" />
          <path d="M 95 178 C 82 188 68 215 74 240 C 80 248 88 245 94 235 C 98 245 104 245 108 234 C 112 222 112 205 110 185 Z" fill="#DFB27D" stroke="#2D2823" strokeLinejoin="round" strokeWidth="3" />
        </g>
        <g>
          <path d="M 195 175 C 220 165 245 150 252 130 C 242 138 232 150 225 158 C 242 140 256 128 260 115 C 262 108 255 106 248 116 C 242 125 235 138 226 150 C 238 130 248 120 248 108 C 248 102 242 100 236 108 C 225 125 212 155 198 185 Z" fill="#DFB27D" stroke="#2D2823" strokeLinejoin="round" strokeWidth="3" />
          <circle cx="218" cy="162" fill="#10B981" r="11" stroke="#0F2D24" strokeWidth="2" />
          <path d="M 214 162 L 217 165 L 223 158" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        </g>
        <path d="M 90 170 C 80 210 95 265 140 268 C 185 270 210 220 205 170 C 200 140 190 135 150 135 C 105 135 95 145 90 170 Z" fill="#E8C396" stroke="#2D2823" strokeLinejoin="round" strokeWidth="3.5" />
        <path d="M 112 165 C 105 195 115 252 145 255 C 175 255 188 205 182 165 C 178 152 165 148 147 148 C 128 148 116 152 112 165 Z" fill="#FFF8EE" stroke="#2D2823" strokeWidth="2.5" />
        <path d="M 130 185 Q 137 191 144 185 Q 151 191 158 185" fill="none" stroke="#D3A26B" strokeLinecap="round" strokeWidth="2.5" />
        <path d="M 125 202 Q 132 208 139 202 Q 146 208 153 202 Q 160 208 167 202" fill="none" stroke="#D3A26B" strokeLinecap="round" strokeWidth="2.5" />
        <path d="M 132 220 Q 139 226 146 220 Q 153 226 160 220" fill="none" stroke="#D3A26B" strokeLinecap="round" strokeWidth="2.5" />
        <g fill="#F29339" stroke="#2D2823" strokeLinejoin="round" strokeWidth="2.5">
          <ellipse cx="126" cy="265" rx="5.5" ry="8" transform="rotate(-15 126 265)" />
          <ellipse cx="135" cy="266" rx="5.5" ry="8.5" />
          <ellipse cx="144" cy="265" rx="5.5" ry="8" transform="rotate(15 144 265)" />
          <ellipse cx="170" cy="258" rx="5.5" ry="8" transform="rotate(-15 170 258)" />
          <ellipse cx="179" cy="259" rx="5.5" ry="8.5" />
          <ellipse cx="188" cy="258" rx="5.5" ry="8" transform="rotate(15 188 258)" />
        </g>
        <g>
          <path d="M 82 85 C 72 65 80 40 96 35 C 105 45 108 55 110 65 C 122 55 140 50 160 52 C 175 52 188 58 196 68 C 200 55 208 42 220 38 C 228 50 226 70 216 90 C 230 115 228 145 210 165 C 185 185 115 185 88 160 C 75 138 74 108 82 85 Z" fill="#E8C396" stroke="#2D2823" strokeLinejoin="round" strokeWidth="3.5" />
          <path d="M 148 48 C 145 35 152 28 156 22 C 158 30 157 38 155 45" fill="#DFB27D" stroke="#2D2823" strokeLinejoin="round" strokeWidth="2.5" />
          <path d="M 138 50 C 132 40 135 32 140 26 C 143 35 143 42 142 49" fill="#DFB27D" stroke="#2D2823" strokeLinejoin="round" strokeWidth="2.5" />
          <circle cx="118" cy="112" fill="#FFFFFF" r="33" stroke="#231F1C" strokeWidth="6" />
          <circle cx="178" cy="110" fill="#FFFFFF" r="33" stroke="#231F1C" strokeWidth="6" />
          <path d="M 148 110 L 151 110" stroke="#231F1C" strokeLinecap="round" strokeWidth="7" />
          <path d="M 85 114 L 75 118" stroke="#231F1C" strokeLinecap="round" strokeWidth="5" />
          <path d="M 210 110 L 222 112" stroke="#231F1C" strokeLinecap="round" strokeWidth="5" />
          <path d="M 104 114 Q 118 96 132 114" fill="none" stroke="#1A1817" strokeLinecap="round" strokeWidth="5.5" />
          <path d="M 164 112 Q 178 94 192 112" fill="none" stroke="#1A1817" strokeLinecap="round" strokeWidth="5.5" />
          <path d="M 130 108 L 136 104" stroke="#1A1817" strokeLinecap="round" strokeWidth="3" />
          <path d="M 190 106 L 196 102" stroke="#1A1817" strokeLinecap="round" strokeWidth="3" />
          <ellipse cx="96" cy="136" fill="#F4B5A4" opacity="0.7" rx="9" ry="6" />
          <ellipse cx="200" cy="134" fill="#F4B5A4" opacity="0.7" rx="9" ry="6" />
          <polygon fill="#F29339" points="149,110 140,125 158,125" stroke="#2D2823" strokeLinejoin="round" strokeWidth="2.5" />
          <path d="M 142 125 Q 149 135 156 125 Z" fill="#D9534F" stroke="#2D2823" strokeWidth="1.5" />
        </g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline step wrapper                                              */
/* ------------------------------------------------------------------ */
function TimelineStep({ step, label, children }: { step: string; label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="tl-step" style={{
      position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
      alignItems: "center", textAlign: "center", cursor: "pointer",
      width: "25%", padding: "0 4px",
    }}>
      <div className="tl-owl" style={{ height: 80, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 4 }}>
        {children}
      </div>
      {/* Node */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <div className="tl-node" style={{
          width: 20, height: 20, borderRadius: "50%", background: "#114B3A",
          boxShadow: "0 0 0 4px #fff, 0 2px 4px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
        </div>
      </div>
      {/* Tag */}
      <span className="tl-tag" style={{
        display: "inline-block", padding: "2px 10px", marginBottom: 6,
        fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
        color: "#065f46", background: "#ecfdf5", border: "1px solid rgba(16,185,129,0.8)",
        borderRadius: 9999, fontFamily: "monospace",
      }}>Step {step}</span>
      <div className="tl-label" style={{ fontSize: "clamp(13px, 1.1vw, 16px)", fontWeight: 700, letterSpacing: "-0.01em", color: "#1e293b", lineHeight: 1.3 }}>
        {label}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline SVG owls — faithful to the Stitch design                    */
/* ------------------------------------------------------------------ */

function OwlInspecting() {
  return (
    <svg style={{ width: 64, height: 80, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.05))" }} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="68" rx="34" ry="40" fill="#D9B382" stroke="#4A2E16" strokeWidth="3" />
      <path d="M28 66 Q50 96 72 66 Q64 104 36 104 Q26 100 28 66Z" fill="#FAF2E4" stroke="#C8A26A" strokeWidth="1.5" />
      <path d="M42 80 Q50 85 58 80" stroke="#B89052" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M45 90 Q50 94 55 90" stroke="#B89052" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M24 38 L16 18 Q28 26 36 31" fill="#B0824E" stroke="#4A2E16" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M76 38 L84 18 Q72 26 64 31" fill="#B0824E" stroke="#4A2E16" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="36" cy="46" r="14" fill="#FFFFFF" stroke="#4A2E16" strokeWidth="2.5" />
      <circle cx="64" cy="46" r="14" fill="#FFFFFF" stroke="#4A2E16" strokeWidth="2.5" />
      <circle cx="38" cy="46" r="7" fill="#2A180B" />
      <circle cx="62" cy="46" r="7" fill="#2A180B" />
      <circle cx="36" cy="43" r="2.5" fill="#FFFFFF" />
      <circle cx="60" cy="43" r="2.5" fill="#FFFFFF" />
      <circle cx="36" cy="46" r="15.5" stroke="#114B3A" strokeWidth="3" fill="none" />
      <circle cx="64" cy="46" r="15.5" stroke="#114B3A" strokeWidth="3" fill="none" />
      <path d="M51.5 46 L48.5 46" stroke="#114B3A" strokeWidth="3" strokeLinecap="round" />
      <polygon points="50,53 45,61 55,61" fill="#E58B24" stroke="#B8650C" strokeWidth="1.5" />
      <path d="M16 68 Q12 85 24 92" stroke="#4A2E16" strokeWidth="3" strokeLinecap="round" fill="#D9B382" />
      <line x1="22" y1="76" x2="10" y2="95" stroke="#B8650C" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="24" cy="72" r="10" fill="#EBF6F1" fillOpacity="0.75" stroke="#114B3A" strokeWidth="2.5" />
      <path d="M20 68 A 5 5 0 0 1 27 68" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M38 106 Q40 114 42 106" stroke="#E58B24" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 106 Q60 114 62 106" stroke="#E58B24" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function OwlTelescope() {
  return (
    <svg style={{ width: 64, height: 80, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.05))" }} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="68" rx="34" ry="40" fill="#D9B382" stroke="#4A2E16" strokeWidth="3" />
      <path d="M28 66 Q50 96 72 66 Q64 104 36 104 Q26 100 28 66Z" fill="#FAF2E4" stroke="#C8A26A" strokeWidth="1.5" />
      <path d="M42 80 Q50 85 58 80" stroke="#B89052" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M45 90 Q50 94 55 90" stroke="#B89052" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M24 38 L16 18 Q28 26 36 31" fill="#B0824E" stroke="#4A2E16" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M76 38 L84 18 Q72 26 64 31" fill="#B0824E" stroke="#4A2E16" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="36" cy="46" r="14" fill="#FFFFFF" stroke="#4A2E16" strokeWidth="2.5" />
      <circle cx="64" cy="46" r="14" fill="#FFFFFF" stroke="#4A2E16" strokeWidth="2.5" />
      <circle cx="40" cy="44" r="6.5" fill="#2A180B" />
      <circle cx="68" cy="44" r="6.5" fill="#2A180B" />
      <circle cx="38" cy="41" r="2.5" fill="#FFFFFF" />
      <circle cx="66" cy="41" r="2.5" fill="#FFFFFF" />
      <circle cx="36" cy="46" r="15.5" stroke="#114B3A" strokeWidth="3" fill="none" />
      <circle cx="64" cy="46" r="15.5" stroke="#114B3A" strokeWidth="3" fill="none" />
      <path d="M51.5 46 L48.5 46" stroke="#114B3A" strokeWidth="3" strokeLinecap="round" />
      <polygon points="50,53 45,61 55,61" fill="#E58B24" stroke="#B8650C" strokeWidth="1.5" />
      <g transform="rotate(-20 65 70)">
        <rect x="58" y="58" width="28" height="8" rx="3" fill="#114B3A" stroke="#0C2D22" strokeWidth="1.5" />
        <rect x="82" y="56" width="12" height="12" rx="2" fill="#E58B24" stroke="#0C2D22" strokeWidth="1.5" />
        <circle cx="94" cy="62" r="4" fill="#EBF6F1" />
      </g>
      <path d="M38 106 Q40 114 42 106" stroke="#E58B24" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 106 Q60 114 62 106" stroke="#E58B24" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function OwlEnvelope() {
  return (
    <svg style={{ width: 64, height: 80, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.05))" }} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="68" rx="34" ry="40" fill="#D9B382" stroke="#4A2E16" strokeWidth="3" />
      <path d="M28 66 Q50 96 72 66 Q64 104 36 104 Q26 100 28 66Z" fill="#FAF2E4" stroke="#C8A26A" strokeWidth="1.5" />
      <path d="M42 80 Q50 85 58 80" stroke="#B89052" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M45 90 Q50 94 55 90" stroke="#B89052" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M24 38 L16 18 Q28 26 36 31" fill="#B0824E" stroke="#4A2E16" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M76 38 L84 18 Q72 26 64 31" fill="#B0824E" stroke="#4A2E16" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="36" cy="46" r="14" fill="#FFFFFF" stroke="#4A2E16" strokeWidth="2.5" />
      <circle cx="64" cy="46" r="14" fill="#FFFFFF" stroke="#4A2E16" strokeWidth="2.5" />
      <circle cx="36" cy="46" r="7" fill="#2A180B" />
      <circle cx="64" cy="46" r="7" fill="#2A180B" />
      <circle cx="34" cy="43" r="2.5" fill="#FFFFFF" />
      <circle cx="62" cy="43" r="2.5" fill="#FFFFFF" />
      <circle cx="36" cy="46" r="15.5" stroke="#114B3A" strokeWidth="3" fill="none" />
      <circle cx="64" cy="46" r="15.5" stroke="#114B3A" strokeWidth="3" fill="none" />
      <path d="M51.5 46 L48.5 46" stroke="#114B3A" strokeWidth="3" strokeLinecap="round" />
      <polygon points="50,53 45,61 55,61" fill="#E58B24" stroke="#B8650C" strokeWidth="1.5" />
      <path d="M74 65 Q88 56 94 64" stroke="#4A2E16" strokeWidth="3" strokeLinecap="round" fill="none" />
      <g transform="translate(66, 68) rotate(12)">
        <rect x="0" y="0" width="22" height="15" rx="2.5" fill="#FFFFFF" stroke="#114B3A" strokeWidth="1.8" />
        <path d="M1 1 L11 9 L21 1" stroke="#114B3A" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
        <circle cx="11" cy="9" r="2" fill="#E58B24" />
      </g>
      <path d="M38 106 Q40 114 42 106" stroke="#E58B24" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 106 Q60 114 62 106" stroke="#E58B24" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function OwlAlarm() {
  return (
    <svg style={{ width: 64, height: 80, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.05))" }} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="68" rx="34" ry="40" fill="#D9B382" stroke="#4A2E16" strokeWidth="3" />
      <path d="M28 66 Q50 96 72 66 Q64 104 36 104 Q26 100 28 66Z" fill="#FAF2E4" stroke="#C8A26A" strokeWidth="1.5" />
      <path d="M42 80 Q50 85 58 80" stroke="#B89052" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M45 90 Q50 94 55 90" stroke="#B89052" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M24 38 L16 18 Q28 26 36 31" fill="#B0824E" stroke="#4A2E16" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M76 38 L84 18 Q72 26 64 31" fill="#B0824E" stroke="#4A2E16" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="36" cy="46" r="14" fill="#FFFFFF" stroke="#4A2E16" strokeWidth="2.5" />
      <circle cx="64" cy="46" r="14" fill="#FFFFFF" stroke="#4A2E16" strokeWidth="2.5" />
      <circle cx="36" cy="46" r="7" fill="#2A180B" />
      <path d="M58 46 Q64 40 70 46" stroke="#2A180B" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="34" cy="43" r="2.5" fill="#FFFFFF" />
      <circle cx="36" cy="46" r="15.5" stroke="#114B3A" strokeWidth="3" fill="none" />
      <circle cx="64" cy="46" r="15.5" stroke="#114B3A" strokeWidth="3" fill="none" />
      <path d="M51.5 46 L48.5 46" stroke="#114B3A" strokeWidth="3" strokeLinecap="round" />
      <polygon points="50,53 45,61 55,61" fill="#E58B24" stroke="#B8650C" strokeWidth="1.5" />
      <g transform="translate(12, 70)">
        <circle cx="11" cy="11" r="10" fill="#FFFFFF" stroke="#114B3A" strokeWidth="2" />
        <circle cx="4" cy="3" r="2.5" fill="#E58B24" />
        <circle cx="18" cy="3" r="2.5" fill="#E58B24" />
        <path d="M11 6 L11 11 L14 11" stroke="#114B3A" strokeWidth="2" strokeLinecap="round" />
      </g>
      <path d="M38 106 Q40 114 42 106" stroke="#E58B24" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 106 Q60 114 62 106" stroke="#E58B24" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
