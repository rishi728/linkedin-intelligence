import { describe, expect, it } from "vitest";
import { classifyAuto } from "./intelligence";
import { PRIMARY_IDS, primaryOf } from "./primary";

/** Goes through the real classifier, so the mapping cannot drift from it. */
const at = (title: string, company = "Acme") => {
  const c = classifyAuto(title, company);
  return primaryOf(c.fn, title, c.isFounder);
};

describe("primaryOf", () => {
  it("puts obvious titles in the right bucket", () => {
    expect(at("Software Engineer")).toBe("software");
    expect(at("Mechanical Engineer")).toBe("core_engineering");
    expect(at("Technical Recruiter", "Google")).toBe("recruiters");
    expect(at("Product Manager")).toBe("product");
    expect(at("Management Consultant")).toBe("consulting");
    expect(at("Co-Founder")).toBe("founders");
    expect(at("Professor")).toBe("education");
    expect(at("Account Executive")).toBe("sales");
  });

  it("splits data from AI on the title, not the company", () => {
    expect(primaryOf("data-science", "Data Scientist")).toBe("data");
    expect(primaryOf("data-science", "Applied Scientist")).toBe("ai");
    expect(primaryOf("machine-learning", "ML Engineer")).toBe("ai");
    expect(primaryOf("analytics", "Business Intelligence Developer")).toBe("data");
  });

  it("refuses to force functions that have no honest bucket", () => {
    for (const fn of ["legal", "clinical", "brand-marketing", "visual-design", "hr", "unclassified"]) {
      expect(primaryOf(fn, "Anything")).toBeNull();
    }
  });

  it("only ever returns one of the twelve", () => {
    const p = at("Associate Consultant");
    expect(p && PRIMARY_IDS.includes(p)).toBe(true);
  });
});
