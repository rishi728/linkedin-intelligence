// The twelve categories people are sorted into for discovery.
//
// The classifier underneath works across a much wider taxonomy, because a nurse
// is not an engineer and pretending otherwise would be worse than saying nothing.
// This module is the discovery surface on top of it: the twelve buckets people
// actually search by, mapped from the detailed category the classifier produced.
//
// Anyone whose real category has no honest home among the twelve keeps their
// detailed label instead of being forced into a bucket that is not true.

import type { CategoryId } from "./taxonomy";

export const PRIMARY_IDS = [
  "software", "core_engineering", "sales", "founders", "consulting", "data",
  "ai", "product", "finance", "research", "education", "recruiters",
] as const;

export type PrimaryId = (typeof PRIMARY_IDS)[number];

export const PRIMARY_LABEL: Record<PrimaryId, string> = {
  software: "Software Engineering",
  core_engineering: "Core Engineering",
  sales: "Sales",
  founders: "Founders",
  consulting: "Consulting",
  data: "Data",
  ai: "AI",
  product: "Product",
  finance: "Finance",
  research: "Research",
  education: "Education",
  recruiters: "Recruiters",
};

/** Detailed category to primary. Categories absent here have no honest mapping. */
const FROM_CATEGORY: Partial<Record<CategoryId, PrimaryId>> = {
  software: "software",
  engineering: "core_engineering",
  sales: "sales",
  founders: "founders",
  consulting: "consulting",
  product: "product",
  finance: "finance",
  research: "research",
  education: "education",
  recruiting: "recruiters",
};

/** Splits the data/AI category, which the taxonomy keeps together, by the title. */
const AI_TITLE =
  /\b(a\.?i\.?|ml|mle|mlops|machine\s*learning|deep\s*learning|neural|nlp|natural\s+language|computer\s+vision|llm|genai|generative|applied\s+scientist|prompt|reinforcement\s+learning)\b/i;

export function primaryOf(domain: string, title: string): PrimaryId | null {
  if (domain === "data_ai") return AI_TITLE.test(title) ? "ai" : "data";
  return FROM_CATEGORY[domain as CategoryId] ?? null;
}
