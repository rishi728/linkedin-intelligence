// The run itself: at most seven classification requests, one reconciliation,
// one personalisation, and never a tenth request under any circumstances.
//
// The repository does the classifying. The model is a semantic reasoning layer
// asked only about what the repository could not place, and its answers are
// validated against the repository before any of them are stored.

import { ROLE_BUCKETS, bucketLabel, roleLabel, sectionLabel } from "../knowledge/roles";
import { SECTOR_IDS, SECTOR_LABEL } from "../knowledge/sectors";
import type { Person, Settings } from "../workspace/types";
import { buildBatches, buildPendingQueue, type Batch, type PendingGroup } from "./batching";
import { RunBudget } from "./budget";
import { ProviderError, chatJson } from "./provider";
import {
  MAX_OPENROUTER_REQUESTS_PER_RUN,
  type AiClassification,
  type AiSettings,
  type Correction,
  type NetworkIntelligence,
  type RunMode,
  type RunStats,
} from "./types";
import { validateCompactRows, validateCorrections, validateInsights } from "./validate";

/** Fingerprint to its validated answer, kept across runs and imports. */
export type AiCache = Record<string, AiClassification>;

export interface RunInput {
  people: Person[];
  settings: Settings;
  ai: AiSettings;
  cache: AiCache;
  mode: RunMode;
  /** Only these people are considered, for an incremental run or one profile. */
  only?: Set<string>;
}

export interface RunResult {
  stats: RunStats;
  /** Fingerprint to classification, ready to merge into the cache. */
  classifications: AiCache;
  /** Person id to classification, which is what the workspace applies. */
  byPerson: Record<string, AiClassification>;
  intelligence: NetworkIntelligence | null;
  corrections: Correction[];
}

// --- prompts ---------------------------------------------------------------
//
// The taxonomy is sent as compact ids once per request, never the whole
// repository, and never repeated per person.

function taxonomyBlock(): string {
  const roles = ROLE_BUCKETS.map((b) => {
    const sections = b.sections.map((s) => `${s.id}[${s.roles.map((r) => r.id).join(",")}]`).join(" ");
    return `${b.id}: ${sections}`;
  }).join("\n");
  const sectors = SECTOR_IDS.map((id) => `${id}=${SECTOR_LABEL[id]}`).join(", ");
  return `ROLE TAXONOMY (bucket: section[role,role,...])\n${roles}\n\nSECTORS\n${sectors}`;
}

const CLASSIFY_SYSTEM = `You match job titles to role ids from a fixed list.

Rules, in order of importance:
1. Only ever answer with a role id that appears in the list below. Never invent one.
2. Classify by the occupation, not by a word borrowed from another field. "Technical Recruiter" is recruitment, not engineering. "AI Product Manager" is product management. "Founder's Office" is a business role, not founding a company. "Sales Engineer" is sales.
3. Words describing how senior somebody is never decide the occupation.
4. If a title names no occupation at all, leave that profile out entirely rather than guessing.
5. Confidence is a probability between 0.01 and 0.99. Never 1.
6. The optional sector id describes the employer, not the person. Leave it out unless you recognise the employer.

Reply with JSON only, one compact row per profile you can place:
{"r":[[i,"role-id",confidence,"sector-id"],[i,"role-id",confidence]]}
i is the profile's index exactly as given. Return nothing else: no prose, no explanation.`;

const RECONCILE_SYSTEM = `You are checking one set of classifications for internal consistency.

You are NOT reclassifying anybody from scratch. Report only genuine problems:
- the same title classified differently in different places
- a role and sector combination that contradicts itself
- a value that is not in the taxonomy
- a confidence that is obviously wrong given the evidence

Only use ids from the taxonomy. Return at most 40 corrections, highest confidence first.
Reply with JSON only: {"corrections":[{"id","field","from","to","reason","confidence"}]}
field is one of role_bucket, role_section, detailed_role, sector.`;

