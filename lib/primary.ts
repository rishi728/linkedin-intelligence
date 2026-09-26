// The twelve categories people are sorted into for discovery.
//
// The classifier underneath works across a much wider vocabulary, because a nurse
// is not an engineer and pretending otherwise would be worse than saying nothing.
// This module is the discovery surface on top of it: the twelve buckets people
// actually search by, derived from the function the classifier already worked out.
//
// Anyone whose real function has no honest home among the twelve keeps their
// detailed label instead of being forced into a bucket that is not true.

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

/** Function to primary. Functions absent here have no honest mapping. */
const FROM_FUNCTION: Record<string, PrimaryId> = {
  "software-engineering": "software",
  "quality-testing": "software",
  "cloud-devops": "software",
  "developer-relations": "software",
  "enterprise-apps": "software",

  "core-engineering": "core_engineering",
  "hardware-semiconductors": "core_engineering",
  manufacturing: "core_engineering",

  sales: "sales",
  "business-development": "sales",
  "account-management": "sales",
  presales: "sales",
  "revops-gtm": "sales",

  founders: "founders",
  "management-consulting": "consulting",

  "data-engineering": "data",
  analytics: "data",
  "machine-learning": "ai",

  "product-management": "product",
  "product-operations": "product",

  accounting: "finance",
  "corporate-finance": "finance",
  banking: "finance",
  "investment-banking": "finance",
  quant: "finance",
  investing: "finance",
  "risk-insurance": "finance",

  "academic-research": "research",
  sciences: "research",

  faculty: "education",
  mentoring: "education",
  training: "education",

  "talent-acquisition": "recruiters",
};

/**
 * Data scientists sit on the line, so the title decides rather than the function:
 * an applied scientist is doing AI work, a BI-focused one is doing data work.
 */
const AI_TITLE =
  /\b(a\.?i\.?|ml|mle|mlops|machine\s*learning|deep\s*learning|neural|nlp|natural\s+language|computer\s+vision|llm|genai|generative|applied\s+scientist|prompt|reinforcement\s+learning)\b/i;

export function primaryOf(fn: string, title: string, isFounder = false): PrimaryId | null {
  if (isFounder) return "founders";
  if (fn === "data-science") return AI_TITLE.test(title) ? "ai" : "data";
  return FROM_FUNCTION[fn] ?? null;
}
