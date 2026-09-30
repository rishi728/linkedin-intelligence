// Corrections the user makes, and the rules those corrections teach.
//
// The classifier decides first; a rule the user taught overrides it, and a
// correction made to one person overrides both. Nothing else can change a
// classification, which is what keeps the same title at the same employer
// giving the same answer.

import { CATEGORY_BY_ID, NOPRO, bandOf } from "./categories";
import type { ClassifiedPair } from "./run";
import { norm } from "./stage1";

export interface RoleHierarchy {
  /** A category id, as stored in settings. */
  category: string;
  roleFamily: string;
}

export interface CustomRule {
  id: string;
  /** "exact": the whole title must match; "contains": the phrase appears in it. */
  match: "exact" | "contains";
  /** Normalised title tokens joined by spaces (see `titleKey`). */
  pattern: string;
  /** The title as the user saw it when they made the correction. */
  example: string;
  set: Partial<RoleHierarchy>;
  createdAt: string;
}

export type ClassificationSource = "classifier" | "rule" | "manual";

export interface ResolvedClassification extends ClassifiedPair {
  source: ClassificationSource;
  ruleId?: string;
}

/** Normalised title, used as the key a rule matches on. */
export function titleKey(title: string): string {
  return norm(title).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function apply(c: ResolvedClassification, set: Partial<RoleHierarchy>): ResolvedClassification {
  const category = set.category ? (CATEGORY_BY_ID[set.category] ?? c.category) : c.category;
  return { ...c, category, roleFamily: set.roleFamily ?? c.roleFamily };
}

export function resolveClassification(
  auto: ClassifiedPair,
  position: string,
  rules: CustomRule[],
  manual?: Partial<RoleHierarchy> | null,
): ResolvedClassification {
  let out: ResolvedClassification = { ...auto, source: "classifier" };

  // An empty row is a fact about the export, not a classification to argue with.
  if (auto.category === NOPRO) return out;

  if (rules.length) {
    const key = titleKey(position);
    const padded = ` ${key} `;
    const rule =
      rules.find((x) => x.match === "exact" && x.pattern === key) ??
      rules.find((x) => x.match === "contains" && x.pattern && padded.includes(` ${x.pattern} `));
    if (rule) {
      out = {
        ...apply(out, rule.set),
        confidence: 0.95,
        band: bandOf(0.95),
        needsReview: false,
        conflict: false,
        source: "rule",
        ruleId: rule.id,
        method: `Your rule for "${rule.example}"`,
      };
    }
  }

  if (manual && Object.keys(manual).length) {
    out = {
      ...apply(out, manual),
      confidence: 0.97,
      band: bandOf(0.97),
      needsReview: false,
      conflict: false,
      source: "manual",
      method: "Set by you",
    };
  }

  return out;
}