const PERSONALIZE_SYSTEM = `You summarise what somebody's professional network contains, for that person specifically.

You are given counts, not people. Every claim you make must follow from the counts you were given.
Do not invent companies, people, or numbers. Do not give career advice.
Write plainly. No marketing language, no exclamation marks, no em dashes.

Reply with JSON only: {"insights":[{"headline","detail","bucket","sector"}],"gaps":["..."]}
headline is under 9 words. detail is one or two sentences citing the numbers.
bucket and sector are optional and must be ids from the taxonomy.
Return 3 to 6 insights and up to 3 gaps.`;

// --- one request, retried at most once, always inside the budget -----------

type Attempt = { ok: true; payload: unknown } | { ok: false; reason: string };

/** What went wrong, in words the user can act on. */
function explain(err: unknown): string {
  if (!(err instanceof ProviderError)) return `The request failed: ${String(err)}`;
  switch (err.kind) {
    case "auth":
      return "OpenRouter rejected the key. Check it in Settings, and that the account has credit.";
    case "no-key":
      return "No OpenRouter key is set. Add one in Settings.";
    case "rate-limit":
      return "OpenRouter rate limited the request. Wait a moment and run it again.";
    case "timeout":
      return "The request timed out before the model answered.";
    case "malformed":
      return "The model's reply was not usable JSON.";
    default:
      return err.message;
  }
}

async function askOnce(
  ai: AiSettings,
  budget: RunBudget,
  kind: "classify" | "reconcile" | "personalize",
  system: string,
  user: string,
  maxTokens: number,
): Promise<Attempt> {
  let reason = "The request budget was already spent.";
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!budget.canSpend(kind)) return { ok: false, reason };
    budget.spend(kind);
    try {
      return { ok: true, payload: await chatJson(ai, { system, user, maxTokens }) };
    } catch (err) {
      budget.recordFailure();
      reason = explain(err);
      const retryable = err instanceof ProviderError ? err.retryable : false;
      // A retry costs a request like any other, so it only happens when one is
      // both plausibly useful and actually affordable.
      if (!retryable || attempt === 1 || !budget.canSpend(kind)) return { ok: false, reason };
    }
  }
  return { ok: false, reason };
}

// --- the run ---------------------------------------------------------------

