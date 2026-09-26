// How relevant one connection is to this particular user, worked out here and
// never asked of a model.
//
// Two reasons it is deterministic. Relevance has to be stable, because a number
// that moves between runs is not a ranking. And every relationship reason has to
// be a fact already in the workspace: shared school, a reply, an invitation they
// sent. A model asked to explain a relationship will invent a plausible one.

import { bucketLabel, sectionLabel } from "../knowledge/roles";
import { sectorLabel } from "../knowledge/sectors";
import { FOCUS_MAP } from "./focus";
import type { Person, Settings } from "./types";

export interface ConnectionIntelligence {
  connectionId: string;
  /** 0 to 1. Never 1.00: nothing here is certain. */
  relevance: number;
  relevanceReasons: string[];
  /** Only facts already stored about this relationship. */
  relationshipContext: string[];
  potentialUseCases: string[];
}

interface Signal {
  weight: number;
  reason: string;
}

/** What the user's chosen goals imply about who is worth knowing. */
function goalBuckets(settings: Settings): Set<string> {
  const out = new Set<string>();
  for (const id of settings.focus?.goals ?? []) {
    for (const b of FOCUS_MAP.get(id)?.buckets ?? []) out.add(b);
  }
  return out;
}

export function scoreRelevance(person: Person, settings: Settings): ConnectionIntelligence {
  const signals: Signal[] = [];
  const goals = settings.goals;
  const implied = goalBuckets(settings);

  if (person.bucket && goals.buckets.includes(person.bucket)) {
    signals.push({ weight: 30, reason: `${bucketLabel(person.bucket)}, an area you are targeting` });
  } else if (person.bucket && implied.has(person.bucket)) {
    signals.push({ weight: 20, reason: `${bucketLabel(person.bucket)}, which fits what you said you are looking for` });
  }

  if (person.section && goals.sections.includes(person.section)) {
    signals.push({ weight: 18, reason: `Works in ${sectionLabel(person.bucket ?? "", person.section)}` });
  }

  if (person.isTarget) {
    signals.push({ weight: 22, reason: `Works at ${person.company}, a target company` });
  }

  if (person.sector && settings.goals.buckets.length === 0 && implied.size === 0) {
    // Nothing to match against yet, so sector alone is not evidence of relevance.
  } else if (person.sector) {
    signals.push({ weight: 6, reason: `In ${sectorLabel(person.sector)}` });
  }

  if (person.isAlumni) signals.push({ weight: 14, reason: "Shares your school or campus" });
  if (person.history?.theyReplied) signals.push({ weight: 16, reason: "Has written back to you before" });
  else if (person.history?.messageCount) signals.push({ weight: 8, reason: "You have messaged before" });
  if (person.history?.invited === "them") signals.push({ weight: 6, reason: "They invited you to connect" });
  if (person.section === "recruitment") signals.push({ weight: 10, reason: "Recruits, so can point at openings" });
  if (person.isFounder) signals.push({ weight: 8, reason: "Founded the company, so decisions are short" });
  if (person.email) signals.push({ weight: 3, reason: "Email address available" });

  // An uncertain classification should not produce a confident ranking.
  if (person.certainty === "low") signals.push({ weight: -8, reason: "Their job title is unclear" });

  const raw = signals.reduce((n, s) => n + s.weight, 0);
  const relevance = Math.max(0, Math.min(0.97, raw / 100));

  const relationshipContext: string[] = [];
  if (person.isAlumni) relationshipContext.push("From your school or campus");
  if (person.history?.messageCount) {
    relationshipContext.push(
      `${person.history.messageCount} ${person.history.messageCount === 1 ? "message" : "messages"} exchanged`,
    );
  }
  if (person.history?.theyReplied) relationshipContext.push("They have replied to you");
  if (person.history?.invited === "them") relationshipContext.push("They sent the invitation");
  else if (person.history?.invited === "you") relationshipContext.push("You sent the invitation");
  if (person.connectedOn) relationshipContext.push(`Connected ${person.connectedOn.getFullYear()}`);

  const potentialUseCases: string[] = [];
  if (person.section === "recruitment") potentialUseCases.push("Ask what is open on their desk");
  if (person.isTarget) potentialUseCases.push(`Learn how hiring works at ${person.company}`);
  if (person.bucket && (goals.buckets.includes(person.bucket) || implied.has(person.bucket))) {
    potentialUseCases.push(`A conversation about working in ${bucketLabel(person.bucket).toLowerCase()}`);
  }
  if (person.isFounder) potentialUseCases.push("Ask directly, founders answer for themselves");
  if (person.history?.theyReplied) potentialUseCases.push("Pick up the conversation you already have");

  return {
    connectionId: person.id,
    relevance,
    relevanceReasons: signals.filter((s) => s.weight > 0).sort((a, b) => b.weight - a.weight).slice(0, 4).map((s) => s.reason),
    relationshipContext,
    potentialUseCases: potentialUseCases.slice(0, 3),
  };
}

/** The most relevant people, with everything already known about why. */
export function rankByRelevance(people: Person[], settings: Settings, limit = 20): ConnectionIntelligence[] {
  return people
    .map((p) => scoreRelevance(p, settings))
    .filter((x) => x.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}
