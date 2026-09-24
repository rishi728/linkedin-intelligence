// Transparent, rule-based priority. It scores how well someone matches what the
// user said they're looking for, never how likely they are to help.

import { domainLabel, functionLabel } from "../intelligence";
import type { Seniority } from "../taxonomy";
import type { Person, Priority, Settings } from "./types";

const SENIOR_WEIGHT: Partial<Record<Seniority, number>> = {
  "C-Level": 10, VP: 10, "Director / Head": 10, Founder: 8, "Manager / Lead": 8, Senior: 6, "Mid-level": 3,
};

export interface PriorityResult {
  score: number;
  level: Priority;
  reasons: string[];
}

type Scorable = Pick<Person, "domain" | "fn" | "seniority" | "company" | "isTarget" | "isAlumni" | "email" | "url" | "systemTags" | "confidence" | "history">;

export function scorePriority(p: Scorable, settings: Settings): PriorityResult {
  const { goals } = settings;
  const w = settings.weights;
  const reasons: string[] = [];
  let score = 0;

  if (p.domain === "unclassified") return { score: 0, level: "low", reasons: ["No role information to match against your goals"] };

  if (goals.functions.includes(p.fn)) {
    score += w.functionMatch;
    reasons.push(`Works in ${functionLabel(p.fn)}, one of your target areas`);
  } else if (goals.domains.includes(p.domain)) {
    score += w.domainMatch;
    reasons.push(`Works in ${domainLabel(p.domain)}, one of your target areas`);
  }

  if (p.isTarget) {
    score += w.targetCompany;
    reasons.push(`Works at ${p.company}, a target company`);
  }

  if (goals.seniorities.length) {
    if (goals.seniorities.includes(p.seniority)) {
      score += w.seniorityMatch;
      reasons.push(`${p.seniority}, the seniority you're targeting`);
    }
  } else if (SENIOR_WEIGHT[p.seniority]) {
    score += SENIOR_WEIGHT[p.seniority]!;
    if (SENIOR_WEIGHT[p.seniority]! >= 8) reasons.push(`${p.seniority}, experienced enough to advise or refer`);
  }

  const wantsJobs = goals.opportunityTypes.some((t) => ["Internship", "Full-time", "Referral"].includes(t));
  if (wantsJobs && p.fn === "talent-acquisition") {
    score += w.recruiter;
    reasons.push("Recruiter, relevant for internships, jobs and referrals");
  }
  if (p.systemTags.includes("hiring")) {
    score += w.hiring;
    reasons.push("Mentions hiring in their title");
  }
  if (p.isAlumni) {
    score += w.alumni;
    reasons.push("Shares your school or campus");
  }
  if (p.history?.theyReplied) {
    score += w.replied;
    reasons.push("You have talked before, they replied to you");
  } else if (p.history?.invited === "them") {
    score += w.theyInvited;
    reasons.push("They invited you to connect");
  }
  if (p.email) {
    score += w.hasEmail;
    reasons.push("Email address available");
  }
  if (p.confidence < 60) {
    score -= 5;
    reasons.push("Role is uncertain, review before reaching out");
  }

  score = Math.max(0, Math.min(100, score));
  const level: Priority = score >= 55 ? "high" : score >= 30 ? "medium" : "low";
  return { score, level, reasons };
}

export function hasGoals(settings: Settings): boolean {
  const g = settings.goals;
  return g.domains.length + g.functions.length + g.seniorities.length > 0 || settings.targetCompanies.length > 0;
}
