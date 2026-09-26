import { describe, expect, it } from "vitest";
import { PRIMARY_IDS, primaryOf } from "./primary";

describe("primaryOf", () => {
  it("maps detailed categories onto the twelve", () => {
    expect(primaryOf("software", "Software Engineer")).toBe("software");
    expect(primaryOf("engineering", "Mechanical Engineer")).toBe("core_engineering");
    expect(primaryOf("recruiting", "Technical Recruiter")).toBe("recruiters");
  });

  it("splits data from AI on the title, not the company", () => {
    expect(primaryOf("data_ai", "Data Analyst")).toBe("data");
    expect(primaryOf("data_ai", "Machine Learning Engineer")).toBe("ai");
    expect(primaryOf("data_ai", "Applied Scientist")).toBe("ai");
    expect(primaryOf("data_ai", "Business Intelligence Developer")).toBe("data");
  });

  it("refuses to force categories that have no honest bucket", () => {
    for (const domain of ["healthcare", "legal", "marketing", "design", "hr", "unspecified"]) {
      expect(primaryOf(domain, "Anything")).toBeNull();
    }
  });

  it("only ever returns one of the twelve", () => {
    const p = primaryOf("consulting", "Associate Consultant");
    expect(p && PRIMARY_IDS.includes(p)).toBe(true);
  });
});
