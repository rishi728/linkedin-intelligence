"use client";

import { useState } from "react";
import Link from "next/link";

export function PrivacyView() {
  const [walkthroughOpen, setWalkthroughOpen] = useState(true);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .privacy-root {
          --linen: #FAF8F5;
          --forest: #0F2D24;
          --forest-dark: #091F18;
          --forest-subtle: #E8F2EE;
          --warm-border: #E4DDD3;
          --warm-border-light: #EFE9DF;
          --gold-badge: #E59E3F;
          --sage-pill: #D8EFE5;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background-color: #FAF8F5;
          color: #1A1A18;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
          overflow-x: hidden;
        }
        .privacy-root * { box-sizing: border-box; }
        .privacy-root ::selection { background: #10B981; color: #fff; }
        .prv-serif { font-family: 'Instrument Serif', Georgia, serif; }
        .prv-hand { font-family: 'Caveat', cursive; }
        @keyframes floatOwl {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(0.9deg); }
        }
        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes popBubble {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes stepFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .prv-zen-owl { animation: floatOwl 4.5s ease-in-out infinite; transform-origin: center bottom; }
        .prv-pulse-shield { animation: gentlePulse 2.5s ease-in-out infinite; }
        .prv-step-anim { animation: stepFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .prv-card { transition: border-color 0.3s; }
        .prv-card:hover { border-color: rgba(16,185,129,0.4); }
      `}</style>

      <div className="privacy-root" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* ==================== HEADER ==================== */}
        <header style={{
          width: "100%", borderBottom: "1px solid var(--warm-border-light)",
          background: "rgba(250,248,245,0.9)", backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", height: 80, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                <svg height="100%" viewBox="0 0 100 100" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <rect fill="#0F2D24" height="100" rx="24" width="100" />
                  <rect fill="none" height="96" rx="22" stroke="#E6A85C" strokeOpacity="0.3" strokeWidth="1.5" width="96" x="2" y="2" />
                  <g transform="translate(14, 14) scale(0.72)">
                    <path d="M 50 10 C 26 10 14 26 14 55 C 14 78 30 92 50 92 C 70 92 86 78 86 55 C 86 26 74 10 50 10 Z" fill="#0F2D24" stroke="#F4F0E8" strokeLinejoin="round" strokeWidth="4.5" />
                    <path d="M 14 36 C 8 20 22 14 32 20" fill="none" stroke="#F4F0E8" strokeLinecap="round" strokeWidth="4.5" />
                    <path d="M 86 36 C 92 20 78 14 68 20" fill="none" stroke="#F4F0E8" strokeLinecap="round" strokeWidth="4.5" />
                    <path d="M 16 32 Q 35 22 50 35 Q 65 22 84 32" fill="none" stroke="#DDA861" strokeLinecap="round" strokeWidth="4" />
                    <circle cx="34" cy="46" fill="#F4F0E8" r="16" stroke="#F4F0E8" strokeWidth="2" />
                    <circle cx="34" cy="46" fill="#0F2D24" r="13" />
                    <circle cx="34" cy="46" fill="#F4F0E8" r="8" />
                    <circle cx="37" cy="43" fill="#0F2D24" r="3.5" />
                    <circle cx="33" cy="41" fill="#FFFFFF" r="1.5" />
                    <circle cx="66" cy="46" fill="#F4F0E8" r="16" stroke="#F4F0E8" strokeWidth="2" />
                    <circle cx="66" cy="46" fill="#0F2D24" r="13" />
                    <circle cx="66" cy="46" fill="#F4F0E8" r="8" />
                    <circle cx="63" cy="43" fill="#0F2D24" r="3.5" />
                    <circle cx="67" cy="41" fill="#FFFFFF" r="1.5" />
                    <path d="M 47 46 L 53 46" fill="none" stroke="#F4F0E8" strokeLinecap="round" strokeWidth="4.5" />
                    <polygon fill="#E59E3F" points="50,49 43,62 57,62" stroke="#0F2D24" strokeLinejoin="round" strokeWidth="1.5" />
                    <path d="M 32 64 C 40 76 60 76 68 64" fill="none" stroke="#DDA861" strokeLinecap="round" strokeWidth="3.5" />
                    <path d="M 38 74 C 44 82 56 82 62 74" fill="none" stroke="#F4F0E8" strokeLinecap="round" strokeWidth="3" />
                    <path d="M 50 63 L 50 88" fill="none" stroke="#F4F0E8" strokeLinecap="round" strokeWidth="2.5" />
                  </g>
                </svg>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#0F2D24" }}>
                LinkedIn <span className="prv-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 22, color: "#1A4336" }}>Intelligence</span>
              </span>
            </Link>

            <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Link href="/" style={{ padding: "6px 14px", borderRadius: 9999, fontSize: 14, fontWeight: 500, color: "#78716c", textDecoration: "none" }}>Home</Link>
              <Link href="/" style={{ padding: "6px 14px", borderRadius: 9999, fontSize: 14, fontWeight: 500, color: "#78716c", textDecoration: "none" }}>Demo</Link>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 16px", borderRadius: 9999,
                background: "#0F2D24", color: "#FAF8F5", fontSize: 14, fontWeight: 500,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", animation: "gentlePulse 2s ease-in-out infinite" }} />
                Privacy First
              </span>
            </nav>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <a
                href="https://www.linkedin.com/in/rishiagrawal2004" target="_blank" rel="noopener noreferrer"
                style={{
                  width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 8, border: "1px solid var(--warm-border)", color: "#44403c", textDecoration: "none",
                }}
              >
                <svg style={{ width: 16, height: 16, fill: "currentColor" }} viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.66 1.66 0 0 0-1.66 1.66c0 .92.74 1.66 1.66 1.66a1.66 1.66 0 0 0 1.66-1.66A1.66 1.66 0 0 0 7.83 6.2Z" />
                </svg>
              </a>
              <a
                href="mailto:agrawal123rishi@gmail.com"
                style={{
                  width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 8, border: "1px solid var(--warm-border)", color: "#44403c", textDecoration: "none",
                }}
              >
                <svg style={{ width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 2 }} viewBox="0 0 24 24">
                  <rect height="16" rx="2" width="20" x="2" y="4" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </a>
              <Link
                href="/"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#1A4336", color: "#fff", fontSize: 12, fontWeight: 600,
                  padding: "10px 16px", borderRadius: 9999, textDecoration: "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                Start Analyzing Free
                <svg style={{ width: 14, height: 14, fill: "none", stroke: "currentColor", strokeWidth: 2.5 }} viewBox="0 0 24 24"><path d="m8.25 4.5 7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </div>
        </header>

        <main style={{ flexGrow: 1 }}>
          {/* ==================== HERO ==================== */}
          <section style={{ maxWidth: 1152, margin: "0 auto", padding: "48px 24px 64px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 40, alignItems: "center" }}>
              {/* Left: headline */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px",
                  borderRadius: 9999, background: "var(--forest-subtle)", border: "1px solid #BCE1D1",
                  color: "#0F2D24", fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em",
                  alignSelf: "flex-start",
                }} />

                <h1 className="prv-serif" style={{
                  fontSize: "clamp(48px, 5vw, 72px)", fontWeight: 400,
                  letterSpacing: "-0.01em", color: "#0F2D24", lineHeight: 1.08,
                }}>
                  Privacy so simple,<br />
                  <span style={{ fontStyle: "italic", color: "#1A4336" }}>there's nothing</span> to hide.
                </h1>

                <p style={{ fontSize: "clamp(16px, 1.4vw, 20px)", color: "#57534e", fontWeight: 400, lineHeight: 1.6, maxWidth: 560 }}>
                  No remote cloud databases. No password requests. No automated web-bots scraping your account. All contact intelligence computes right inside your own browser window.
                </p>

                {/* Reassurance badges */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, paddingTop: 8 }}>
                  {["Zero data uploads", "Client-side only", "Works offline"].map((t) => (
                    <div key={t} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "#fff", padding: "8px 14px", borderRadius: 8,
                      border: "1px solid var(--warm-border)", fontSize: 12, fontWeight: 600, color: "#44403c",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Zen Owl SVG */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div className="prv-zen-owl" style={{ width: 320, height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ZenOwlSvg />
                </div>
              </div>
            </div>
          </section>

          {/* ==================== PRIVACY INFOGRAPHIC CARDS ==================== */}
          <section style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px 48px" }}>
            <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
              <h2 className="prv-serif" style={{ fontSize: "clamp(28px, 3.5vw, 40px)", color: "#0F2D24", fontWeight: 400 }}>
                How your privacy is protected
              </h2>
              <p style={{ color: "#78716c", fontSize: 14, marginTop: 8 }}>Zero technical jargon. Just pure, transparent local software.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
              {/* Card 1: Stays In Browser */}
              <article className="prv-card" style={{
                background: "#fff", borderRadius: 16, border: "1px solid var(--warm-border)",
                padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{
                    height: 128, borderRadius: 12, background: "#F6F4EE", border: "1px solid var(--warm-border-light)",
                    display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                    overflow: "hidden", marginBottom: 20,
                  }}>
                    <div style={{ width: 96, height: 64, borderRadius: 6, background: "#292524", border: "2px solid #44403c", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <div style={{ width: 64, height: 36, borderRadius: 4, background: "#0F2D24", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div className="prv-pulse-shield" style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }} />
                        </div>
                      </div>
                      <div style={{ position: "absolute", bottom: -6, width: 112, height: 4, background: "#a8a29e", borderRadius: 9999 }} />
                    </div>
                    <span style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 9999 }}>Local Only</span>
                  </div>
                  <h3 style={{ fontWeight: 700, color: "#1c1917", fontSize: 16, marginBottom: 6 }}>Stays In Your Browser</h3>
                  <p style={{ color: "#78716c", fontSize: 13, lineHeight: 1.6 }}>
                    Your contacts are read and organized inside your personal browser memory. Never uploaded.
                  </p>
                </div>
                <div style={{ paddingTop: 16, marginTop: 16, borderTop: "1px solid #f5f5f4", fontSize: 12, fontWeight: 600, color: "#065f46" }}>Client-side computing</div>
              </article>

              {/* Card 2: Zero Cloud Servers */}
              <article className="prv-card" style={{
                background: "#fff", borderRadius: 16, border: "1px solid var(--warm-border)",
                padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{
                    height: 128, borderRadius: 12, background: "#F6F4EE", border: "1px solid var(--warm-border-light)",
                    display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                    overflow: "hidden", marginBottom: 20,
                  }}>
                    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg style={{ width: 64, height: 64, color: "#a8a29e" }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div style={{ position: "absolute", width: 80, height: 2, background: "#ef4444", transform: "rotate(45deg)", borderRadius: 9999 }} />
                    </div>
                    <span style={{ position: "absolute", bottom: 8, padding: "2px 10px", borderRadius: 6, background: "#1c1917", color: "#fbbf24", fontSize: 11, fontFamily: "monospace", fontWeight: 700, letterSpacing: "-0.02em" }}>0 Bytes Sent</span>
                  </div>
                  <h3 style={{ fontWeight: 700, color: "#1c1917", fontSize: 16, marginBottom: 6 }}>Zero Cloud Servers</h3>
                  <p style={{ color: "#78716c", fontSize: 13, lineHeight: 1.6 }}>
                    We have no database servers to store or view your contacts, even if we wanted to.
                  </p>
                </div>
                <div style={{ paddingTop: 16, marginTop: 16, borderTop: "1px solid #f5f5f4", fontSize: 12, fontWeight: 600, color: "#065f46" }}>No remote storage</div>
              </article>

              {/* Card 3: No Passwords Needed */}
              <article className="prv-card" style={{
                background: "#fff", borderRadius: 16, border: "1px solid var(--warm-border)",
                padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{
                    height: 128, borderRadius: 12, background: "#F6F4EE", border: "1px solid var(--warm-border-light)",
                    display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                    overflow: "hidden", marginBottom: 20,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 56, height: 64, background: "#fff", borderRadius: 8, border: "2px solid #d6d3d1", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 8, position: "relative" }}>
                        <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: "#57534e" }}>.ZIP</span>
                        <div style={{ width: 24, height: 4, background: "#e7e5e4", marginTop: 4, borderRadius: 9999 }} />
                        <div style={{ width: 16, height: 4, background: "#e7e5e4", marginTop: 4, borderRadius: 9999 }} />
                        <div style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, background: "#10B981", borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                          <svg style={{ width: 12, height: 12, fill: "none", stroke: "currentColor", strokeWidth: 3 }} viewBox="0 0 24 24"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      </div>
                    </div>
                    <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10, fontWeight: 700, color: "#78716c", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Direct Import</span>
                  </div>
                  <h3 style={{ fontWeight: 700, color: "#1c1917", fontSize: 16, marginBottom: 6 }}>No Passwords Needed</h3>
                  <p style={{ color: "#78716c", fontSize: 13, lineHeight: 1.6 }}>
                    Never share credentials. Simply load your official exported LinkedIn archive.
                  </p>
                </div>
                <div style={{ paddingTop: 16, marginTop: 16, borderTop: "1px solid #f5f5f4", fontSize: 12, fontWeight: 600, color: "#065f46" }}>Zero account risk</div>
              </article>

              {/* Card 4: One-Click Erase */}
              <article className="prv-card" style={{
                background: "#fff", borderRadius: 16, border: "1px solid var(--warm-border)",
                padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{
                    height: 128, borderRadius: 12, background: "#F6F4EE", border: "1px solid var(--warm-border-light)",
                    display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                    overflow: "hidden", marginBottom: 20,
                  }}>
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
                  <h3 style={{ fontWeight: 700, color: "#1c1917", fontSize: 16, marginBottom: 6 }}>One-Click Erase Anytime</h3>
                  <p style={{ color: "#78716c", fontSize: 13, lineHeight: 1.6 }}>
                    Close your tab or hit reset. Every cached record vanishes permanently without a trace.
                  </p>
                </div>
                <div style={{ paddingTop: 16, marginTop: 16, borderTop: "1px solid #f5f5f4", fontSize: 12, fontWeight: 600, color: "#065f46" }}>You hold full control</div>
              </article>
            </div>
          </section>

          {/* ==================== DATA EXPORT WALKTHROUGH ==================== */}
          <section style={{ maxWidth: 1152, margin: "0 auto", padding: "16px 24px 64px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "4fr 8fr", gap: 20, alignItems: "flex-start" }}>
              {/* Left toggle tile */}
              <button
                onClick={() => setWalkthroughOpen(!walkthroughOpen)}
                style={{
                  width: "100%", textAlign: "left", cursor: "pointer",
                  background: walkthroughOpen ? "#FDFCF9" : "#fff",
                  borderRadius: 16, padding: "16px 20px",
                  border: walkthroughOpen ? "1px solid #059669" : "1px solid var(--warm-border)",
                  boxShadow: walkthroughOpen ? "0 0 0 2px rgba(16,185,129,0.2)" : "0 1px 2px rgba(0,0,0,0.04)",
                  transition: "all 0.2s", fontFamily: "inherit",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, background: "var(--forest-subtle)",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#0F2D24",
                      flexShrink: 0, position: "relative",
                    }}>
                      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {walkthroughOpen && (
                        <span style={{ position: "absolute", top: -4, right: -4, width: 10, height: 10, background: "#10B981", borderRadius: "50%", border: "2px solid #fff" }} />
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1c1917" }}>Steps to get your LinkedIn data</h4>
                      <p style={{ fontSize: 12, color: walkthroughOpen ? "#047857" : "#78716c", marginTop: 2, fontWeight: walkthroughOpen ? 500 : 400 }}>
                        {walkthroughOpen ? "Showing 4 actionable steps" : "Click to view 4 quick actionable steps"}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    border: walkthroughOpen ? "1px solid #059669" : "1px solid var(--warm-border)",
                    background: walkthroughOpen ? "#ecfdf5" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: walkthroughOpen ? "#047857" : "#a8a29e", flexShrink: 0,
                  }}>
                    <svg style={{ width: 14, height: 14, transition: "transform 0.3s", transform: walkthroughOpen ? "rotate(90deg)" : "none" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="m8.25 4.5 7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Right walkthrough panel */}
              {walkthroughOpen && (
                <div style={{
                  background: "#fff", borderRadius: 16, border: "1px solid var(--warm-border)",
                  padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", position: "relative", overflow: "hidden",
                }}>
                  {/* Header */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid var(--warm-border-light)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "#d1fae5", color: "#065f46", fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>4</span>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F2D24" }}>Official LinkedIn Data Export Guide</h3>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "var(--forest-subtle)", color: "#0F2D24", fontWeight: 500 }}>~1 min</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <a
                        href="https://www.linkedin.com/mypreferences/d/download-my-data"
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: "#047857", fontWeight: 500, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        Open LinkedIn Settings
                        <svg style={{ width: 12, height: 12, fill: "none", stroke: "currentColor", strokeWidth: 2 }} viewBox="0 0 24 24"><path d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </a>
                      <button
                        onClick={() => setWalkthroughOpen(false)}
                        style={{ color: "#a8a29e", cursor: "pointer", padding: 4, borderRadius: 6, border: "none", background: "none", fontFamily: "inherit" }}
                      >
                        <svg style={{ width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 2 }} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* 4 Step Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {[
                      { n: 1, title: "'Me' icon → Settings & Privacy", desc: "Click your profile avatar at the top right of LinkedIn, then select Settings & Privacy." },
                      { n: 2, title: "Data Privacy → Get a copy of your data", desc: "In the left sidebar, select Data Privacy and look under How LinkedIn uses your data." },
                      { n: 3, title: "Select 'Connections' & Request", desc: 'Pick "Want something in particular?", tick Connections, and press Request archive.' },
                      { n: 4, title: "Download email & unzip CSV", desc: "LinkedIn emails you in ~10 mins. Download the zip and drag your Connections.csv right here.", last: true },
                    ].map((s, i) => (
                      <div key={s.n} className="prv-step-anim" style={{
                        borderRadius: 12, background: "#FAF8F5",
                        border: "1px solid rgba(228,221,211,0.8)", padding: 14,
                        display: "flex", gap: 12, transition: "border-color 0.2s",
                        animationDelay: `${50 + i * 60}ms`,
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%",
                          background: s.last ? "#059669" : "#0F2D24",
                          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, fontFamily: "monospace", flexShrink: 0, marginTop: 2,
                        }}>{s.n}</div>
                        <div>
                          <h4 style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", lineHeight: 1.4 }}>{s.title}</h4>
                          <p style={{ fontSize: 11, color: "#57534e", marginTop: 4, lineHeight: 1.5 }}>{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom reassurance */}
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--warm-border-light)", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#065f46", fontWeight: 500 }}>
                    <svg style={{ width: 14, height: 14, color: "#059669", fill: "none", stroke: "currentColor", strokeWidth: 2.5 }} viewBox="0 0 24 24"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Official LinkedIn feature. No bots or scrapers involved.
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* ==================== FOOTER ==================== */}
        <footer style={{ marginTop: "auto", borderTop: "1px solid var(--warm-border-light)", background: "#FAF8F5", padding: "32px 0" }}>
          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, fontSize: 12, color: "#78716c" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
              <a href="https://www.linkedin.com/in/rishiagrawal2004" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "none", fontWeight: 500 }}>
                <svg style={{ width: 14, height: 14, fill: "currentColor" }} viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.66 1.66 0 0 0-1.66 1.66c0 .92.74 1.66 1.66 1.66a1.66 1.66 0 0 0 1.66-1.66A1.66 1.66 0 0 0 7.83 6.2Z" />
                </svg>
                linkedin.com/in/rishiagrawal2004
              </a>
              <a href="mailto:agrawal123rishi@gmail.com" style={{ display: "flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "none", fontWeight: 500 }}>
                <svg style={{ width: 14, height: 14, fill: "none", stroke: "currentColor", strokeWidth: 2 }} viewBox="0 0 24 24">
                  <rect height="16" rx="2" width="20" x="2" y="4" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                agrawal123rishi@gmail.com
              </a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg style={{ width: 16, height: 16, color: "#a8a29e", transform: "rotate(12deg)", fill: "none", stroke: "currentColor", strokeWidth: 2 }} viewBox="0 0 24 24">
                <path d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="prv-hand" style={{ fontSize: 16, color: "#57534e" }}>Always open to feedback!</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function ZenOwlSvg() {
  return (
    <svg height="100%" viewBox="0 0 320 340" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter height="120%" id="soft-shadow-vault" width="120%" x="-10%" y="-10%">
          <feDropShadow dx="0" dy="6" floodColor="#0f2d24" floodOpacity="0.12" stdDeviation="8" />
        </filter>
      </defs>
      <g filter="url(#soft-shadow-vault)" id="privacy-zen-owl">
        {/* Perch branch */}
        <path d="M 50 270 Q 160 260 270 250" fill="none" stroke="#2D2823" strokeLinecap="round" strokeWidth="3.5" />
        <path d="M 70 273 L 130 267" fill="none" opacity="0.5" stroke="#2D2823" strokeLinecap="round" strokeWidth="2" />
        <path d="M 180 260 L 245 253" fill="none" opacity="0.5" stroke="#2D2823" strokeLinecap="round" strokeWidth="2" />
        {/* Tail feathers */}
        <path d="M 105 255 C 100 280 102 300 115 315 C 122 312 125 300 128 285 C 132 305 138 312 144 310 C 148 295 147 280 144 260 Z" fill="#D3A26B" stroke="#2D2823" strokeLinejoin="round" strokeWidth="3" />
        {/* Left Wing: Hugging padlock */}
        <g>
          <rect fill="#0F2D24" height="38" rx="6" stroke="#2D2823" strokeWidth="2.5" width="34" x="62" y="180" />
          <path d="M 70 180 L 70 168 C 70 159 88 159 88 168 L 88 180" fill="none" stroke="#DDA861" strokeLinecap="round" strokeWidth="3.5" />
          <circle cx="79" cy="195" fill="#E59E3F" r="4" />
          <polygon fill="#E59E3F" points="77,196 81,196 82,206 76,206" />
          <path d="M 95 178 C 82 188 68 215 74 240 C 80 248 88 245 94 235 C 98 245 104 245 108 234 C 112 222 112 205 110 185 Z" fill="#DFB27D" stroke="#2D2823" strokeLinejoin="round" strokeWidth="3" />
        </g>
        {/* Right Wing: thumbs up with shield badge */}
        <g>
          <path d="M 195 175 C 220 165 245 150 252 130 C 242 138 232 150 225 158 C 242 140 256 128 260 115 C 262 108 255 106 248 116 C 242 125 235 138 226 150 C 238 130 248 120 248 108 C 248 102 242 100 236 108 C 225 125 212 155 198 185 Z" fill="#DFB27D" stroke="#2D2823" strokeLinejoin="round" strokeWidth="3" />
          <circle cx="218" cy="162" fill="#10B981" r="11" stroke="#0F2D24" strokeWidth="2" />
          <path d="M 214 162 L 217 165 L 223 158" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        </g>
        {/* Main Body */}
        <path d="M 90 170 C 80 210 95 265 140 268 C 185 270 210 220 205 170 C 200 140 190 135 150 135 C 105 135 95 145 90 170 Z" fill="#E8C396" stroke="#2D2823" strokeLinejoin="round" strokeWidth="3.5" />
        {/* Belly */}
        <path d="M 112 165 C 105 195 115 252 145 255 C 175 255 188 205 182 165 C 178 152 165 148 147 148 C 128 148 116 152 112 165 Z" fill="#FFF8EE" stroke="#2D2823" strokeWidth="2.5" />
        {/* Chest feather scallops */}
        <path d="M 130 185 Q 137 191 144 185 Q 151 191 158 185" fill="none" stroke="#D3A26B" strokeLinecap="round" strokeWidth="2.5" />
        <path d="M 125 202 Q 132 208 139 202 Q 146 208 153 202 Q 160 208 167 202" fill="none" stroke="#D3A26B" strokeLinecap="round" strokeWidth="2.5" />
        <path d="M 132 220 Q 139 226 146 220 Q 153 226 160 220" fill="none" stroke="#D3A26B" strokeLinecap="round" strokeWidth="2.5" />
        {/* Feet */}
        <g fill="#F29339" stroke="#2D2823" strokeLinejoin="round" strokeWidth="2.5">
          <ellipse cx="126" cy="265" rx="5.5" ry="8" transform="rotate(-15 126 265)" />
          <ellipse cx="135" cy="266" rx="5.5" ry="8.5" />
          <ellipse cx="144" cy="265" rx="5.5" ry="8" transform="rotate(15 144 265)" />
          <ellipse cx="170" cy="258" rx="5.5" ry="8" transform="rotate(-15 170 258)" />
          <ellipse cx="179" cy="259" rx="5.5" ry="8.5" />
          <ellipse cx="188" cy="258" rx="5.5" ry="8" transform="rotate(15 188 258)" />
        </g>
        {/* Head */}
        <g>
          <path d="M 82 85 C 72 65 80 40 96 35 C 105 45 108 55 110 65 C 122 55 140 50 160 52 C 175 52 188 58 196 68 C 200 55 208 42 220 38 C 228 50 226 70 216 90 C 230 115 228 145 210 165 C 185 185 115 185 88 160 C 75 138 74 108 82 85 Z" fill="#E8C396" stroke="#2D2823" strokeLinejoin="round" strokeWidth="3.5" />
          {/* Crest feathers */}
          <path d="M 148 48 C 145 35 152 28 156 22 C 158 30 157 38 155 45" fill="#DFB27D" stroke="#2D2823" strokeLinejoin="round" strokeWidth="2.5" />
          <path d="M 138 50 C 132 40 135 32 140 26 C 143 35 143 42 142 49" fill="#DFB27D" stroke="#2D2823" strokeLinejoin="round" strokeWidth="2.5" />
          {/* Glasses */}
          <circle cx="118" cy="112" fill="#FFFFFF" r="33" stroke="#231F1C" strokeWidth="6" />
          <circle cx="178" cy="110" fill="#FFFFFF" r="33" stroke="#231F1C" strokeWidth="6" />
          <path d="M 148 110 L 151 110" stroke="#231F1C" strokeLinecap="round" strokeWidth="7" />
          <path d="M 85 114 L 75 118" stroke="#231F1C" strokeLinecap="round" strokeWidth="5" />
          <path d="M 210 110 L 222 112" stroke="#231F1C" strokeLinecap="round" strokeWidth="5" />
          {/* Peaceful eyes ^_^ */}
          <path d="M 104 114 Q 118 96 132 114" fill="none" stroke="#1A1817" strokeLinecap="round" strokeWidth="5.5" />
          <path d="M 164 112 Q 178 94 192 112" fill="none" stroke="#1A1817" strokeLinecap="round" strokeWidth="5.5" />
          <path d="M 130 108 L 136 104" stroke="#1A1817" strokeLinecap="round" strokeWidth="3" />
          <path d="M 190 106 L 196 102" stroke="#1A1817" strokeLinecap="round" strokeWidth="3" />
          {/* Rosy cheeks */}
          <ellipse cx="96" cy="136" fill="#F4B5A4" opacity="0.7" rx="9" ry="6" />
          <ellipse cx="200" cy="134" fill="#F4B5A4" opacity="0.7" rx="9" ry="6" />
          {/* Beak */}
          <polygon fill="#F29339" points="149,110 140,125 158,125" stroke="#2D2823" strokeLinejoin="round" strokeWidth="2.5" />
          <path d="M 142 125 Q 149 135 156 125 Z" fill="#D9534F" stroke="#2D2823" strokeWidth="1.5" />
        </g>
      </g>
    </svg>
  );
}
