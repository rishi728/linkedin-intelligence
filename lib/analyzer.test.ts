import { describe, expect, it } from "vitest";
import { applyOverrides, companyKey, CsvFormatError, parseConnectionsCsv, parseLinkedInDate, summarize } from "./analyzer";
import { generateSampleCsv } from "./sample";

const LINKEDIN_CSV = `Notes:
"When exporting your connection data, you may notice that some of the email addresses are missing."

First Name,Last Name,URL,Email Address,Company,Position,Connected On
Jane,Doe,https://www.linkedin.com/in/janedoe,,Google,Technical Recruiter,15 Jan 2024
John,Smith,https://www.linkedin.com/in/jsmith,john@x.com,"Acme, Inc.",Founder & CEO,03 Mar 2024
Asha,Rao,https://www.linkedin.com/in/asharao,,,,20 Mar 2024
Li,Wei,https://www.linkedin.com/in/liwei,,Google LLC,Software Engineer,02 Apr 2023
`;

describe("parseConnectionsCsv", () => {
  it("skips LinkedIn's Notes preamble and classifies each row", () => {
    const rows = parseConnectionsCsv(LINKEDIN_CSV);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ name: "Jane Doe", company: "Google", category: "recruiting", tags: ["faang"] });
    expect(rows[1]).toMatchObject({ company: "Acme, Inc.", category: "founders", email: "john@x.com" });
    expect(rows[2].category).toBe("unspecified");
    expect(rows[0].connectedOn?.getFullYear()).toBe(2024);
  });

  it("rejects files that are not a connections export", () => {
    expect(() => parseConnectionsCsv("a,b,c\n1,2,3")).toThrow(CsvFormatError);
  });
});

describe("parseLinkedInDate", () => {
  it.each([
    ["15 Jan 2024", 2024, 0, 15],
    ["5 Sept 2019", 2019, 8, 5],
    ["01/15/24", 2024, 0, 15],
    ["2022-11-30", 2022, 10, 30],
    ["Jan 15, 2021", 2021, 0, 15],
  ])("%s", (raw, y, m, d) => {
    const date = parseLinkedInDate(raw)!;
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([y, m, d]);
  });
});

describe("summarize", () => {
  it("groups company name variants and builds a gap-free cumulative timeline", () => {
    const s = summarize(parseConnectionsCsv(LINKEDIN_CSV));
    expect(s.topCompanies[0]).toEqual({ name: "Google", count: 2 });
    expect(s.timeline[0].key).toBe("2023-04");
    expect(s.timeline.at(-1)).toMatchObject({ key: "2024-03", total: 4 });
    expect(s.timeline).toHaveLength(12);
    expect(s.categoryCounts.unspecified).toBe(1);
    expect(s.classifiedPct).toBeCloseTo(0.75);
  });

  it("normalizes legal suffixes for company grouping", () => {
    expect(companyKey("Google LLC")).toBe(companyKey("Google"));
    expect(companyKey("Infosys Limited")).toBe(companyKey("Infosys"));
  });
});

describe("applyOverrides", () => {
  it("reassigns and can revert a category", () => {
    const rows = parseConnectionsCsv(LINKEDIN_CSV);
    const moved = applyOverrides(rows, { [rows[2].id]: "students" });
    expect(moved[2]).toMatchObject({ category: "students", overridden: true });
    const reverted = applyOverrides(moved, {});
    expect(reverted[2]).toMatchObject({ category: "unspecified", overridden: false });
  });
});

describe("sample data", () => {
  it("parses and nearly every sample connection gets a real category", () => {
    const rows = parseConnectionsCsv(generateSampleCsv());
    const s = summarize(rows);
    expect(rows.length).toBe(640);
    expect(s.classifiedPct).toBeGreaterThan(0.97);
  });
});
