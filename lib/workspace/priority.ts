// Transparent, rule-based priority. It scores how well someone matches what the
// user said they're looking for, never how likely they are to help.

import { bucketLabel, sectionLabel } from "../knowledge/roles";
import type { Person, Priority, Settings } from "./types";

export interface PriorityResult {
  score: number;
  level: Priority;
  reasons: string[];
}

type Scorable = Pick<Person, "bucket" | "section" | "company" | "isTarget" | "isAlumni" | "email" | "url" | "systemTags" | "certainty" | "history">;

export function scorePriority(p: Scorable, settings: Settings): PriorityResult {
  const { goals } = settings;
  const w = settings.weights;
  const reasons: string[] = [];
  let score = 0;

  if (!p.bucket) return { score: 0, level: "low", reasons: ["No role information to match against your goals"] };

  if (p.section && goals.sections.includes(p.section)) {
    score += w.functionMatch;
    reasons.push(`Works in ${sectionLabel(p.bucket, p.section)}, one of your target areas`);
  } else if (goals.buckets.includes(p.bucket)) {
    score += w.domainMatch;
    reasons.push(`Works in ${bucketLabel(p.bucket)}, one of your target areas`);
  }

  if (p.isTarget) {
    score += w.targetCompany;
    reasons.push(`Works at ${p.company}, a target company`);
  }


  const wantsJobs = goals.opportunityTypes.some((t) => ["Internship", "Full-time", "Referral"].includes(t));
  if (wantsJobs && p.section === "recruitment") {
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
  if (p.certainty !== "high") {
    score -= 5;
    reasons.push("Role is uncertain, review before reaching out");
  }

  score = Math.max(0, Math.min(100, score));
  const level: Priority = score >= 55 ? "high" : score >= 30 ? "medium" : "low";
  return { score, level, reasons };
}

export function hasGoals(settings: Settings): boolean {
  const g = settings.goals;
  return g.buckets.length + g.sections.length > 0 || settings.targetCompanies.length > 0;
}
