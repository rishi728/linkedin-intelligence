"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CsvFormatError } from "@/lib/analyzer";
import { isZip, readZipCsvs, splitExport, ZipError } from "@/lib/zip";
import { useWorkspace } from "@/components/workspace/store";

/* ------------------------------------------------------------------ */
/*  Landing page — pixel-faithful port of the Stitch "Refined Owl"    */
/*  design.  Fonts loaded via <link>, all custom colours via inline   */
/*  style vars so the workspace's Tailwind theme is untouched.        */
/* ------------------------------------------------------------------ */

export function WelcomeView() {
  const { ready, dataset, people, settings, updateSettings, importCsv, importArchive, loadSample } = useWorkspace();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"summary" | "edit">("summary");

  useEffect(() => {
    if (ready && dataset && !showModal) router.replace("/home");
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
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#64748b" }}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400;1,6..72,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Caveat:wght@600&display=swap"
        rel="stylesheet"
      />

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
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
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
        .font-serif { font-family: 'Newsreader', Georgia, serif; }
        .font-hand { font-family: 'Caveat', cursive; }
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
      `}</style>

      <div className="landing-root" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* ==================== HEADER ==================== */}
        <header style={{
          width: "100%", borderBottom: "1px solid rgba(214,211,199,0.5)",
          background: "rgba(250,250,245,0.8)", backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px", height: 80, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <a href="#" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, overflow: "hidden",
                border: "1px solid rgba(17,75,58,0.25)", background: "#0F2D24",
                display: "flex", alignItems: "center", justifyContent: "center", padding: 2, flexShrink: 0,
              }}>
                <img
                  alt="LinkedIn Intelligence Logo"
                  src="https://lh3.googleusercontent.com/aida/AEtjO1Vdy72nGrnjvXhgOjXXvQfyDWhG-2vr4ynAeRy7vPxp-0uUv4DAtVHP1qBSgSGkXOsYuTdr-79oUF2cDh5v6gpYU9HR6tbOOTIKY_53M3YeTGvBFyjRWbzj35LrnkElvS39rh1M7-JAzjWJFsROQR76EokpWy5kT0lUIRxJTPtwhk4DpVbxbEwTQAcuL-EMQGfx4AMlujhF1FHB6hkK2m9vS-VFCS0gYzhp1uAgeiE2A6z4j9XwewZ2pw"
                  style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 12 }}
                />
              </div>
              <span className="font-serif" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "#0C2D22" }}>
                LinkedIn <span style={{ fontStyle: "italic", fontWeight: 400, color: "#114B3A" }}>Intelligence</span>
              </span>
            </a>

            {/* Nav */}
            <nav style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 14, fontWeight: 500, color: "#64748b" }}>
              <a href="#how-it-works" style={{ color: "inherit", textDecoration: "none" }}>How it works</a>
              <a href="#network-preview" style={{ color: "inherit", textDecoration: "none" }}>Demo</a>
              <a href="/privacy" style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                <span className="anim-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                Privacy First
              </a>
            </nav>

            {/* Social */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, borderLeft: "1px solid #E8E6DF", paddingLeft: 16 }}>
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
          {/* ==================== HERO ==================== */}
          <section className="hero-glow" style={{ position: "relative", paddingTop: 40, paddingBottom: 80, overflow: "hidden" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 48, alignItems: "center", marginBottom: 64 }}>
                {/* Left: headline */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <h1 className="font-serif" style={{
                    fontSize: "clamp(48px, 5vw, 72px)", fontWeight: 700,
                    letterSpacing: "-0.02em", color: "#0C2D22", lineHeight: 1.08,
                  }}>
                    LinkedIn <br />
                    <span style={{
                      fontStyle: "italic", fontWeight: 400, color: "#114B3A",
                      textDecoration: "underline", textDecorationColor: "rgba(17,75,58,0.3)",
                      textDecorationStyle: "wavy" as const, textUnderlineOffset: 8,
                    }}>Intelligence</span>
                  </h1>
                  <p style={{ fontSize: "clamp(18px, 1.6vw, 24px)", color: "#64748b", fontWeight: 300, maxWidth: 560, lineHeight: 1.6 }}>
                    Turn your LinkedIn connections into meaningful career and business opportunities.
                  </p>

                  {/* CTAs */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, paddingTop: 16 }}>
                    <button
                      className="cta-main"
                      onClick={() => inputRef.current?.click()}
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
                      <span style={{ padding: "8px 16px", fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>100% Client-side</span>
                    </div>
                  </div>
                </div>

                {/* Right: Owl + Product Preview */}
                <div id="network-preview" style={{ position: "relative" }}>
                  {/* Mascot */}
                  <div style={{ position: "absolute", top: -96, left: -80, zIndex: 30, display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none", userSelect: "none" }}>
                    {/* Chat bubble */}
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
                    {/* Owl image */}
                    <div className="anim-owl" style={{ position: "relative", width: 176, height: 176 }}>
                      <img
                        alt="Owl Mascot"
                        src="https://lh3.googleusercontent.com/aida/AEtjO1URxPcV_yYvguNzmlzde-xuqYcbuzuZwXmZ8Y7dOh2c1NEwFWZqgiBFv28JnG6Cz7iaPy0BVK4oXJnf6oMWKdwLIyAe45cioBMgvF-Qw4g5mQdQw5hwPHxFn9uLbc-wiK63_hitZKAY7AjzYfU8qcXdUBbzH8LaU7gqEkTmmuKv5M6LsKhWalh3qwplYuMWtZYr1CTdQFq4U40H_MPxjlRxv82HFfSxBJmRaGWgB2Enf2sMALttQ47pXw"
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
                        <svg style={{ width: 14, height: 14, color: "#94a3b8", position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        <div style={{
                          width: "100%", paddingLeft: 36, paddingRight: 12, padding: "4px 12px 4px 36px",
                          fontSize: 12, background: "#fff", borderRadius: 6, border: "1px solid #e2e8f0",
                          color: "#94a3b8",
                        }}>Search people, companies...</div>
                      </div>
                    </div>

                    {/* Window content */}
                    <div style={{ display: "grid", gridTemplateColumns: "4fr 8fr", minHeight: 360 }}>
                      {/* Sidebar */}
                      <div style={{ borderRight: "1px solid #E8E6DF", padding: 12, display: "flex", flexDirection: "column", gap: 4, background: "rgba(244,243,238,0.4)" }}>
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
                            <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>1,248 people analysed</p>
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
                                  <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.sub}</div>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", paddingLeft: 8 }}>
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
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
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

          {/* ==================== WORKFLOW & PRIVACY BANNERS ==================== */}
          <section id="how-it-works" style={{ padding: "64px 0" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                {/* Data export banner */}
                <div
                  onClick={() => inputRef.current?.click()}
                  style={{
                    background: "#fff", borderRadius: 16, padding: 28,
                    border: "1px solid #E8E6DF", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
                  }}
                  className="shadow-soft info-banner"
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 16, background: "#ecfdf5", border: "1px solid #d1fae5",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#114B3A", flexShrink: 0,
                    }}>
                      <svg style={{ width: 24, height: 24, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="info-title" style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Steps to get your LinkedIn data</h3>
                      <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>A simple 2-minute guide to download your official data archive and import here.</p>
                    </div>
                  </div>
                  <div className="info-arrow" style={{
                    width: 40, height: 40, borderRadius: "50%", background: "#f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0,
                  }}>
                    <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                  </div>
                </div>

                {/* Privacy banner */}
                <div id="privacy" style={{
                  background: "#fff", borderRadius: 16, padding: 28,
                  border: "1px solid #E8E6DF", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
                }} className="shadow-soft info-banner">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 16, background: "#eff6ff", border: "1px solid #dbeafe",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#1d4ed8", flexShrink: 0,
                    }}>
                      <svg style={{ width: 24, height: 24, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="info-title" style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Privacy &amp; How it works</h3>
                      <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Runs 100% locally in your browser. No server uploads. No shared database.</p>
                    </div>
                  </div>
                  <div className="info-arrow" style={{
                    width: 40, height: 40, borderRadius: "50%", background: "#f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0,
                  }}>
                    <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                  </div>
                </div>
              </div>

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
                      <p style={{ marginTop: 12, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Drop your LinkedIn export here</p>
                      <p style={{ marginTop: 4, fontSize: 13, color: "#94a3b8" }}>the whole .zip, or just Connections.csv</p>
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
                  <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
                    <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Stays in this browser
                  </p>
                  <button
                    onClick={() => { loadSample(); router.push("/home"); }}
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
        </main>

        {/* ==================== FOOTER ==================== */}
        <footer style={{ marginTop: "auto", borderTop: "1px solid #E8E6DF", background: "#FAF8F5", padding: "48px 0" }}>
          <div style={{
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
  updateSettings: (fn: (s: any) => any) => void;
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
    updateSettings((s: any) => ({
      ...s,
      profile: { ...s.profile, name: editName, background: editBg, schools: editSchools },
    }));
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
          <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>Read from your own export. Only what was actually in the files.</p>
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
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 4, fontFamily: "monospace" }}>Currently</div>
                <p style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.5 }}>{settings.profile.background}</p>
              </div>
            )}
            {settings.profile.schools.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 4, fontFamily: "monospace" }}>Studied At</div>
                <p style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.5 }}>{settings.profile.schools.join(" · ")}</p>
              </div>
            )}
            {topCategories.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 6, fontFamily: "monospace" }}>Your Network is Concentrated In</div>
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
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Connections from these count as alumni.</span>
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
                      style={{ color: "#94a3b8", cursor: "pointer", border: "none", background: "none", padding: 0, fontFamily: "inherit", fontSize: 14 }}
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
                onClick={() => {
                  if (modalTab === "edit") saveEdits();
                  onConfirm();
                }}
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
            <button
              onClick={onConfirm}
              style={{
                fontSize: 12, fontWeight: 500, color: "#065f46",
                textDecoration: "underline", textUnderlineOffset: 4,
                border: "none", background: "none", cursor: "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4,
              }}
            >
              Skip setup & go straight to analysis &rarr;
            </button>
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
        fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const,
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
