// Turns parsed CSV rows + the user's saved records and settings into Person objects.

import type { Connection } from "../analyzer";
import { companyKey } from "../analyzer";
import { profileKey, type ContactHistory } from "../archive";
import { classifyAuto, type PersonClassification } from "../intelligence";
import { classifyCorpus, pairKey } from "../classifier/run";
import { resolveClassification } from "../classifier/corrections";
import { classifySector, type SectorId } from "../knowledge/sectors";
import { TAG_MAP } from "../taxonomy";
import { tokenize } from "../text";
import { addDays, todayISO } from "./dates";
import { levelFor, scorePriority } from "./priority";
import type { ArchiveData, Person, PersonRecord, Settings } from "./types";

export type AutoCache = Map<string, PersonClassification>;

const autoKey = (position: string, company: string) => `${position}|${company}`;

export function autoClassifyAll(rows: Connection[], cache: AutoCache = new Map()): AutoCache {
  for (const r of rows) {
    const key = autoKey(r.position, r.company);
    if (!cache.has(key)) cache.set(key, classifyAuto(r.position, r.company));
  }
  return cache;
}

/** Matches "Blinkit" against "Blinkit (Formerly Grofers)" and "BLINKIT Pvt Ltd". */
export function companyMatches(key: string, targets: string[]): boolean {
  if (!key) return false;
  return targets.some((t) => {
    const tk = companyKey(t);
    return !!tk && (key === tk || key.startsWith(`${tk} `));
  });
}

const TECH_DOMAINS = new Set(["engineering", "data-ai", "product", "technology", "design"]);

export type CorpusCache = ReturnType<typeof classifyCorpus>["byPair"];

export function buildCorpus(rows: Connection[]): CorpusCache {
  return classifyCorpus(rows.map((r) => ({ position: r.position, company: r.company }))).byPair;
}

type RecordInputs = Pick<Person, "name" | "company" | "position" | "roleFamily" | "systemTags" | "pastCompanies">;

/** Everything on a Person that comes from the user's own record rather than from the imported row. */
function recDerived(core: RecordInputs, rec: PersonRecord, autoLevel: Person["priority"], settings: Settings, today: string) {
  const status = rec.status ?? "not_contacted";
  const statusDef = settings.statuses.find((s) => s.id === status);
  const tags = [...core.systemTags.map((t) => TAG_MAP[t].label), ...(rec.userTags ?? [])];
  const personalization = { why: "", know: "", common: "", ask: "", personal: "", ...rec.personalization };
  const location = rec.location ?? "";
  const notes = rec.notes ?? "";
  return {
    tags,
    location,
    status,
    priority: rec.priority ?? autoLevel,
    priorityManual: !!rec.priority,
    lastContactedAt: rec.lastContactedAt ?? "",
    followUpAt: statusDef?.kind === "closed" ? "" : rec.followUpAt ?? "",
    channel: rec.channel ?? "",
    response: rec.response ?? "",
    nextAction: rec.nextAction || suggestNextAction(status, rec.followUpAt, today),
    opportunityType: rec.opportunityType ?? "",
    notes,
    personalization,
    draft: rec.draft ?? "",
    messages: rec.messages ?? [],
    activity: rec.activity ?? [],
    sequenceStep: rec.sequenceStep ?? 0,
    haystack: [
      core.name, core.company, core.position, core.roleFamily, location, notes, ...tags, ...core.pastCompanies,
      personalization.why, personalization.know, personalization.common,
    ].join("  ").toLowerCase(),
  };
}

/**
 * The same Person with a changed record applied. Classification is not recomputed here
 * (that needs the whole corpus), so a classification edit still triggers a full rebuild.
 */
export function patchPerson(prev: Person, rec: PersonRecord, settings: Settings, today = todayISO()): Person {
  return { ...prev, ...recDerived(prev, rec, levelFor(prev.priorityScore), settings, today) };
}

