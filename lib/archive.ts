// Reads the *other* files in a LinkedIn data export and turns them into
// relationship history: who you've actually talked to, who replied, who invited
// whom, your own schools and roles.
//
// Only metadata is kept — dates, directions and counts. Message text is read to
// work out direction and then discarded; it is never stored or exported.

import Papa from "papaparse";
import { toISODate } from "./workspace/dates";

export type ArchiveFileKind = "connections" | "messages" | "invitations" | "notes" | "education" | "positions" | "profile" | "unknown";

export interface ContactHistory {
  /** Messages exchanged, in both directions. */
  messageCount: number;
  lastMessageAt: string;
  lastOutgoingAt: string;
  lastIncomingAt: string;
  /** They have sent you at least one message. */
  theyReplied: boolean;
  /** You have sent them at least one message. */
  youMessaged: boolean;
  invited: "you" | "them" | null;
  invitedAt: string;
  note: string;
}

export interface ArchiveResult {
  history: Record<string, ContactHistory>;
  profile: { name: string; headline: string; location: string } | null;
  schools: string[];
  positions: Array<{ company: string; title: string; startedOn: string }>;
  counts: Record<"messages" | "invitations" | "notes" | "education" | "positions" | "people", number>;
  /** Files we could not make sense of, by file name. */
  skipped: string[];
}

const HEADER_SIGNATURES: Array<[ArchiveFileKind, RegExp]> = [
  ["messages", /conversation id/i],
  ["invitations", /\bdirection\b/i],
  ["notes", /connection profile url/i],
  ["education", /school name/i],
  ["positions", /company name.*title|title.*company name/i],
  ["profile", /maiden name|geo location/i],
  ["connections", /first\s*name.*(company|position)|position.*first\s*name/i],
];

export function detectArchiveFile(text: string, fileName = ""): ArchiveFileKind {
  const head = text.slice(0, 4000).split(/\r?\n/).slice(0, 6).join("\n");
  for (const [kind, re] of HEADER_SIGNATURES) if (re.test(head)) return kind;
  const name = fileName.toLowerCase();
  for (const kind of ["messages", "invitations", "notes", "education", "positions", "profile", "connections"] as const) {
    if (name.includes(kind)) return kind;
  }
  return "unknown";
}

function rows(text: string): Array<Record<string, string>> {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.replace(/^﻿/, "").trim().toLowerCase(),
  });
  return parsed.data ?? [];
}

/** linkedin.com/in/Name-123/?x=1 → linkedin.com/in/name-123 */
export function profileKey(url: string): string {
  const v = (url ?? "").trim().toLowerCase();
  if (!v) return "";
  return v
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

function parseDate(raw: string): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  // LinkedIn uses "2026-09-15 18:22:31 UTC" in messages and invitations.
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const parsed = new Date(v);
  return Number.isNaN(parsed.getTime()) ? "" : toISODate(parsed);
}

function blank(): ContactHistory {
  return { messageCount: 0, lastMessageAt: "", lastOutgoingAt: "", lastIncomingAt: "", theyReplied: false, youMessaged: false, invited: null, invitedAt: "", note: "" };
}

const later = (a: string, b: string) => (a > b ? a : b);

/**
 * Works out which profile is you: across every message and invitation, you are
 * the only person who appears in nearly all of them.
 */
function findSelf(urlCounts: Map<string, number>): string {
  let best = "";
  let bestCount = 0;
  for (const [url, n] of urlCounts) {
    if (n > bestCount) {
      best = url;
      bestCount = n;
    }
  }
  return bestCount >= 3 ? best : "";
}

