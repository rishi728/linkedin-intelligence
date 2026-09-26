// Research links and message templates. Nothing here sends anything:
// research opens a search the user asked for; messages are copied by the user.

import { sectionLabel } from "../knowledge/roles";
import type { Person, Settings } from "./types";

const google = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

export type ResearchKind = "person" | "company" | "company-role" | "careers" | "news" | "linkedin-company" | "linkedin-people";

export const RESEARCH_ACTIONS: Array<{ kind: ResearchKind; label: string; needs: "person" | "company" }> = [
  { kind: "person", label: "Search this person", needs: "person" },
  { kind: "company", label: "Search the company", needs: "company" },
  { kind: "company-role", label: "Company + this role", needs: "company" },
  { kind: "careers", label: "Company careers & openings", needs: "company" },
  { kind: "news", label: "Recent company news", needs: "company" },
  { kind: "linkedin-company", label: "Company on LinkedIn", needs: "company" },
  { kind: "linkedin-people", label: "Others in this role on LinkedIn", needs: "company" },
];

export function researchUrl(kind: ResearchKind, p: Pick<Person, "name" | "company" | "roleLabel" | "position">): string {
  const company = p.company ? `"${p.company}"` : "";
  switch (kind) {
    case "person": return google(`"${p.name}" ${company}`.trim());
    case "company": return google(`${company} company`);
    case "company-role": return google(`${company} "${p.roleLabel || p.position}"`);
    case "careers": return google(`${company} careers jobs openings`);
    case "news": return `https://news.google.com/search?q=${encodeURIComponent(p.company)}`;
    case "linkedin-company": return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(p.company)}`;
    case "linkedin-people": return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${p.company} ${p.roleLabel || p.position}`)}`;
  }
}

export const TEMPLATE_VARIABLES = [
  { key: "first_name", label: "First name" },
  { key: "name", label: "Full name" },
  { key: "company", label: "Company" },
  { key: "role", label: "Role" },
  { key: "position", label: "Position (as on LinkedIn)" },
  { key: "reason", label: "Why you're reaching out" },
  { key: "ask", label: "Your ask" },
  { key: "common_context", label: "Common context" },
  { key: "my_name", label: "Your name" },
  { key: "my_background", label: "Your background" },
  { key: "area", label: "Their area of work" },
  { key: "opportunity", label: "Job or internship" },
] as const;

export type TemplateVars = Record<(typeof TEMPLATE_VARIABLES)[number]["key"], string>;

/** LinkedIn "positions" are often whole headlines; keep the readable part. */
/**
 * A LinkedIn headline is often a whole CV separated by pipes. Only the first claim
 * belongs in a message, so the rest is dropped rather than pasted at the reader.
 */
export function shortenHeadline(raw: string, max = 70): string {
  const first = (raw ?? "").split(/\s*[|•·;]\s*/)[0].trim();
  if (!first) return "";
  return first.length <= max ? first : first.slice(0, max).replace(/[\s,;:-]+\S*$/, "");
}

export function readableRole(p: Pick<Person, "position" | "roleLabel">): string {
  const raw = (p.position ?? "").trim();
  if (!raw) return p.roleLabel;
  const firstSegment = raw.split(/\s*[|•·;]\s*/)[0].trim();
  if (firstSegment && firstSegment.length <= 60) return firstSegment;
  return p.roleLabel;
}

export function templateVars(p: Person, settings: Settings, overrides: Partial<TemplateVars> = {}): TemplateVars {
  return {
    first_name: p.firstName || p.name.split(" ")[0] || "",
    name: p.name,
    company: p.company,
    role: readableRole(p),
    position: p.position,
    reason: p.personalization.why,
    ask: p.personalization.ask,
    common_context: p.personalization.common,
    my_name: settings.profile.name,
    my_background: shortenHeadline(settings.profile.background),
    // Only from the repository; when it does not know, the placeholder stays visible.
    area: p.bucket && p.section ? sectionLabel(p.bucket, p.section) : "",
    opportunity: settings.goals.opportunityTypes.includes("Internship")
      ? "internship"
      : settings.goals.opportunityTypes.includes("Full-time")
        ? "job"
        : "",
    ...overrides,
  };
}

/** Fills {{variables}}; anything missing becomes a visible [placeholder] to edit. */
export function renderTemplate(body: string, vars: Partial<TemplateVars>): string {
  return body
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
      const v = (vars as Record<string, string | undefined>)[key]?.trim();
      return v ? v : `[${key.replace(/_/g, " ")}]`;
    })
    .replace(/ +\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ");
}

export const LINKEDIN_NOTE_LIMIT = 300;
