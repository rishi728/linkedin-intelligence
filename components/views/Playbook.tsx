"use client";

import { useState, type ReactNode } from "react";

const INK = "#0C2D22";
const LINE = "#E8E6DF";

const Chip = ({ children, on }: { children: ReactNode; on?: boolean }) => (
  <span style={{
    padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
    background: on ? "#ecfdf5" : "#fff", border: on ? "1.5px solid #059669" : `1px solid ${LINE}`,
    color: on ? "#065f46" : "#64748b",
  }}>{children}</span>
);

const Key = ({ k, label }: { k: string; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#334155" }}>
    <kbd style={{ minWidth: 26, textAlign: "center", padding: "3px 7px", borderRadius: 6, background: "#fff", border: `1px solid ${LINE}`, borderBottomWidth: 2, fontWeight: 700, fontFamily: "inherit", color: INK }}>{k}</kbd>
    {label}
  </div>
);

const Card = ({ children }: { children: ReactNode }) => (
  <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>{children}</div>
);

const Placeholder = ({ w }: { w: string }) => <div style={{ height: 8, width: w, borderRadius: 4, background: "#eef0ee" }} />;

const STATUS_FLOW = ["To contact", "Contacted", "Awaiting response", "Follow-up", "Replied", "Call scheduled"];
const WEIGHTS = [
  ["Works in a role you want", "+35"], ["Works at a target company", "+25"], ["Has replied to you before", "+12"], ["Has an email on file", "+4"],
];

const MOCKS: Record<string, () => ReactNode> = {
  data: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ border: "2px dashed #a7f3d0", borderRadius: 12, padding: "22px 12px", textAlign: "center", background: "#f6fdf9" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>Drop the whole .zip here</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Connections and message history</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Chip on>Read in your browser</Chip><Chip on>Never uploaded</Chip><Chip>Data health report</Chip>
      </div>
    </div>
  ),
  goals: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 8 }}>I want to meet</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Chip on>Your target roles</Chip><Chip on>Your target fields</Chip><Chip>Something else</Chip></div>
      </Card>
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 8 }}>I am after</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Chip on>Internship</Chip><Chip on>Referral</Chip><Chip>Advice</Chip></div>
      </Card>
    </div>
  ),
  find: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ padding: "9px 12px", borderRadius: 10, border: `1px solid ${LINE}`, background: "#fff", fontSize: 12, color: "#64748b" }}>
        Try typing: <strong style={{ color: INK }}>product managers at fintech</strong>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["Who", "Category", "Where", "Relationship", "Outreach", "More"].map((c) => <Chip key={c}>{c}</Chip>)}
      </div>
      <Chip on>Save segment</Chip>
    </div>
  ),
  templates: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card>
        <p style={{ fontSize: 12, lineHeight: 1.7, color: "#334155", margin: 0 }}>
          Hi <b style={{ color: "#047857" }}>{"{{first_name}}"}</b>, I came across your work at <b style={{ color: "#047857" }}>{"{{company}}"}</b>.
          {" "}<b style={{ color: "#047857" }}>{"{{reason}}"}</b> Would you be open to <b style={{ color: "#047857" }}>{"{{ask}}"}</b>?
        </p>
      </Card>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["Referral request", "Quick advice", "Mentorship", "Introduction", "Internship enquiry", "Job opportunity", "Catch up / networking"].map((t) => <Chip key={t}>{t}</Chip>)}
      </div>
    </div>
  ),
  session: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <Card><div style={{ display: "flex", flexDirection: "column", gap: 7 }}><Placeholder w="55%" /><Placeholder w="80%" /><Placeholder w="40%" /></div></Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
        <Key k="C" label="Copy the message" /><Key k="O" label="Open their LinkedIn" /><Key k="S" label="Mark as sent" />
        <Key k="K" label="Skip" /><Key k="N" label="Not a fit" />
      </div>
    </div>
  ),
  pipeline: () => (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
      {STATUS_FLOW.map((s, i) => (
        <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Chip on={i === 1}>{s}</Chip>{i < STATUS_FLOW.length - 1 && <span style={{ color: "#64748b", fontSize: 12 }}>&rarr;</span>}
        </span>
      ))}
    </div>
  ),
  priority: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", height: 26, borderRadius: 8, overflow: "hidden", fontSize: 10, fontWeight: 700, color: "#fff" }}>
        <div style={{ flex: 30, background: "#94a3b8", display: "grid", placeItems: "center" }}>Low 0-29</div>
        <div style={{ flex: 25, background: "#d97706", display: "grid", placeItems: "center" }}>Medium 30-54</div>
        <div style={{ flex: 45, background: "#059669", display: "grid", placeItems: "center" }}>High 55+</div>
      </div>
      <Card>
        {WEIGHTS.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#334155", padding: "3px 0" }}>
            <span>{k}</span><b style={{ color: "#047857" }}>{v}</b>
          </div>
        ))}
      </Card>
    </div>
  ),
  backup: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card>
        <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>Saved on this device only. Pick a backup file once and NesT keeps it current in the background.</div>
      </Card>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Chip on>Backup file</Chip><Chip>Daily snapshots</Chip><Chip>Restore anytime</Chip></div>
    </div>
  ),
};

