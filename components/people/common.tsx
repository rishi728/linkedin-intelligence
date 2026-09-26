"use client";

import { ExternalLink, Search } from "lucide-react";
import { bucketLabel, sectionLabel } from "@/lib/knowledge/roles";
import { RESEARCH_ACTIONS, researchUrl } from "@/lib/workspace/outreach";
import type { Person, Priority, Settings, Tone } from "@/lib/workspace/types";
import { Avatar, Button, Dot, Menu, MenuItem, MenuLabel, Pill, cx } from "@/components/ui";

export const PRIORITY_TONE: Record<Priority, Tone> = { high: "orange", medium: "blue", low: "gray" };
export const PRIORITY_LABEL: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low" };

export function statusDef(settings: Settings, id: string) {
  return settings.statuses.find((s) => s.id === id) ?? { id, label: id, tone: "gray" as Tone, onBoard: false, kind: "idle" as const };
}

export function StatusBadge({ status, settings }: { status: string; settings: Settings }) {
  const def = statusDef(settings, status);
  return (
    <Pill tone={def.tone}>
      <Dot tone={def.tone} />
      {def.label}
    </Pill>
  );
}

export function PriorityBadge({ person }: { person: Person }) {
  return (
    <Pill tone={PRIORITY_TONE[person.priority]} title={person.priorityManual ? "Set by you" : person.priorityReasons.join(" · ") || "No matching goals yet"}>
      {PRIORITY_LABEL[person.priority]}
      {person.priorityManual ? " ·" : ""}
    </Pill>
  );
}

export function ConfidenceBadge({ person }: { person: Person; showPercent?: boolean }) {
  if (!person.bucket) return <Pill tone="gray" title={person.evidence.join(" · ")}>Role unclear</Pill>;
  if (person.classSource === "manual") return <Pill tone="teal">Set by you</Pill>;
  if (person.classSource === "rule") return <Pill tone="teal">Your rule</Pill>;
  const tone: Tone = person.certainty === "high" ? "green" : person.certainty === "medium" ? "blue" : "amber";
  // The label is about how well the job title could be read, never about the
  // person, so it says exactly that.
  const title = `${person.certainty[0].toUpperCase()}${person.certainty.slice(1)} confidence. ${person.evidence.join(" · ")}`;
  return (
    <Pill tone={tone} title={title}>
      {person.certainty === "high" ? "Clear" : person.certainty === "medium" ? "Likely" : "Uncertain"}
    </Pill>
  );
}

export function RoleLine({ person, className }: { person: Person; className?: string }) {
  return (
    <span className={cx("truncate text-[12px] text-muted", className)}>
      {person.bucket
        ? `${bucketLabel(person.bucket)}${person.section ? ` · ${sectionLabel(person.bucket, person.section)}` : ""}`
        : "Role not stated"}
    </span>
  );
}

export function PersonIdentity({ person, onOpen, size = 28 }: { person: Person; onOpen?: () => void; size?: number }) {
  return (
    <button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-2.5 text-left">
      <Avatar name={person.name} size={size} />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-medium text-ink">{person.name}</span>
          {person.isTarget ? <Pill tone="teal">Target</Pill> : null}
        </span>
        <span className="block truncate text-[12px] text-muted">{person.position || "No title shared"}</span>
      </span>
    </button>
  );
}

export function LinkedInLink({ person, size = "sm" }: { person: Person; size?: "sm" | "md" }) {
  if (!person.url) return null;
  return (
    <Button
      size={size}
      variant="secondary"
      icon={ExternalLink}
      onClick={() => window.open(person.url, "_blank", "noopener,noreferrer")}
    >
      LinkedIn
    </Button>
  );
}

export function ResearchMenu({ person, align = "right" }: { person: Person; align?: "left" | "right" }) {
  return (
    <Menu
      align={align}
      width={260}
      trigger={({ toggle }) => (
        <Button size="sm" icon={Search} onClick={toggle}>
          Research
        </Button>
      )}
    >
      {(close) => (
        <>
          <MenuLabel>Opens a web search in a new tab</MenuLabel>
          {RESEARCH_ACTIONS.filter((a) => (a.needs === "company" ? !!person.company : true)).map((a) => (
            <MenuItem
              key={a.kind}
              onClick={() => {
                window.open(researchUrl(a.kind, person), "_blank", "noopener,noreferrer");
                close();
              }}
            >
              {a.label}
            </MenuItem>
          ))}
        </>
      )}
    </Menu>
  );
}

/** Opens several LinkedIn profiles, warning that browsers block bulk pop-ups. */
export function openProfiles(people: Person[]): number {
  let opened = 0;
  for (const p of people) {
    if (!p.url) continue;
    const win = window.open(p.url, "_blank", "noopener,noreferrer");
    if (win) opened++;
  }
  return opened;
}