export async function runNetworkIntelligence(input: RunInput): Promise<RunResult> {
  const startedAt = new Date().toISOString();
  const budget = new RunBudget(`run_${Date.now().toString(36)}`);

  const scope = input.only ? input.people.filter((p) => input.only!.has(p.id)) : input.people;
  const { pending, resolved, hopeless } = buildPendingQueue(scope);

  // 1. The cache answers everything it has seen before, for free.
  const byPerson: Record<string, AiClassification> = {};
  const classifications: AiCache = {};
  const unanswered: PendingGroup[] = [];
  let cacheHits = 0;

  const groupById = new Map(pending.map((g) => [g.fingerprint, g]));

  for (const g of pending) {
    const hit = input.cache[g.fingerprint];
    if (hit) {
      cacheHits += g.personIds.length;
      for (const id of g.personIds) byPerson[id] = hit;
    } else {
      unanswered.push(g);
    }
  }

  // 2. Whatever is left is packed into as few requests as it needs.
  const { batches, skipped } = buildBatches(unanswered, Math.min(budget.classificationsRemaining(), 7));
  let stoppedBecause: string | undefined;
  if (skipped.length) {
    stoppedBecause = `${skipped.length.toLocaleString()} title patterns did not fit in the request budget and were left as they are.`;
  }

  const taxonomy = taxonomyBlock();

  let fatal: string | null = null;

  for (const batch of batches) {
    const sources = batch.profiles.map((p) => {
      const g = groupById.get(p.id);
      return { fingerprint: p.id, title: g?.title ?? p.title, company: g?.company ?? "" };
    });

    const attempt = await askOnce(
      input.ai,
      budget,
      "classify",
      `${CLASSIFY_SYSTEM}\n\n${taxonomy}`,
      buildBatchPrompt(batch),
      // Room for one compact row per profile, with slack for formatting.
      Math.min(16000, 400 + batch.profiles.length * 30),
    );

    if (!attempt.ok) {
      // A key or model problem will fail identically every time, so the run
      // stops rather than spending the rest of the budget proving it.
      fatal = attempt.reason;
      break;
    }

    const rows = (attempt.payload as { r?: unknown; results?: unknown }).r
      ?? (attempt.payload as { results?: unknown }).results
      ?? attempt.payload;
    const { accepted } = validateCompactRows(rows, sources);
    for (const c of accepted) {
      classifications[c.fingerprint] = c;
      for (const id of groupById.get(c.fingerprint)?.personIds ?? []) byPerson[id] = c;
    }
  }

  if (fatal) stoppedBecause = fatal;

  // 3. One consistency pass over everything decided this run.
  let corrections: Correction[] = [];
  const decided = Object.values(classifications);
  if (!fatal && decided.length > 1 && budget.canSpend("reconcile")) {
    const attempt = await askOnce(
      input.ai,
      budget,
      "reconcile",
      `${RECONCILE_SYSTEM}\n\n${taxonomy}`,
      buildReconcilePrompt(decided, groupById),
      6000,
    );
    if (attempt.ok) {
      corrections = validateCorrections((attempt.payload as { corrections?: unknown }).corrections ?? attempt.payload);
      applyCorrections(corrections, classifications, byPerson, groupById);
    }
  }

  // 4. One pass over the shape of the whole network, for this user.
  let intelligence: NetworkIntelligence | null = null;
  if (!fatal && budget.canSpend("personalize")) {
    const attempt = await askOnce(
      input.ai,
      budget,
      "personalize",
      `${PERSONALIZE_SYSTEM}\n\n${taxonomy}`,
      buildPersonalizePrompt(input.people, input.settings, byPerson),
      3000,
    );
    if (attempt.ok) {
      const p = attempt.payload as { insights?: unknown; gaps?: unknown };
      intelligence = {
        insights: validateInsights(p.insights),
        gaps: Array.isArray(p.gaps) ? p.gaps.filter((g): g is string => typeof g === "string").slice(0, 3) : [],
      };
    }
  }

  const aiCount = Object.keys(byPerson).length;
  const confidences = Object.values(byPerson).map((c) => c.roleConfidence);
  const completedAt = new Date().toISOString();

  return {
    stats: {
      runId: budget.runId,
      mode: input.mode,
      startedAt,
      completedAt,
      connectionsTotal: scope.length,
      deterministicClassifications: resolved,
      aiClassifications: aiCount,
      unresolvedCount: Math.max(0, scope.length - resolved - aiCount),
      requestsUsed: budget.requestsUsed,
      requestsFailed: budget.requestsFailed,
      cacheHits,
      batchCount: budget.batchCount,
      averageConfidence: confidences.length
        ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100) / 100
        : 0,
      lowConfidenceCount: confidences.filter((c) => c < 0.6).length + hopeless,
      ...(stoppedBecause ? { stoppedBecause } : {}),
    },
    classifications,
    byPerson,
    intelligence,
    corrections,
  };
}

// --- prompt bodies ---------------------------------------------------------

function buildBatchPrompt(batch: Batch): string {
  const companies = batch.companies.length
    ? "COMPANIES\n" + batch.companies.map((n, i) => "c" + i + "=" + n).join("\n") + "\n\n"
    : "";
  // "index|title|company-ref" is the smallest form that still carries an
  // employer, and the index is what comes back rather than a long fingerprint.
  const rows = batch.profiles
    .map((p, i) => i + "|" + p.title + (p.c === undefined ? "" : "|c" + p.c))
    .join("\n");
  return companies + "PROFILES (index|title|company)\n" + rows;
}

