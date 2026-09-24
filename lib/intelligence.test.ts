import { describe, expect, it } from "vitest";
import { applyRules, classifyAuto, isCampusOrg, rolesInText, titleKey, type CustomRule } from "./intelligence";

type Case = [position: string, company: string, domain: string, fn: string, role?: string, seniority?: string];

const CASES: Case[] = [
  ["Product Manager", "Google", "product", "product-management", "Product Manager"],
  ["Senior Product Manager", "Razorpay", "product", "product-management", "Senior Product Manager", "Senior"],
  ["AI Product Manager", "Microsoft", "product", "product-management", "AI Product Manager"],
  ["Project Manager", "Cognizant", "operations", "project-program", "Project Manager"],
  ["Operations Manager", "Delhivery", "operations", "business-ops", "Operations Manager", "Manager / Lead"],
  ["Supply Chain Manager", "Unilever", "operations", "supply-chain", "Supply Chain Manager", "Manager / Lead"],
  ["Procurement Analyst", "Tata Motors", "operations", "procurement", "Procurement Analyst"],
  ["Assistant Manager - Supply Planning", "Reliance Industries Limited", "operations", "supply-chain", "Demand & Supply Planner"],
  ["Backend Engineer", "Swiggy", "engineering", "software-engineering", "Backend Engineer", "Mid-level"],
  ["SDE2", "Amazon", "engineering", "software-engineering", "Software Engineer"],
  ["Growth Manager", "CRED", "marketing", "growth", "Growth Manager", "Manager / Lead"],
  ["Head of Developer Relations", "Postman", "technology", "developer-relations", "Developer Advocate", "Director / Head"],
  ["Founder's Office", "Zepto", "strategy", "business-operations", "Founder's Office"],
  ["Chief of Staff", "Meesho", "strategy", "business-operations", "Chief of Staff"],
  ["Co-Founder & CEO", "Stealth Startup", "leadership", "founders", "Founder & CEO", "Founder"],
  ["Technical Recruiter", "Google", "people", "talent-acquisition", "Recruiter"],
  ["HRBP", "Flipkart", "people", "hr", "HR Business Partner"],
  ["Quantitative Researcher", "WorldQuant", "finance", "quant", "Quantitative Researcher"],
  ["Investment Banking Analyst", "Goldman Sachs", "finance", "investment-banking"],
  ["Engagement Manager", "McKinsey & Company", "strategy", "management-consulting", "Engagement Manager"],
  ["Consultant", "Accenture Strategy & Consulting", "strategy", "management-consulting", "Consultant"],
  ["Assistant Professor of Marketing", "IIM Bangalore", "education", "faculty", "Assistant Professor"],
  ["Graduate Engineer Trainee", "Bharat Petroleum Corporation Limited", "engineering", "core-engineering", "Graduate Engineer Trainee"],
  ["GET", "Tata Steel", "engineering", "core-engineering", "Graduate Engineer Trainee"],
  ["Management Trainee", "ITC Limited", "students", "early-career", "Management Trainee", "Entry-level"],
  ["Software Engineer Intern", "Microsoft", "engineering", "software-engineering", "Software Engineering Intern", "Intern"],
  ["Summer Intern", "Goldman Sachs", "students", "internships", "Intern", "Intern"],
  ["Research Intern", "IISc", "research", "academic-research", "Research Intern"],
  ["Machine Learning Engineer", "NVIDIA", "data-ai", "machine-learning", "Machine Learning Engineer"],
  ["Analog Design Engineer", "Texas Instruments", "engineering", "hardware-semiconductors", "Analog / Mixed-Signal Engineer"],
  ["Category Manager", "Blinkit", "operations", "category-marketplace", "Category Manager"],
  ["Executive Member", "Business Club, NIT Warangal", "students", "campus", "Club / Team Member", "Student"],
  ["Joint Secretary", "Mechanical Engineering Association NITW", "students", "campus", "Club Secretary", "Student"],
  ["Joint Secretary", "Ministry of Finance, Government of India", "public", "government", "Civil Servant"],
  ["President", "180 Degrees Consulting BITS Goa", "students", "campus", "Club Secretary", "Student"],
  ["Geoscientist", "ExxonMobil", "research", "sciences", "Geoscientist"],
  // A level with no function: the employer gives the industry, never the job.
  ["Assistant Manager", "HDFC Bank", "unclassified", "unspecified", "Assistant Manager", "Manager / Lead"],
  ["PM", "Swiggy", "product", "product-management", "Product Manager", "Mid-level"],
  ["Lead Product Manager", "Swiggy", "product", "product-management", "Lead Product Manager", "Manager / Lead"],
  ["Key Account Manager", "Nestle", "sales", "sales", "Key Account Manager", "Mid-level"],
  ["", "", "unclassified", "unclassified", "Role not shared"],
];