export function parseArchive(files: Array<{ name: string; text: string }>): ArchiveResult {
  const result: ArchiveResult = {
    history: {},
    profile: null,
    schools: [],
    positions: [],
    counts: { messages: 0, invitations: 0, notes: 0, education: 0, positions: 0, people: 0 },
    skipped: [],
  };

  const messageRows: Array<{ sender: string; recipients: string[]; date: string }> = [];
  const invitationRows: Array<{ inviter: string; invitee: string; direction: string; sentAt: string }> = [];
  const appearances = new Map<string, number>();
  const bump = (url: string) => url && appearances.set(url, (appearances.get(url) ?? 0) + 1);

  for (const file of files) {
    const kind = detectArchiveFile(file.text, file.name);
    switch (kind) {
      case "messages": {
        for (const r of rows(file.text)) {
          if ((r["is message draft"] ?? "").toLowerCase() === "true") continue;
          const sender = profileKey(r["sender profile url"] ?? "");
          const recipients = (r["recipient profile urls"] ?? "").split(/[\s,;]+/).map(profileKey).filter(Boolean);
          const date = parseDate(r["date"] ?? "");
          if (!sender && !recipients.length) continue;
          messageRows.push({ sender, recipients, date });
          bump(sender);
          for (const x of recipients) bump(x);
        }
        result.counts.messages += messageRows.length;
        break;
      }
      case "invitations": {
        for (const r of rows(file.text)) {
          const inviter = profileKey(r["inviterprofileurl"] ?? r["inviter profile url"] ?? "");
          const invitee = profileKey(r["inviteeprofileurl"] ?? r["invitee profile url"] ?? "");
          const direction = (r["direction"] ?? "").trim().toUpperCase();
          invitationRows.push({ inviter, invitee, direction, sentAt: parseDate(r["sent at"] ?? "") });
          bump(inviter);
          bump(invitee);
        }
        result.counts.invitations += invitationRows.length;
        break;
      }
      case "notes": {
        for (const r of rows(file.text)) {
          const key = profileKey(r["connection profile url"] ?? "");
          const note = (r["note"] ?? "").trim();
          if (!key || !note) continue;
          (result.history[key] ??= blank()).note = note;
          result.counts.notes++;
        }
        break;
      }
      case "education": {
        for (const r of rows(file.text)) {
          const school = (r["school name"] ?? "").trim();
          if (school) result.schools.push(school);
        }
        result.counts.education = result.schools.length;
        break;
      }
      case "positions": {
        for (const r of rows(file.text)) {
          const company = (r["company name"] ?? "").trim();
          const title = (r["title"] ?? "").trim();
          if (company || title) result.positions.push({ company, title, startedOn: (r["started on"] ?? "").trim() });
        }
        result.counts.positions = result.positions.length;
        break;
      }
      case "profile": {
        const r = rows(file.text)[0];
        if (r) {
          result.profile = {
            name: `${(r["first name"] ?? "").trim()} ${(r["last name"] ?? "").trim()}`.trim(),
            headline: (r["headline"] ?? "").trim(),
            location: (r["geo location"] ?? "").trim(),
          };
        }
        break;
      }
      case "connections":
        break; // handled by the connections importer
      default:
        result.skipped.push(file.name);
    }
  }

  const self = findSelf(appearances);

  for (const m of messageRows) {
    const outgoing = self ? m.sender === self : false;
    const others = outgoing ? m.recipients : [m.sender, ...m.recipients].filter((u) => u && u !== self);
    for (const other of others) {
      if (!other || other === self) continue;
      const h = (result.history[other] ??= blank());
      h.messageCount++;
      h.lastMessageAt = later(h.lastMessageAt, m.date);
      if (outgoing) {
        h.youMessaged = true;
        h.lastOutgoingAt = later(h.lastOutgoingAt, m.date);
      } else {
        h.theyReplied = true;
        h.lastIncomingAt = later(h.lastIncomingAt, m.date);
      }
    }
  }

  for (const inv of invitationRows) {
    const other = inv.inviter === self ? inv.invitee : inv.inviter;
    if (!other || other === self) continue;
    const h = (result.history[other] ??= blank());
    const theyInvited = inv.direction === "INCOMING" || (!!self && inv.invitee === self);
    h.invited = theyInvited ? "them" : "you";
    h.invitedAt = later(h.invitedAt, inv.sentAt);
  }

  result.counts.people = Object.keys(result.history).length;
  return result;
}

/** One line summarising what an import found, for the confirmation toast. */
export function describeArchive(a: ArchiveResult): string {
  const parts: string[] = [];
  if (a.counts.messages) parts.push(`${a.counts.messages.toLocaleString()} messages`);
  if (a.counts.invitations) parts.push(`${a.counts.invitations.toLocaleString()} invitations`);
  if (a.counts.notes) parts.push(`${a.counts.notes} notes`);
  if (a.schools.length) parts.push(`${a.schools.length} schools`);
  if (a.positions.length) parts.push(`${a.positions.length} roles`);
  return parts.length ? parts.join(" · ") : "nothing we could use";
}
