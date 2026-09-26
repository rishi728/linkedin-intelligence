import { describe, expect, it } from "vitest";
import { classify } from "./classify";
import { ROLE_BUCKETS, ROLE_INDEX } from "./roles";
import { SECTOR_IDS } from "./sectors";

const at = (title: string, company = "", context = "") => classify({ title, company, context });
const bucket = (title: string, company = "") => at(title, company).bucketId;

describe("the repository's shape", () => {
  it("has exactly seventeen buckets", () => {
    expect(ROLE_BUCKETS).toHaveLength(17);
  });

  it("has exactly six sections in every bucket", () => {
    for (const b of ROLE_BUCKETS) expect(b.sections, b.label).toHaveLength(6);
  });

  it("gives every section detailed roles underneath it", () => {
    for (const b of ROLE_BUCKETS) {
      for (const s of b.sections) expect(s.roles.length, `${b.label} / ${s.label}`).toBeGreaterThan(0);
    }
  });

  it("keeps role ids unique, so a filter can never mean two things", () => {
    const ids = ROLE_INDEX.map((r) => r.roleId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("the named test cases", () => {
  it("classifies the titles the specification calls out", () => {
    expect(bucket("Software Engineer")).toBe("technology-and-engineering");
    expect(bucket("Mechanical Engineer")).toBe("technology-and-engineering");
    expect(bucket("Data Scientist")).toBe("data-and-ai");
    expect(bucket("AI Product Manager")).toBe("product-and-design");
    expect(bucket("Strategy Consultant")).toBe("business-and-consulting");
    expect(bucket("Founder")).toBe("founders-and-entrepreneurship");
    expect(bucket("Founder's Office")).toBe("business-and-consulting");
    expect(bucket("Technical Recruiter")).toBe("people-and-talent");
    expect(bucket("Professor")).toBe("education-and-academia");
    expect(bucket("Finance Manager")).toBe("finance-and-investment");
    expect(bucket("Supply Chain Manager")).toBe("operations-and-supply-chain");
    expect(bucket("Customer Success Manager")).toBe("customer-and-client-services");
  });

  it("reads a product manager at a carmaker as product, in manufacturing", () => {
    const c = at("Product Manager", "Tata Motors");
    expect(c.bucketId).toBe("product-and-design");
    expect(c.sectionId).toBe("product-management");
    expect(c.roleId).toBe("product-manager");
    expect(c.sector).toBe("manufacturing");
  });

  it("reads a finance manager at a tech company as finance, in technology", () => {
    const c = at("Finance Manager", "Google");
    expect(c.bucketId).toBe("finance-and-investment");
    expect(c.sectionId).toBe("corporate-finance");
    expect(c.roleId).toBe("finance-manager");
    expect(c.sector).toBe("technology");
  });

  it("puts a founder's office at a healthcare company under consulting, in healthcare", () => {
    const c = at("Founder's Office", "Apollo Hospitals");
    expect(c.bucketId).toBe("business-and-consulting");
    expect(c.sectionId).toBe("founders-office-and-chief-of-staff");
    expect(c.sector).toBe("healthcare");
  });
});

describe("words that belong to another job", () => {
  it("does not read Technical Recruiter as engineering", () => {
    const c = at("Technical Recruiter", "Google");
    expect(c.bucketId).toBe("people-and-talent");
    expect(c.sectionId).toBe("recruitment");
    expect(c.roleId).toBe("technical-recruiter");
  });

  it("does not read Founder Associate as a founder", () => {
    for (const t of ["Founder Associate", "Founder's Associate", "Founders Office", "Chief of Staff to the CEO"]) {
      expect(bucket(t), t).toBe("business-and-consulting");
    }
  });

  it("does not read AI Product Manager as AI", () => {
    for (const t of ["AI Product Manager", "ML Product Manager", "Data Product Manager", "Senior AI Product Manager"]) {
      expect(bucket(t), t).toBe("product-and-design");
    }
  });

  it("does not read Sales Engineer as core engineering", () => {
    expect(bucket("Sales Engineer")).toBe("sales-and-business-development");
    expect(bucket("Pre-Sales Engineer")).toBe("sales-and-business-development");
    expect(bucket("Solutions Engineer")).toBe("sales-and-business-development");
  });

  it("does not read Product Marketing as product management", () => {
    expect(bucket("Product Marketing Manager")).toBe("marketing-and-growth");
  });

  it("decides Business Analyst on the employer", () => {
    expect(at("Business Analyst", "Deloitte").roleId).toBe("associate-consultant");
    expect(at("Business Analyst", "Swiggy").roleId).toBe("business-analyst");
  });

  it("does not read Technical Account Manager as engineering", () => {
    expect(bucket("Technical Account Manager")).toBe("customer-and-client-services");
  });
});

describe("abbreviations and variations", () => {
  it("understands abbreviations", () => {
    expect(at("SDE").roleId).toBe("software-engineer");
    expect(at("SDE II").roleId).toBe("software-engineer");
    expect(at("MLE").roleId).toBe("machine-learning-engineer");
    expect(at("ML Engineer").roleId).toBe("machine-learning-engineer");
    expect(at("BDM").roleId).toBe("business-development-manager");
    expect(at("SRE").roleId).toBe("site-reliability-engineer");
    expect(at("APM").roleId).toBe("associate-product-manager");
    expect(at("HRBP").roleId).toBe("hr-business-partner");
    expect(at("CTO").roleId).toBe("cto");
  });

  it("ignores seniority words when deciding the role", () => {
    expect(at("Sr. Product Manager").roleId).toBe("product-manager");
    expect(at("Senior Product Manager").roleId).toBe("product-manager");
    expect(at("Junior Software Developer").roleId).toBe("software-engineer");
    expect(at("Assistant Manager - Supply Chain").bucketId).toBe("operations-and-supply-chain");
  });

  it("handles spelling and punctuation variants", () => {
    expect(bucket("Founders Office")).toBe("business-and-consulting");
    expect(bucket("Founder’s Office")).toBe("business-and-consulting");
    expect(bucket("Co-Founder")).toBe("founders-and-entrepreneurship");
    expect(bucket("Cofounder")).toBe("founders-and-entrepreneurship");
    expect(bucket("Programme Manager")).toBe("operations-and-supply-chain");
    expect(bucket("Organisational Development")).toBe("people-and-talent");
  });
});

describe("reaching every bucket", () => {
  const cases: Array<[string, string]> = [
    ["Backend Engineer", "technology-and-engineering"],
    ["Machine Learning Engineer", "data-and-ai"],
    ["UX Designer", "product-and-design"],
    ["Management Consultant", "business-and-consulting"],
    ["Account Executive", "sales-and-business-development"],
    ["Growth Marketer", "marketing-and-growth"],
    ["Investment Banking Analyst", "finance-and-investment"],
    ["Logistics Manager", "operations-and-supply-chain"],
    ["HR Business Partner", "people-and-talent"],
    ["Co-Founder & CEO", "founders-and-entrepreneurship"],
    ["Postdoctoral Researcher", "research-and-science"],
    ["Assistant Professor", "education-and-academia"],
    ["Clinical Research Associate", "healthcare-and-life-sciences"],
    ["Legal Counsel", "legal-and-compliance"],
    ["Creative Director", "media-and-creative"],
    ["Policy Analyst", "public-sector-and-social-impact"],
    ["Customer Support Manager", "customer-and-client-services"],
  ];

  it("reaches all seventeen", () => {
    for (const [title, expected] of cases) expect(bucket(title), title).toBe(expected);
    expect(new Set(cases.map((c) => c[1])).size).toBe(17);
  });
});

describe("sectors", () => {
  it("reads the sector from the employer", () => {
    expect(at("Analyst", "HDFC Bank").sector).toBe("financial");
    expect(at("Analyst", "Sun Pharma").sector).toBe("healthcare");
    expect(at("Analyst", "Tata Steel").sector).toBe("manufacturing");
    expect(at("Analyst", "Delhivery").sector).toBe("transport");
    expect(at("Analyst", "DLF").sector).toBe("realestate");
    expect(at("Analyst", "Ministry of Finance").sector).toBe("public");
    expect(at("Analyst", "McKinsey & Company").sector).toBe("professional");
    expect(at("Analyst", "IIT Bombay").sector).toBe("education");
  });

  it("leaves an unknown employer unclassified rather than guessing", () => {
    expect(at("Software Engineer", "Bhatia Enterprises XYZ").sector).toBeNull();
    expect(at("Software Engineer", "").sector).toBeNull();
  });

  it("only ever returns a known sector", () => {
    const c = at("Software Engineer", "Infosys");
    expect(c.sector && (SECTOR_IDS as readonly string[]).includes(c.sector)).toBe(true);
  });
});

describe("confidence and evidence", () => {
  it("is confident about an obvious title and says why", () => {
    const c = at("Software Engineer", "Infosys");
    expect(c.confidence).toBe("high");
    expect(c.evidence.join(" ")).toContain("Software Engineer");
  });

  it("refuses to classify a title it does not recognise", () => {
    const c = at("Ninja Rockstar Wizard");
    expect(c.roleId).toBeNull();
    expect(c.confidence).toBe("low");
    expect(c.evidence.join(" ")).toContain("does not match any known role");
  });

  it("says so when there was no title at all", () => {
    const c = at("");
    expect(c.roleId).toBeNull();
    expect(c.evidence.join(" ")).toContain("No job title");
  });

  it("falls back to other profile text, and marks it low confidence", () => {
    const c = at("Team Member", "Acme", "Building machine learning models for search");
    expect(c.confidence).toBe("low");
    expect(c.evidence.join(" ")).toContain("profile text");
  });
});
