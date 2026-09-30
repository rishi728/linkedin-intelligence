// Stage one: what the title itself says.
//
// Ported from classify_v5.stage1. Rules add weight to categories, a club or
// campus employer re-reads leadership words as student roles, and the company
// type breaks a tie but never overrides a title that carries a function.

import { CATS, FOUND, NOPRO, STUD } from "./categories";
import {
  ACADEMIC_STAFF_RX,
  CAMPUS_ROLE_RX,
  CLUB_RX,
  COMPANY_RULES,
  GENERIC_FAMILY,
  RULES,
  SENIORITY,
} from "./rules";

export function norm(s: string | null | undefined): string {
  if (typeof s !== "string") return "";
  return s
    .replace(/&/g, " & ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export interface CompanyContext {
  cat: string | null;
  name: string | null;
}

export function companyContext(company: string): CompanyContext {
  const c = norm(company);
  if (!c) return { cat: null, name: null };
  for (const rule of COMPANY_RULES) {
    if (rule.rx.test(c)) return { cat: rule.cat, name: rule.name };
  }
  return { cat: null, name: null };
}

export function isClub(company: string): boolean {
  const c = norm(company);
  return c ? CLUB_RX.test(c) : false;
}

/** The title with level words removed, which is what the model compares on. */
export function roleText(position: string): string {
  const tokens = norm(position).match(/[a-z][a-z0-9+#]*/g) ?? [];
  return tokens.filter((t) => !SENIORITY.has(t)).join(" ");
}

export function titleScores(title: string): { scores: Record<string, number>; fam: Record<string, string | null> } {
  const scores: Record<string, number> = {};
  const fam: Record<string, string | null> = {};
  for (const cat of CATS) {
    scores[cat] = 0;
    fam[cat] = null;
  }
  for (const rule of RULES) {
    if (!rule.rx.test(title)) continue;
    scores[rule.cat] += rule.w;
    if (fam[rule.cat] === null || rule.w >= 3) fam[rule.cat] = rule.fam;
  }
  return { scores, fam };
}

export interface Stage1 {
  cat: string | null;
  fam: string;
  titleTop: number;
  margin: number;
  ccat: string | null;
  cname: string | null;
  second: string | null;
  resolved: boolean;
}

export function stage1(positionRaw: string, companyRaw: string): Stage1 {
  // "Manager_Operations" is one title, not one word.
  const pos = norm(positionRaw.replace(/_/g, " "));
  const comp = norm(companyRaw);

  if (!pos && !comp) {
    return { cat: NOPRO, fam: NOPRO, titleTop: 0, margin: 0, ccat: null, cname: null, second: null, resolved: true };
  }

  const club = isClub(companyRaw);
  const { cat: ccat, name: cname } = companyContext(companyRaw);

  // Multi-role titles: the first role is the job, the rest count 60%.
  const segs = pos.split(/\s*\|\s*|;|\s{2,}/).map((x) => x.trim()).filter(Boolean);
  const parts = segs.length ? segs : [pos];

  const scores: Record<string, number> = {};
  const fam: Record<string, string | null> = {};
  for (const cat of CATS) {
    scores[cat] = 0;
    fam[cat] = null;
  }

  parts.forEach((seg, i) => {
    const { scores: sc, fam: fm } = titleScores(seg);
    const wt = i === 0 ? 1.0 : 0.6;
    for (const cat of CATS) {
      scores[cat] += sc[cat] * wt;
      if (fm[cat] && (fam[cat] === null || sc[cat] >= 3)) fam[cat] = fm[cat];
    }
  });

  const strongOther = Math.max(0, ...CATS.filter((c) => c !== FOUND && c !== STUD).map((c) => scores[c]));

  if (club && strongOther < 4 && scores[FOUND] < 5) {
    // A president of a club is a student; a co-founder is still a founder.
    scores[STUD] += 4;
    scores[FOUND] = Math.min(scores[FOUND], 1);
    fam[STUD] = "Student / Community";
  } else if (
    ccat === "Education, Research & Science" &&
    !club &&
    pos &&
    strongOther < 5 &&
    CAMPUS_ROLE_RX.test(pos) &&
    !ACADEMIC_STAFF_RX.test(pos)
  ) {
    scores[STUD] += 3;
    fam[STUD] = "Student / Community";
  }

  const titleTop = Math.max(...CATS.map((c) => scores[c]));

  const final: Record<string, number> = { ...scores };
  // A tie-breaker only: never enough to overturn a title that says something.
  if (ccat && !club && titleTop < 3 && titleTop >= 1) final[ccat] += 1.0;

  const ranked = [...CATS].sort((a, b) => final[b] - final[a]);
  const top = ranked[0];
  const ts = final[top];
  const sec = ranked[1];
  const ss = final[sec];

  const second = ss > 0 && ss >= 0.6 * ts && sec !== top ? sec : null;

  if (titleTop >= 2 || (titleTop >= 1.5 && ts > ss)) {
    return { cat: top, fam: fam[top] ?? "Mixed", titleTop, margin: ts - ss, ccat, cname, second, resolved: true };
  }

  const genericFam = pos
    ? (GENERIC_FAMILY.find(([rx]) => rx.test(pos))?.[1] ?? "Generic / Untitled")
    : "Company only";

  return { cat: null, fam: genericFam, titleTop, margin: ts - ss, ccat, cname, second, resolved: false };
}
