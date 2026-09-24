// Follow-ups as a calendar file, so reminders show up where you already look.
// Generated locally; nothing is sent anywhere.

import { parseISODate, todayISO } from "./dates";
import type { Person, Settings } from "./types";

function stamp(d: Date): string {
  return `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

function escape(text: string): string {
  return text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");
}

/** All scheduled follow-ups as all-day events with a reminder on the day. */
export function buildFollowUpCalendar(people: Person[], settings: Settings, today = todayISO()): string {
  const closed = new Set(settings.statuses.filter((s) => s.kind === "closed").map((s) => s.id));
  const due = people.filter((p) => p.followUpAt && !closed.has(p.status));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LinkedIn Intelligence//Follow-ups//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:LinkedIn Intelligence follow-ups",
  ];

  for (const p of due) {
    const start = parseISODate(p.followUpAt);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const ymd = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const details = [
      p.position && `Role: ${p.position}`,
      p.company && `Company: ${p.company}`,
      p.nextAction && `Next: ${p.nextAction}`,
      p.lastContactedAt && `Last contacted: ${p.lastContactedAt}`,
      p.url,
    ].filter(Boolean).join("\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:netlens-${p.id.replace(/[^a-z0-9]/gi, "")}-${p.followUpAt}@netlens.local`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART;VALUE=DATE:${ymd(start)}`,
      `DTEND;VALUE=DATE:${ymd(end)}`,
      `SUMMARY:${escape(`Follow up with ${p.name}${p.company ? ` (${p.company})` : ""}`)}`,
      `DESCRIPTION:${escape(details)}`,
      p.followUpAt < today ? "STATUS:CONFIRMED" : "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:PT9H",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escape(`Follow up with ${p.name}`)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadFollowUpCalendar(people: Person[], settings: Settings) {
  const blob = new Blob([buildFollowUpCalendar(people, settings)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "netlens-follow-ups.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
