import { describe, expect, it } from "vitest";
import { BIZ, CATS, DATA, EDU, FIN, FOUND, NOPRO, OPS, PROD, SALES, STUD, TECH, bandOf } from "./categories";
import { classifyCorpus, pairKey, type Row } from "./run";
import { companyContext, isClub, norm, roleText, stage1 } from "./stage1";

/** Classifies one pair inside a corpus, which is the only way the model works. */
function one(position: string, company = "", extra: Row[] = []) {
  const rows: Row[] = [{ position, company }, ...extra];
  const { byPair } = classifyCorpus(rows);
  return byPair.get(pairKey(position, company))!;
}

const cat = (position: string, company = "") => one(position, company).category;

describe("normalising", () => {
  it("spaces ampersands, flattens dashes and lower-cases", () => {
    expect(norm("R&D  Engineer")).toBe("r & d engineer");
    expect(norm("Head — Supply Chain")).toBe("head - supply chain");
  });

  it("strips level words from the role text and keeps the function", () => {
    expect(roleText("Senior Manager, Supply Chain")).toBe("supply chain");
    expect(roleText("Associate Director")).toBe("");
    expect(roleText("Data Scientist II")).toBe("data scientist");
  });
});

describe("the ten categories", () => {
  it("places obvious titles", () => {
    expect(cat("Software Engineer")).toBe(TECH);
    expect(cat("Mechanical Engineer")).toBe(TECH);
    expect(cat("Data Scientist")).toBe(DATA);
    expect(cat("ML Engineer")).toBe(DATA);
    expect(cat("Product Manager")).toBe(PROD);
    expect(cat("UX Designer")).toBe(PROD);
    expect(cat("Founder")).toBe(FOUND);
    expect(cat("Co-Founder & CEO")).toBe(FOUND);
    expect(cat("Equity Research Analyst")).toBe(FIN);
    expect(cat("Management Consultant")).toBe(BIZ);
    expect(cat("Technical Recruiter")).toBe(BIZ);
    expect(cat("Assistant Professor")).toBe(EDU);
    expect(cat("Supply Chain Manager")).toBe(OPS);
    expect(cat("Growth Marketer")).toBe(SALES);
  });

  it("only ever returns one of the eleven", () => {
    const all = new Set<string>([...CATS, NOPRO]);
    for (const t of ["Software Engineer", "Ninja Rockstar", "", "Joint Secretary"]) {
      expect(all.has(cat(t, "Acme"))).toBe(true);
    }
  });

  it("marks a row with no company and no position, and nothing else", () => {
    const empty = one("", "");
    expect(empty.category).toBe(NOPRO);
    expect(empty.confidence).toBe(1);
    expect(empty.method).toBe("Empty company & position");
    expect(empty.cluster).toBeNull();
    expect(cat("", "Google")).not.toBe(NOPRO);
  });
});

describe("weights decide, not seniority", () => {
  it("ignores level words when choosing the category", () => {
    expect(cat("Senior Software Engineer")).toBe(TECH);
    expect(cat("Associate Director, Data Science")).toBe(DATA);
    expect(cat("VP of Engineering")).toBe(TECH);
  });

  it("lets the specific rule beat the general one", () => {
    expect(cat("Data Engineer")).toBe(DATA);
    expect(cat("Sales Engineer")).toBe(SALES);
    expect(cat("Quantitative Researcher")).toBe(FIN);
    expect(cat("Research Scientist")).toBe(EDU);
    expect(cat("R&D Engineer")).toBe(TECH);
    expect(cat("PhD Researcher")).toBe(EDU);
  });

  it("routes the C-suite by what they run", () => {
    expect(cat("CTO")).toBe(TECH);
    expect(cat("CFO")).toBe(FIN);
    expect(cat("CMO")).toBe(SALES);
    expect(cat("CPO")).toBe(PROD);
    expect(cat("Chief Data Officer")).toBe(DATA);
    expect(cat("CHRO")).toBe(BIZ);
    expect(cat("CEO")).toBe(FOUND);
    expect(cat("Chief of Staff")).toBe(FOUND);
  });
});

describe("club and campus context", () => {
  it("reads a club president as a student, not an executive", () => {
    expect(cat("President", "Entrepreneurship Cell, NIT Warangal")).toBe(STUD);
    expect(cat("General Secretary", "Students' Gymkhana")).toBe(STUD);
  });

  it("still lets a real founder be a founder at a club company", () => {
    expect(cat("Co-Founder", "Robotics Club")).toBe(FOUND);
  });

  it("reads a campus role at an institution as a student", () => {
    expect(cat("Student Coordinator", "IIT Madras")).toBe(STUD);
    expect(cat("Placement Coordinator", "NIT Warangal")).toBe(STUD);
  });

  it("does not turn academic staff into students", () => {
    expect(cat("Research Scholar", "IIT Bombay")).toBe(EDU);
    expect(cat("Professor", "IIT Delhi")).toBe(EDU);
  });

  it("recognises the club employers the rules name", () => {
    expect(isClub("E-Cell IIT Bombay")).toBe(true);
    expect(isClub("180 Degrees Consulting DTU")).toBe(true);
    expect(isClub("Google")).toBe(false);
  });
});