function buildReconcilePrompt(decided: AiClassification[], groups: Map<string, PendingGroup>): string {
  const rows = decided
    .slice(0, 400)
    .map((c) => {
      const g = groups.get(c.fingerprint);
      return JSON.stringify({
        id: c.fingerprint,
        title: g?.title ?? "",
        company: g?.company ?? "",
        role_bucket: c.bucket,
        role_section: c.section,
        detailed_role: c.roleId,
        sector: c.sector ?? "",
        role_confidence: c.roleConfidence,
        people: g?.personIds.length ?? 1,
      });
    })
    .join("\n");
  return `CLASSIFICATIONS FROM THIS RUN (one per line)\n${rows}`;
}

function buildPersonalizePrompt(
  people: Person[],
  settings: Settings,
  byPerson: Record<string, AiClassification>,
): string {
  const buckets = new Map<string, number>();
  const sectors = new Map<string, number>();
  const companies = new Map<string, number>();

  for (const p of people) {
    const ai = byPerson[p.id];
    const bucket = ai?.bucket ?? p.bucket;
    const sector = ai?.sector ?? p.sector;
    if (bucket) buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    if (sector) sectors.set(sector, (sectors.get(sector) ?? 0) + 1);
    if (p.company) companies.set(p.company, (companies.get(p.company) ?? 0) + 1);
  }

  const top = (m: Map<string, number>, n: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}=${v}`).join(", ");

  const contacted = people.filter((p) => p.status !== "not_contacted").length;
  const replied = people.filter((p) => p.history?.theyReplied).length;

  return [
    `USER`,
    `background: ${settings.profile.background || "not stated"}`,
    `schools: ${settings.profile.schools.join(", ") || "none"}`,
    `looking for: ${(settings.focus?.goals ?? []).join(", ") || "not stated"}`,
    `specific focus: ${settings.focus?.direction || "none"}`,
    `target role areas: ${settings.goals.buckets.map(bucketLabel).join(", ") || "none"}`,
    `target companies: ${settings.targetCompanies.slice(0, 15).join(", ") || "none"}`,
    ``,
    `NETWORK (${people.length} connections)`,
    `role buckets: ${top(buckets, 12)}`,
    `sectors: ${top(sectors, 10)}`,
    `largest employers: ${top(companies, 12)}`,
    `already contacted: ${contacted}`,
    `have replied: ${replied}`,
    `unclassified titles: ${people.filter((p) => !p.bucket && !byPerson[p.id]).length}`,
  ].join("\n");
}

// --- corrections -----------------------------------------------------------

function applyCorrections(
  corrections: Correction[],
  classifications: AiCache,
  byPerson: Record<string, AiClassification>,
  groups: Map<string, PendingGroup>,
): void {
  for (const c of corrections) {
    const current = classifications[c.id];
    if (!current) continue;

    let next: AiClassification | null = null;
    if (c.field === "sector") {
      next = { ...current, sector: c.to as AiClassification["sector"] };
    } else {
      // A role correction has to land on a whole valid path, so it is rebuilt
      // and rechecked rather than patched field by field.
      const bucket = c.field === "role_bucket" ? c.to : current.bucket;
      const section = c.field === "role_section" ? c.to : current.section;
      const roleId = c.field === "detailed_role" ? c.to : current.roleId;
      const b = ROLE_BUCKETS.find((x) => x.id === bucket);
      const s = b?.sections.find((x) => x.id === section);
      const r = s?.roles.find((x) => x.id === roleId);
      if (b && s && r) next = { ...current, bucket: b.id, section: s.id, roleId: r.id };
    }
    if (!next) continue;

    classifications[c.id] = next;
    for (const id of groups.get(c.id)?.personIds ?? []) byPerson[id] = next;
  }
}

export { MAX_OPENROUTER_REQUESTS_PER_RUN, bucketLabel, roleLabel, sectionLabel };