export function buildPeople(
  rows: Connection[],
  cache: AutoCache,
  records: Record<string, PersonRecord>,
  settings: Settings,
  archive?: ArchiveData | null,
  corpus?: CorpusCache,
): Person[] {
  const today = todayISO();
  const schoolKeys = settings.profile.schools.map((s) => tokenize(s)).filter((t) => t.length);
  const seen = new Map<string, string>();
  const resolvedCorpus = corpus ?? buildCorpus(rows);
  const sectorCache = new Map<string, SectorId | null>();

  const draft = rows.map((r) => {
    const rec = records[r.id] ?? {};
    // Signals the repository does not cover: campus roles, founders, past
    // employers named in the title, and the system tags.
    const c = cache.get(autoKey(r.position, r.company)) ?? classifyAuto(r.position, r.company);
    // Then the rules the user taught, and any correction they made to this
    // person. The raw title itself is never touched.
    const known = resolveClassification(
      resolvedCorpus.get(pairKey(r.position, r.company))!,
      r.position,
      settings.rules,
      rec.classification,
    );
    const key = companyKey(r.company);

    const dupKey = r.url ? r.url.toLowerCase().replace(/\/+$/, "") : `${r.name}|${key}`.toLowerCase();
    const duplicateOf = seen.get(dupKey) ?? null;
    if (!duplicateOf) seen.set(dupKey, r.id);

    const companyTokens = tokenize(r.company);
    const isAlumni = schoolKeys.some((s) => s.every((t) => companyTokens.includes(t)));
    const history = archive?.history?.[profileKey(r.url)] ?? null;

    return { r, rec, c, known, key, duplicateOf, isAlumni, history };
  });

  return draft.map(({ r, rec, c, known, key, duplicateOf, isAlumni, history }) => {
    const isTarget = companyMatches(key, settings.targetCompanies);
    const base = {
      category: known.category, roleFamily: known.roleFamily, company: r.company, isTarget, isAlumni,
      email: r.email, url: r.url, systemTags: c.tags, confidence: known.confidence, history,
    };
    const pr = scorePriority(base, settings);

    const person: Person = {
      id: r.id,
      name: r.name,
      firstName: r.firstName,
      lastName: r.lastName,
      url: r.url,
      email: r.email,
      company: r.company,
      companyKey: key,
      position: r.position,
      connectedOn: r.connectedOn,
      classSource: known.source,
      classBasis: r.basis,
      systemTags: c.tags,
      priorityScore: pr.score,
      priorityReasons: pr.reasons,
      pastCompanies: c.pastCompanies,
      history,
      isTarget,
      isCampus: c.campusOrg,
      campusActivity: c.campusActivity,
      isFounder: c.isFounder,
      isAlumni,
      duplicateOf,
      category: known.category,
      roleFamily: known.roleFamily,
      confidence: known.confidence,
      band: known.band,
      secondCategory: known.secondCategory,
      method: known.method,
      cluster: known.cluster,
      conflict: known.conflict,
      genericInference: known.genericInference,
      sector: sectorCache.has(r.company) ? sectorCache.get(r.company)! : (() => { const s = classifySector(r.company).sector; sectorCache.set(r.company, s); return s; })(),
      needsReview: known.needsReview,
      ...recDerived({ name: r.name, company: r.company, position: r.position, roleFamily: known.roleFamily, systemTags: c.tags, pastCompanies: c.pastCompanies }, rec, pr.level, settings, today),
    };
    return person;
  });
}

export function suggestNextAction(status: string, followUpAt: string | undefined, today = todayISO()): string {
  switch (status) {
    case "not_contacted": return "";
    case "to_contact": return "Send first message";
    case "contacted":
    case "awaiting": return followUpAt && followUpAt <= today ? "Follow up now" : "Wait for a reply";
    case "follow_up": return "Send a follow-up";
    case "replied": return "Reply and propose next step";
    case "call_scheduled": return "Prepare for the call";
    case "interested": return "Share resume / details";
    case "referral": return "Thank them and track the application";
    case "opportunity": return "Keep them updated";
    default: return "";
  }
}

/** Side effects when a person's status changes: dates the user would otherwise forget. */
export function statusChangePatch(rec: PersonRecord, nextStatus: string, settings: Settings, today = todayISO()): PersonRecord {
  const def = settings.statuses.find((s) => s.id === nextStatus);
  const prevLabel = settings.statuses.find((s) => s.id === (rec.status ?? "not_contacted"))?.label ?? "Not contacted";
  const patch: PersonRecord = { status: nextStatus };
  if (["contacted", "awaiting", "follow_up"].includes(nextStatus) && !rec.lastContactedAt) patch.lastContactedAt = today;
  if (def?.kind === "closed") patch.followUpAt = "";
  else if (def?.followUpDays !== undefined && (!rec.followUpAt || rec.followUpAt < today)) patch.followUpAt = addDays(today, def.followUpDays);
  patch.nextAction = "";
  patch.activity = [...(rec.activity ?? []), { at: new Date().toISOString(), kind: "status", text: `${prevLabel} → ${def?.label ?? nextStatus}` }];
  return patch;
}

/**
 * Turns archive history into record patches: who you have already contacted and
 * who replied. Never touches anyone whose status you have set yourself.
 */
export function archiveSeedPatches(
  rows: Connection[],
  history: Record<string, ContactHistory>,
  records: Record<string, PersonRecord>,
): { patches: Record<string, PersonRecord>; applied: number; skipped: number; matched: number } {
  const patches: Record<string, PersonRecord> = {};
  let applied = 0;
  let skipped = 0;
  let matched = 0;

  for (const r of rows) {
    const h = history[profileKey(r.url)];
    if (!h) continue;
    matched++;
    const rec = records[r.id] ?? {};
    const patch: PersonRecord = {};

    if (h.note && !rec.notes) patch.notes = h.note;

    if (h.messageCount > 0) {
      if (rec.status && rec.status !== "not_contacted") {
        skipped++;
      } else {
        patch.status = h.theyReplied ? "replied" : "contacted";
        patch.channel = rec.channel || "LinkedIn";
        const last = h.lastOutgoingAt || h.lastIncomingAt;
        if (last && !rec.lastContactedAt) patch.lastContactedAt = last;
        patch.activity = [
          ...(rec.activity ?? []),
          {
            // Dated when the conversation actually happened, not when it was imported,
            // so an activity list reads as history rather than as one import event.
            at: h.lastMessageAt || new Date().toISOString(),
            kind: "message" as const,
            text: `${h.messageCount} message${h.messageCount === 1 ? "" : "s"} in your LinkedIn archive`,
          },
        ];
      }
    }

    if (Object.keys(patch).length) {
      patches[r.id] = { ...rec, ...patch, updatedAt: new Date().toISOString() };
      applied++;
    }
  }
  return { patches, applied, skipped, matched };
}

/** The next follow-up date for someone partway through your cadence. */
export function nextCadenceDate(step: number, settings: Settings, today = todayISO()): string {
  const { steps, enabled } = settings.cadence;
  if (!enabled || step >= steps.length) return "";
  return addDays(today, steps[step]);
}
