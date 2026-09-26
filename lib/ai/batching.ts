// Deciding who actually needs a model, and packing them efficiently.
//
// Three reductions happen before anything is sent, and together they are what
// keeps a ten-thousand-connection network inside seven requests:
//
//   1. Anyone the repository already placed confidently never leaves the device.
//   2. Everyone sharing a title and employer collapses to one fingerprint.
//   3. Employers are spelled once per batch and referenced by index.

import { classify, normaliseTitle } from "../knowledge/classify";
import { companyKey } from "../analyzer";
import type { Person } from "../workspace/types";
import type { CompactProfile } from "./types";

/**
 * A safe request size in characters. Roughly four characters to a token, so this
 * is about 24k tokens of payload, which leaves ample room for the instructions
 * and the response inside a 128k context.
 */
export const SAFE_BATCH_CHARS = 96_000;

/**
 * The reply is the real constraint, not the request. Every profile sent needs a
 * row back, and a model that will read 100k characters will still only write a
 * few thousand tokens before it is cut off. At roughly 18 tokens a row this
 * keeps a reply inside about 4k tokens, which every model can manage.
 */
export const MAX_PROFILES_PER_BATCH = 200;

export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

/**
 * What makes two people the same classification problem. Connections exports
 * carry a title and an employer and nothing else, so that is the whole of it.
 */
export function fingerprintOf(person: Pick<Person, "position" | "company">): string {
  return `${normaliseTitle(person.position)}\u0000${companyKey(person.company)}`;
}

export interface PendingGroup {
  fingerprint: string;
  title: string;
  company: string;
  /** Everyone this one answer will be applied to. */
  personIds: string[];
}

/**
 * Splits the network into what the repository already answered and what is worth
 * asking about. A person is only a question when the repository could not place
 * them, or placed them without confidence, and their title actually says
 * something: a bare "Executive Member" is not a puzzle a model can solve either.
 */
export function buildPendingQueue(people: Person[]): { pending: PendingGroup[]; resolved: number; hopeless: number } {
  const groups = new Map<string, PendingGroup>();
  let resolved = 0;
  let hopeless = 0;

  for (const p of people) {
    // A confident repository answer is final; the model never sees it.
    if (p.bucket && p.certainty === "high") {
      resolved++;
      continue;
    }
    // Manual corrections and taught rules outrank everything, including the model.
    if (p.classSource !== "repository") {
      resolved++;
      continue;
    }
    const title = normaliseTitle(p.position);
    if (!title || title.split(" ").filter(Boolean).length === 0) {
      hopeless++;
      continue;
    }

    const fingerprint = fingerprintOf(p);
    const group = groups.get(fingerprint);
    if (group) group.personIds.push(p.id);
    else groups.set(fingerprint, { fingerprint, title: p.position.trim(), company: p.company.trim(), personIds: [p.id] });
  }

  // Busiest first: if the budget runs out, the most people have been covered.
  const pending = [...groups.values()].sort((a, b) => b.personIds.length - a.personIds.length);
  return { pending, resolved, hopeless };
}

export interface Batch {
  profiles: CompactProfile[];
  /** Employer names, referenced by index from the profiles. */
  companies: string[];
  chars: number;
  /** How many real people this batch decides for. */
  covers: number;
}

const MAX_TITLE_CHARS = 120;

/**
 * Packs groups into the fewest batches that stay under the size threshold, and
 * never more than `maxBatches`. A profile is never split across requests; if the
 * batches run out, the rest simply go unasked and are reported as unresolved.
 */
export function buildBatches(pending: PendingGroup[], maxBatches: number): { batches: Batch[]; skipped: PendingGroup[] } {
  if (maxBatches <= 0) return { batches: [], skipped: pending };

  const batches: Batch[] = [];
  let current: Batch = { profiles: [], companies: [], chars: 0, covers: 0 };
  const companyIndex = new Map<string, number>();

  const start = () => {
    current = { profiles: [], companies: [], chars: 0, covers: 0 };
    companyIndex.clear();
  };

  const skipped: PendingGroup[] = [];

  for (const g of pending) {
    if (batches.length >= maxBatches && current.profiles.length === 0) {
      skipped.push(g);
      continue;
    }

    if (current.profiles.length >= MAX_PROFILES_PER_BATCH) {
      batches.push(current);
      if (batches.length >= maxBatches) {
        skipped.push(g);
        start();
        continue;
      }
      start();
    }

    const title = g.title.slice(0, MAX_TITLE_CHARS);
    let c = companyIndex.get(g.company);
    let addedChars = title.length + g.fingerprint.length + 24;
    if (g.company && c === undefined) addedChars += g.company.length + 4;

    if (current.chars + addedChars > SAFE_BATCH_CHARS && current.profiles.length > 0) {
      batches.push(current);
      if (batches.length >= maxBatches) {
        skipped.push(g);
        start();
        // Everything left over is skipped too, and honestly reported.
        continue;
      }
      start();
      c = undefined;
      addedChars = title.length + g.fingerprint.length + 24 + (g.company ? g.company.length + 4 : 0);
    }

    if (g.company && c === undefined) {
      c = current.companies.length;
      current.companies.push(g.company);
      companyIndex.set(g.company, c);
    }

    current.profiles.push({ id: g.fingerprint, title, ...(c === undefined ? {} : { c }) });
    current.chars += addedChars;
    current.covers += g.personIds.length;
  }

  if (current.profiles.length && batches.length < maxBatches) batches.push(current);
  else if (current.profiles.length) skipped.push(...pending.slice(-current.profiles.length));

  return { batches, skipped };
}

/**
 * The role buckets worth offering for one title, narrowed by what the repository
 * already suspects. Sending seventeen options when three are plausible wastes
 * tokens and invites a worse answer.
 */
export function candidateBuckets(title: string, company: string, allBuckets: string[]): string[] {
  const guess = classify({ title, company });
  if (!guess.bucketId) return allBuckets;
  // The repository's own reading, plus everything else, so it can still disagree.
  return [guess.bucketId, ...allBuckets.filter((b) => b !== guess.bucketId)];
}