interface Chapter {
  name: string; short: string; where: string; hook: string; steps: string[]; tip: string;
  mock: keyof typeof MOCKS; go: { label: string; path: string };
}

const CHAPTERS: Chapter[] = [
  {
    name: "Gather the twigs", short: "Data", where: "Home drop zone, then Data health",
    hook: "Your network already exists. NesT only needs to see it once.",
    steps: [
      "On LinkedIn, request your data archive and choose Larger data only.",
      "Drop the whole .zip in. Your connections arrive, and your message history comes with them.",
      "Open Data health to see what is missing, such as emails or job titles.",
    ],
    tip: "Nothing is uploaded. The file is read inside your browser and stays on this device.",
    mock: "data", go: { label: "Open Data health", path: "/health" },
  },
  {
    name: "Tell Owlie what you want", short: "Goals", where: "Settings, then Goals and Targets",
    hook: "Everything is ranked against what you are after, so say it once.",
    steps: [
      "In Goals, pick the roles and fields you want to meet and what you are after, such as an internship or a referral.",
      "In Targets, add the companies you care about.",
      "Add your school to your profile so alumni rise to the top.",
    ],
    tip: "Until goals are set nobody scores points. This is the step that makes the list smart.",
    mock: "goals", go: { label: "Open Settings", path: "/settings" },
  },
  {
    name: "Find the right door", short: "Find", where: "Find people and People",
    hook: "Skip the scrolling. Describe who you need and let the filters do the rest.",
    steps: [
      "Use Find people for a guided search, or type what you need in plain words in the People search bar.",
      "Narrow with Who, Category, Where, Relationship, Outreach and More.",
      "Like a combination? Save it as a segment and it appears in your sidebar.",
    ],
    tip: "Counts beside each option follow your other filters, so you see what you would get before you click.",
    mock: "find", go: { label: "Open Find people", path: "/find" },
  },
  {
    name: "Write once, reuse often", short: "Templates", where: "People, then Write message",
    hook: "Ready-made messages for every moment, so you never start from a blank box.",
    steps: [
      "Open any person and choose Write message, then pick why you are reaching out.",
      "The wording appears exactly as written. Replace each {{placeholder}} with your own details.",
      "Edit the wording until it sounds like you, then copy it. You send it yourself.",
    ],
    tip: "Every message is a draft for you to read. Nothing is ever sent for you.",
    mock: "templates", go: { label: "Open People", path: "/people" },
  },
  {
    name: "Send it yourself, fast", short: "Outreach", where: "Outreach session",
    hook: "Work a shortlist like a deck of cards, one person at a time.",
    steps: [
      "Start a session and step through your shortlist.",
      "Press C to copy the message, O to open their LinkedIn, S to mark it sent.",
      "K skips, N marks not a fit, and the arrow keys move between people.",
    ],
    tip: "You paste and press send on LinkedIn yourself. NesT never touches your account.",
    mock: "session", go: { label: "Open Outreach", path: "/outreach" },
  },
  {
    name: "Keep the thread alive", short: "Pipeline", where: "Outreach board and Home",
    hook: "A message with no follow-up is a wasted message.",
    steps: [
      "Marking someone sent moves them to Contacted and schedules their next reminder.",
      "People move through stages such as Awaiting response, Follow-up, Replied and Call scheduled.",
      "Home tells you who is waiting on you today.",
    ],
    tip: "Change a stage from any list by clicking the status pill. Undo is one click away.",
    mock: "pipeline", go: { label: "Open Outreach", path: "/outreach" },
  },
  {
    name: "Tune what floats to the top", short: "Priority", where: "Settings, then Outreach",
    hook: "Priority is just a score out of 100, and you control the maths.",
    steps: [
      "Reminders start at 5, 9 and 14 days after you contact someone. Change the gaps or add more.",
      "Drag a signal right to count it more, or all the way left to ignore it.",
      "A priority you set by hand on a person always wins over the score.",
    ],
    tip: "Open any person to see exactly which signals added to their score.",
    mock: "priority", go: { label: "Open Settings", path: "/settings" },
  },
  {
    name: "Keep the nest safe", short: "Backup", where: "Settings, then Data and Rules",
    hook: "Your data lives in your browser, so give it a safety net.",
    steps: [
      "In Settings, Data, pick a backup file once and NesT keeps it current.",
      "Fix a wrongly placed job title in Review, and teach it so the same title lands right next time.",
      "Restore from a backup or a daily snapshot whenever you need to.",
    ],
    tip: "Clearing your browser data clears NesT too, so keep that backup file.",
    mock: "backup", go: { label: "Open Settings", path: "/settings" },
  },
];