describe("company context", () => {
  it("types employers the rules know", () => {
    expect(companyContext("McKinsey & Company").name).toBe("consulting firm");
    expect(companyContext("Goldman Sachs").name).toBe("finance firm");
    expect(companyContext("IIT Bombay").name).toBe("academic/research institution");
    expect(companyContext("Tata Steel").name).toBe("manufacturing/energy/industrial");
    expect(companyContext("Bhatia Traders XYZ").cat).toBeNull();
  });

  it("breaks a tie but never overturns a title that says something", () => {
    // A strong title at a bank is still the title's category.
    expect(cat("Software Engineer", "HDFC Bank")).toBe(TECH);
    expect(cat("Data Scientist", "Goldman Sachs")).toBe(DATA);
  });
});

describe("generic titles", () => {
  it("names the family rather than inventing a function", () => {
    expect(stage1("Assistant Manager", "").fam).toBe("Generic Manager");
    expect(stage1("Senior Analyst", "").fam).toBe("Generic Analyst");
    expect(stage1("Summer Intern", "").fam).toBe("Generic Intern / Trainee");
    expect(stage1("Associate Director", "").fam).toBe("Leadership (function unspecified)");
    expect(stage1("Assistant Manager", "").resolved).toBe(false);
  });

  it("resolves them from company and colleagues, and says which", () => {
    const colleagues: Row[] = Array.from({ length: 6 }, (_, i) => ({
      position: `Investment Banking Analyst ${i}`,
      company: "Some Bank Ltd",
    }));
    const r = one("Assistant Manager", "Some Bank Ltd", colleagues);
    expect(r.genericInference).toBe(true);
    expect(r.method.startsWith("Generic title")).toBe(true);
    expect(r.category).toBe(FIN);
  });

  it("flags one resting on the centroid alone", () => {
    const r = one("Assistant Manager", "Bhatia Traders XYZ");
    expect(r.genericInference).toBe(true);
    expect(r.needsReview).toBe(true);
    expect(r.confidence).toBeLessThan(0.6);
  });

  it("never falls back to a default bucket for a title with no function", () => {
    // V4 used to drop these into Business & Consulting at 0.30; V5 removed that
    // default, so an unplaceable title has to earn a category from a signal.
    const r = one("Associate", "Unknown Pvt Ltd");
    expect(r.genericInference).toBe(true);
    expect(r.confidence).toBeLessThanOrEqual(0.6);
  });
});

describe("confidence and review", () => {
  it("never claims certainty for a real classification", () => {
    for (const t of ["Software Engineer", "Founder", "Product Manager", "Assistant Manager"]) {
      const r = one(t, "Acme");
      expect(r.confidence).toBeLessThanOrEqual(0.97);
      expect(r.confidence).toBeGreaterThanOrEqual(0.2);
    }
  });

  it("bands on the documented thresholds", () => {
    expect(bandOf(0.59)).toBe("Low");
    expect(bandOf(0.6)).toBe("Medium");
    expect(bandOf(0.79)).toBe("Medium");
    expect(bandOf(0.8)).toBe("High");
  });

  it("is more confident about a decisive title than a moderate one", () => {
    expect(one("ML Engineer", "Acme").confidence).toBeGreaterThan(one("Business Associate", "Acme").confidence);
  });

  // Faithful to the original: "machine learning" scores Data 4 while "engineer"
  // scores Technology 4, and a tie falls to the first category in CAT order.
  // Only the abbreviation carries the extra "ml engineer" rule.
  it("keeps the original's tie-breaking, quirks included", () => {
    expect(cat("Machine Learning Engineer")).toBe(TECH);
    expect(cat("ML Engineer")).toBe(DATA);
  });

  it("flags anything under 0.6 for review", () => {
    const r = one("Assistant Manager", "Bhatia Traders XYZ");
    expect(r.needsReview).toBe(r.confidence < 0.6 || r.conflict || r.genericInference);
  });
});

describe("consistency", () => {
  it("gives the same title at the same company the same answer every time", () => {
    const rows: Row[] = [
      { position: "Product Manager", company: "Google" },
      { position: "Product Manager", company: "Google" },
      { position: "Product Manager", company: "Google" },
    ];
    const { byPair, stats } = classifyCorpus(rows);
    expect(stats.pairs).toBe(1);
    expect(byPair.get(pairKey("Product Manager", "Google"))!.category).toBe(PROD);
  });

  it("classifies each unique pair once however many people share it", () => {
    const rows: Row[] = [];
    for (let i = 0; i < 50; i++) rows.push({ position: "Software Engineer", company: "Infosys" });
    for (let i = 0; i < 20; i++) rows.push({ position: "Data Analyst", company: "Infosys" });
    const { stats } = classifyCorpus(rows);
    expect(stats.pairs).toBe(2);
  });

  it("puts every pair in the map", () => {
    const rows: Row[] = [
      { position: "Software Engineer", company: "Google" },
      { position: "", company: "" },
      { position: "Joint Secretary", company: "Students' Gymkhana" },
    ];
    const { byPair } = classifyCorpus(rows);
    for (const r of rows) expect(byPair.has(pairKey(r.position, r.company))).toBe(true);
  });
});

describe("the K = 10 model", () => {
  it("assigns a cluster between 1 and 10 to everyone with a title", () => {
    const rows: Row[] = [
      { position: "Software Engineer", company: "Google" },
      { position: "Data Scientist", company: "Fractal" },
      { position: "Product Manager", company: "Swiggy" },
      { position: "Assistant Manager", company: "Tata Steel" },
      { position: "Equity Research Analyst", company: "Goldman Sachs" },
    ];
    const { byPair } = classifyCorpus(rows);
    for (const r of rows) {
      const c = byPair.get(pairKey(r.position, r.company))!;
      expect(c.cluster).toBeGreaterThanOrEqual(1);
      expect(c.cluster).toBeLessThanOrEqual(10);
    }
  });
});