describe("classifyAuto: hierarchy", () => {
  it.each(CASES)("%s @ %s → %s / %s / %s / %s", (position, company, domain, fn, role, seniority) => {
    const r = classifyAuto(position, company);
    const got = { domain: r.domain, fn: r.fn, ...(role ? { role: r.role } : {}), ...(seniority ? { seniority: r.seniority } : {}) };
    expect(got, r.reasons.join(" · ")).toEqual({ domain, fn, ...(role ? { role } : {}), ...(seniority ? { seniority } : {}) });
  });
});

describe("classifyAuto: confidence and industry", () => {
  it("is confident for explicit roles and flags weak evidence for review", () => {
    expect(classifyAuto("Product Manager", "Google").confidence).toBeGreaterThanOrEqual(90);
    const weak = classifyAuto("", "Goldman Sachs");
    expect(weak.needsReview).toBe(true);
    expect(weak.industry).toBe("Financial Services");
  });
  it("infers industry from the employer only", () => {
    expect(classifyAuto("Recruiter", "Google").industry).toBe("Technology");
    expect(classifyAuto("Recruiter", "Acme Widgets").industry).toBe("Unknown");
  });
});

describe("a title that is only a level says nothing about the work", () => {
  it.each([
    ["Assistant Manager", "Reliance", "Manager / Lead"],
    ["Senior Manager", "Tata Motors", "Manager / Lead"],
    ["Manager", "Nestle", "Manager / Lead"],
    ["Director", "Siemens", "Director / Head"],
    ["Vice President", "HDFC Bank", "VP"],
    ["AVP", "ICICI", "VP"],
    ["Executive", "Godrej", "Mid-level"],
    ["Team Lead", "Infosys", "Manager / Lead"],
    ["Manager II", "Amazon", "Manager / Lead"],
  ])("%s @ %s keeps the level, invents no area", (position, company, seniority) => {
    const c = classifyAuto(position, company);
    expect(c).toMatchObject({ domain: "unclassified", fn: "unspecified", seniority });
    expect(c.role).toBe(position);
    expect(c.needsReview).toBe(true);
  });

  it("keeps the area when the employer only does one thing", () => {
    // A consultancy's "Senior Associate" really is a consultant; a bank's is not.
    expect(classifyAuto("Senior Associate", "PwC")).toMatchObject({ domain: "strategy", fn: "management-consulting", seniority: "Senior" });
    expect(classifyAuto("Associate", "McKinsey & Company").domain).toBe("strategy");
    expect(classifyAuto("Senior Associate", "HDFC Bank").fn).toBe("unspecified");
    expect(classifyAuto("Senior Associate", "PwC").confidence).toBeLessThan(60);
  });

  it("still takes the industry from the employer", () => {
    expect(classifyAuto("Assistant Manager", "HDFC Bank").industry).toBe("Financial Services");
  });

  it("a level plus an area keeps the area", () => {
    expect(classifyAuto("Vice President Of Engineering", "Acme")).toMatchObject({ domain: "engineering", seniority: "VP" });
    expect(classifyAuto("Director of Engineering", "Acme")).toMatchObject({ domain: "engineering", seniority: "Director / Head" });
    expect(classifyAuto("AVP - Data Science", "ICICI")).toMatchObject({ domain: "data-ai", seniority: "VP" });
    expect(classifyAuto("Senior Director, Product", "Adobe")).toMatchObject({ domain: "product", seniority: "Director / Head" });
  });

  it("leaves real job titles alone", () => {
    expect(classifyAuto("Senior Product Manager", "Razorpay")).toMatchObject({ domain: "product", role: "Senior Product Manager" });
    expect(classifyAuto("Supply Chain Analyst", "ExxonMobil")).toMatchObject({ domain: "operations", fn: "supply-chain" });
    expect(classifyAuto("Software Engineer", "Google")).toMatchObject({ domain: "engineering", role: "Software Engineer" });
  });
});

describe("campus detection", () => {
  it.each([
    ["Business Club, NIT Warangal", true],
    ["Techfest, IIT Bombay", true],
    ["Team MechXhausters Racing FSAE", true],
    ["National Institute of Technology Warangal", false],
    ["Rotary Club of Mumbai", false],
    ["Accenture", false],
  ])("%s → %s", (company, expected) => expect(isCampusOrg(company)).toBe(expected));

  it("treats a title at a college as campus unless it reads as staff", () => {
    expect(isCampusOrg("Indian Institute of Technology, Bombay", "Teaching Assistant")).toBe(true);
    expect(isCampusOrg("Indian Institute of Technology, Bombay", "Assistant Professor")).toBe(false);
    expect(isCampusOrg("Maytree School Of Entrepreneurship", "Founder and CEO")).toBe(false);
    expect(isCampusOrg("Accenture", "Analyst")).toBe(false);
  });
});

