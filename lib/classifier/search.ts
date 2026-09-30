// Reading a search box against the ten categories and their role families.
//
// The same vocabulary the classifier uses, so search can never offer a category
// the rest of the product does not have.

import { CATEGORY_ID, CATS } from "./categories";
import { RULES } from "./rules";
import { norm } from "./stage1";

export interface TextMatch {
  categories: string[];
  roleFamilies: string[];
  understood: string[];
  /** The query with the recognised phrases removed. */
  rest: string;
}

/** Every role family the rules can produce, with the category it belongs to. */
export const ROLE_FAMILIES: Array<{ family: string; category: string }> = (() => {
  const seen = new Map<string, string>();
  for (const rule of RULES) if (!seen.has(rule.fam)) seen.set(rule.fam, rule.cat);
  return [...seen.entries()].map(([family, category]) => ({ family, category }));
})();

export function familiesOf(category: string): string[] {
  return ROLE_FAMILIES.filter((f) => f.category === category).map((f) => f.family);
}

/** Words people type for a category, beyond its own label. */
const ALIASES: Array<[string, string]> = [
  ["engineers", "Technology & Engineering"],
  ["engineering", "Technology & Engineering"],
  ["technology", "Technology & Engineering"],
  ["tech", "Technology & Engineering"],
  ["developers", "Technology & Engineering"],
  ["founders", "Founders & Leadership"],
  ["leadership", "Founders & Leadership"],
  ["entrepreneurs", "Founders & Leadership"],
  ["academics", "Education, Research & Science"],
  ["researchers", "Education, Research & Science"],
  ["research", "Education, Research & Science"],
  ["education", "Education, Research & Science"],
  ["professors", "Education, Research & Science"],
  ["scientists", "Education, Research & Science"],
  ["finance", "Finance & Investment"],
  ["investment", "Finance & Investment"],
  ["investors", "Finance & Investment"],
  ["bankers", "Finance & Investment"],
  ["consulting", "Business & Consulting"],
  ["consultants", "Business & Consulting"],
  ["business", "Business & Consulting"],
  ["recruiters", "Business & Consulting"],
  ["hr", "Business & Consulting"],
  ["data", "Data & AI"],
  ["ai", "Data & AI"],
  ["analytics", "Data & AI"],
  ["data scientists", "Data & AI"],
  ["product", "Product & Design"],
  ["design", "Product & Design"],
  ["designers", "Product & Design"],
  ["product managers", "Product & Design"],
  ["students", "Student & Community"],
  ["community", "Student & Community"],
  ["sales", "Sales & Marketing"],
  ["marketing", "Sales & Marketing"],
  ["operations", "Operations & Supply Chain"],
  ["supply chain", "Operations & Supply Chain"],
  ["logistics", "Operations & Supply Chain"],
];

/** Longest phrase first, so "supply chain" is not read as two separate words. */
const PHRASES: Array<[string, string]> = [
  ...CATS.map((c) => [norm(c), c] as [string, string]),
  ...CATS.flatMap((c) => c.split(" & ").map((part) => [norm(part), c] as [string, string])),
  ...ALIASES.map(([a, c]) => [norm(a), c] as [string, string]),
].sort((a, b) => b[0].length - a[0].length);

/** The ways people actually type the busiest families. */
const FAMILY_ALIASES: Array<[string, string]> = [
  ["product manager", "Product Management"],
  ["product management", "Product Management"],
  ["pm", "Product Management"],
  ["software engineer", "Software Engineering"],
  ["developer", "Software Engineering"],
  ["data scientist", "Data Science & Analytics"],
  ["data analyst", "Data Science & Analytics"],
  ["ml engineer", "AI / ML"],
  ["machine learning", "AI / ML"],
  ["recruiter", "Recruiting / HR"],
  ["talent acquisition", "Recruiting / HR"],
  ["consultant", "Consulting / Strategy"],
  ["strategy", "Consulting / Strategy"],
  ["supply chain", "Operations / Supply Chain"],
  ["mechanical engineer", "Core Engineering"],
  ["civil engineer", "Core Engineering"],
  ["ux designer", "Design / UX"],
  ["designer", "Design / UX"],
  ["lawyer", "Legal / Policy"],
  ["professor", "Education / Research"],
  ["researcher", "Education / Research"],
];

const FAMILY_PHRASES: Array<[string, string, string]> = [
  ...ROLE_FAMILIES.map((f) => [norm(f.family), f.family, f.category] as [string, string, string]),
  ...FAMILY_ALIASES.flatMap(([alias, family]) => {
    const entry = ROLE_FAMILIES.find((f) => f.family === family);
    return entry ? [[norm(alias), family, entry.category] as [string, string, string]] : [];
  }),
].sort((a, b) => b[0].length - a[0].length);

export function matchCategoriesInText(text: string): TextMatch {
  let rest = ` ${norm(text)} `;
  const categories: string[] = [];
  const roleFamilies: string[] = [];
  const understood: string[] = [];

  const take = (phrase: string) => {
    for (const candidate of [` ${phrase} `, ` ${phrase}s `]) {
      if (rest.includes(candidate)) {
        rest = rest.replace(candidate, " ");
        return true;
      }
    }
    return false;
  };

  for (const [phrase, family, category] of FAMILY_PHRASES) {
    if (roleFamilies.length) break;
    if (!take(phrase)) continue;
    roleFamilies.push(family);
    understood.push(family);
    void category;
  }

  if (!roleFamilies.length) {
    for (const [phrase, category] of PHRASES) {
      if (categories.includes(CATEGORY_ID[category])) continue;
      if (!take(phrase)) continue;
      categories.push(CATEGORY_ID[category]);
      understood.push(category);
      if (categories.length >= 2) break;
    }
  }

  return { categories, roleFamilies, understood, rest: rest.trim() };
}
