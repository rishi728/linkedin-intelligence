// The ten professional categories, and nothing else.
//
// Ported from the V5 Python classifier. Every connection with a company or a
// position gets exactly one of these; a row with neither gets the eleventh,
// which is a statement about the export rather than about the person.

export const TECH = "Technology & Engineering";
export const FOUND = "Founders & Leadership";
export const EDU = "Education, Research & Science";
export const FIN = "Finance & Investment";
export const BIZ = "Business & Consulting";
export const DATA = "Data & AI";
export const PROD = "Product & Design";
export const STUD = "Student & Community";
export const SALES = "Sales & Marketing";
export const OPS = "Operations & Supply Chain";
export const NOPRO = "No Professional Information";

export const CATS = [TECH, FOUND, EDU, FIN, BIZ, DATA, PROD, STUD, SALES, OPS] as const;
export type Category = (typeof CATS)[number] | typeof NOPRO;

/** Cluster k corresponds to CAT_ORDER[k]; the seeded centroids follow this order. */
export const CAT_ORDER = [TECH, FOUND, EDU, FIN, BIZ, DATA, PROD, STUD, SALES, OPS] as const;

/** Stable ids for filters and stored settings, so a renamed label cannot break saved state. */
export const CATEGORY_ID: Record<string, string> = {
  [TECH]: "tech",
  [FOUND]: "founders",
  [EDU]: "education",
  [FIN]: "finance",
  [BIZ]: "business",
  [DATA]: "data",
  [PROD]: "product",
  [STUD]: "student",
  [SALES]: "sales",
  [OPS]: "operations",
  [NOPRO]: "none",
};

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  Object.entries(CATEGORY_ID).map(([label, id]) => [id, label as Category]),
);

export const CATEGORY_IDS = CATS.map((c) => CATEGORY_ID[c]);

export function categoryLabel(id: string): string {
  return CATEGORY_BY_ID[id] ?? NOPRO;
}

/** Low under 0.6, Medium under 0.8, High above. */
export type Band = "Low" | "Medium" | "High";

export function bandOf(confidence: number): Band {
  return confidence < 0.6 ? "Low" : confidence < 0.8 ? "Medium" : "High";
}