export function Playbook({ hasData, tryIt }: { hasData: boolean; tryIt: (path: string) => void }) {
  const [i, setI] = useState(0);
  const c = CHAPTERS[i];
  const pct = ((i + 1) / CHAPTERS.length) * 100;

  return (
    <div style={{ maxWidth: 960, margin: "72px auto 0" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ display: "inline-flex", padding: "4px 14px", borderRadius: 9999, background: "#fff", border: "1px solid #a7f3d0", fontSize: 12, fontWeight: 600, color: "#065f46", marginBottom: 14 }}>
          The Owlie playbook
        </div>
        <h2 className="font-serif" style={{ fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 700, color: INK, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 8px" }}>
          Build your nest in eight moves
        </h2>
        <p style={{ color: "#64748b", fontSize: 15, fontWeight: 300, margin: 0 }}>
          From a raw LinkedIn export to a reply in your inbox. Tap a twig to jump to any move.
        </p>
      </div>

      {/* Twig path */}
      <div style={{ overflowX: "auto", paddingBottom: 6 }}>
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", minWidth: 640, padding: "0 4px" }}>
          <div style={{ position: "absolute", top: 17, left: 24, right: 24, height: 3, background: LINE, borderRadius: 2 }} />
          <div style={{ position: "absolute", top: 17, left: 24, height: 3, width: `calc((100% - 48px) * ${i / (CHAPTERS.length - 1)})`, background: "#059669", borderRadius: 2, transition: "width 0.35s" }} />
          {CHAPTERS.map((ch, n) => (
            <button
              key={ch.name}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Move ${n + 1}: ${ch.name}`}
              aria-current={n === i}
              style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 72 }}
            >
              <span style={{
                width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, transition: "all 0.25s",
                background: n <= i ? INK : "#fff", color: n <= i ? "#fff" : "#94a3b8", border: n <= i ? `2px solid ${INK}` : `2px solid ${LINE}`,
                transform: n === i ? "scale(1.18)" : "none", boxShadow: n === i ? "0 4px 12px rgba(12,45,34,0.25)" : "none",
              }}>{n + 1}</span>
              <span style={{ fontSize: 11, fontWeight: n === i ? 700 : 500, color: n === i ? INK : "#94a3b8" }}>{ch.short}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chapter card */}
      <div key={i} className="shadow-float-l" style={{ marginTop: 22, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 18, overflow: "hidden" }}>
        <div style={{ height: 4, background: "#eef0ee" }}><div style={{ height: 4, width: `${pct}%`, background: "#059669", transition: "width 0.35s" }} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28, padding: 26 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#047857" }}>Move {i + 1} of {CHAPTERS.length}</div>
            <h3 className="font-serif" style={{ fontSize: 28, fontWeight: 700, color: INK, margin: "4px 0 6px", lineHeight: 1.15 }}>{c.name}</h3>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 12px" }}>{c.hook}</p>
            <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, background: "#f4f3ee", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 14 }}>Where: {c.where}</div>
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {c.steps.map((s, n) => (
                <li key={n} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "#334155", lineHeight: 1.55 }}>
                  <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "#ecfdf5", color: "#065f46", fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center", marginTop: 1 }}>{n + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#f8faf8", border: `1px solid ${LINE}`, borderRadius: 14, padding: 16 }}>{MOCKS[c.mock]()}</div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <img src="/owl-mascot.png" alt="" width={52} height={52} style={{ objectFit: "contain", flexShrink: 0 }} />
              <div style={{ position: "relative", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 14, padding: "10px 14px", fontSize: 12.5, color: "#065f46", lineHeight: 1.55 }}>
                <b>Owlie says:</b> {c.tip}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 26px", borderTop: `1px solid ${LINE}`, background: "rgba(244,243,238,0.5)" }}>
          <button type="button" onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}
            style={{ padding: "9px 18px", borderRadius: 9999, border: `1px solid ${LINE}`, background: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#334155", cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.4 : 1 }}>
            Back
          </button>
          <button type="button" onClick={() => tryIt(c.go.path)}
            style={{ padding: "9px 18px", borderRadius: 9999, border: "1px solid #a7f3d0", background: "#ecfdf5", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#065f46", cursor: "pointer" }}>
            {hasData ? c.go.label : `${c.go.label} with sample data`}
          </button>
          <button type="button" onClick={() => setI((n) => Math.min(CHAPTERS.length - 1, n + 1))} disabled={i === CHAPTERS.length - 1}
            style={{ padding: "9px 22px", borderRadius: 9999, border: "none", background: INK, fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#fff", cursor: i === CHAPTERS.length - 1 ? "default" : "pointer", opacity: i === CHAPTERS.length - 1 ? 0.4 : 1 }}>
            Next move
          </button>
        </div>
      </div>
    </div>
  );
}