describe("campus roles never read as corporate seniority", () => {
  it.each([
    ["Business Club", "NIT Warangal"],
    ["Marketing Lead", "Kshitij, IIT Kharagpur"],
    ["Marketing Associate", "XYZ E-Cell"],
    ["Head of Marketing", "College Fest, IIT Bombay"],
    ["Relations Associate", "E-Cell IIT Bombay"],
    ["Joint Secretary", "Students' Gymkhana"],
    ["Student Coordinator", "IIT Madras"],
    ["Director of Corporate Relations", "180 Degrees Consulting DTU"],
  ])("%s @ %s → Student / Campus", (position, company) => {
    const c = classifyAuto(position, company);
    expect(c).toMatchObject({ domain: "students", fn: "campus", seniority: "Student", campusOrg: true });
    expect(c.isFounder).toBe(false);
  });

  it("keeps the campus activity so the role still says what they do", () => {
    expect(classifyAuto("Marketing Lead", "Kshitij, IIT Kharagpur")).toMatchObject({
      campusActivity: "Marketing",
      role: "Marketing · Student Organisation",
    });
  });

  it("leaves the same titles alone at a real employer", () => {
    expect(classifyAuto("Head of Marketing", "Acme Foods")).toMatchObject({ domain: "marketing", seniority: "Director / Head" });
    expect(classifyAuto("Marketing Associate", "Unilever")).toMatchObject({ domain: "marketing", campusOrg: false });
  });
});

describe("founders", () => {
  it.each(["Founder", "Co-Founder", "Founder & CEO", "Co-Founder and CTO", "Founding Member", "Founding Partner"])(
    "%s is a founder",
    (title) => {
      const c = classifyAuto(title, "Acme");
      expect(c.isFounder).toBe(true);
      expect(c.seniority).toBe("Founder");
    },
  );

  it.each(["Founder's Office", "Founder Office Intern", "Founding Engineer", "Aspiring Founder", "Ex-Founder"])(
    "%s is not a founder",
    (title) => expect(classifyAuto(title, "Acme").isFounder).toBe(false),
  );

  it("keeps the professional role of a founding engineer", () => {
    expect(classifyAuto("Founding Engineer", "Acme")).toMatchObject({ domain: "engineering", fn: "software-engineering", role: "Founding Engineer" });
  });
});

describe("explicit occupation outranks the employer's industry", () => {
  it.each([
    ["Data Scientist", "Apollo Hospitals", "data-ai"],
    ["Supply Chain Analyst", "ExxonMobil", "operations"],
    ["Product Manager", "HDFC Bank", "product"],
    ["Software Engineer", "Fortis Healthcare", "engineering"],
  ])("%s @ %s → %s", (position, company, domain) => expect(classifyAuto(position, company).domain).toBe(domain));
});

describe("custom rules", () => {
  const rules: CustomRule[] = [
    { id: "r1", match: "exact", pattern: titleKey("Growth Hacker"), example: "Growth Hacker", set: { domain: "marketing", fn: "growth", role: "Growth Hacker" }, createdAt: "" },
    { id: "r2", match: "contains", pattern: titleKey("chief of staff"), example: "Chief of Staff", set: { domain: "strategy", fn: "business-operations" }, createdAt: "" },
  ];
  it("applies exact-title rules over automatic results", () => {
    const r = applyRules(classifyAuto("Growth hackers", ""), "Growth hackers", rules);
    expect(r).toMatchObject({ domain: "marketing", fn: "growth", role: "Growth Hacker", source: "rule", confidence: 99 });
  });
  it("applies contains rules", () => {
    expect(applyRules(classifyAuto("Chief of Staff to the CEO", "X"), "Chief of Staff to the CEO", rules).source).toBe("rule");
  });
  it("leaves unrelated titles alone", () => {
    expect(applyRules(classifyAuto("Growth Manager", ""), "Growth Manager", rules).source).toBe("auto");
  });
});

describe("rolesInText", () => {
  it("finds roles in a search query", () => {
    expect(rolesInText("senior people in supply chain").map((r) => r.fn)).toContain("supply-chain");
    expect(rolesInText("product managers at google").map((r) => r.role)).toContain("Product Manager");
  });
});
