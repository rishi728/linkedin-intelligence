import { describe, expect, it } from "vitest";
import { generateSampleCsv } from "../sample";
import { defaultSettings } from "./defaults";
import { createEngine } from "./engine";
import { applyFilters } from "./filters";
import { searchEverything } from "./search";
import { correctTypos, makeTextMatcher, tokenizeQuery } from "./textmatch";

const settings = defaultSettings();
const { people, companies } = createEngine()({ dataKey: "t", csvFiles: [generateSampleCsv(640)], records: {}, settings, archive: null });
const find = (q: string) => searchEverything(q, { people, companies, settings });
const titleOf = (p: { position: string; roleFamily: string }) => `${p.position} ${p.roleFamily}`.toLowerCase();

describe("role and title searches return people, not just a company with a similar name", () => {
  it("product manager", () => {
    const r = find("product manager");
    expect(r.intent).toBe("people");
    expect(r.total).toBeGreaterThan(15);
    expect(r.people.length).toBe(6);
    for (const p of r.people) expect(titleOf(p)).toMatch(/product/);
  });

  it("pm means product manager and never JPMorgan or KPMG", () => {
    const r = find("pm");
    expect(r.total).toBeGreaterThan(15);
    for (const p of r.people) expect(titleOf(p)).toMatch(/product/);
    expect(applyFilters(people, { q: "pm" }, settings).some((p) => /jpmorgan|kpmg/i.test(p.company) && !/product/i.test(titleOf(p)))).toBe(false);
  });

  it("hr finds recruiting and HR roles, not companies that contain the letters", () => {
    const r = find("hr");
    expect(r.total).toBeGreaterThan(5);
    for (const p of r.people) expect(titleOf(p)).toMatch(/hr|recruit|talent|human/);
    expect(applyFilters(people, { q: "hr" }, settings).every((p) => !/anthropic/i.test(p.company) || /hr|recruit|talent|human/.test(titleOf(p)))).toBe(true);
  });

  it("founder puts actual founders first", () => {
    expect(find("founder").people[0].position).toMatch(/founder/i);
  });

  it("intern finds interns", () => {
    for (const p of find("intern").people) expect(titleOf(p)).toMatch(/intern/);
  });

  it("abbreviations: sde, ceo, ux, ml engineer", () => {
    expect(find("sde").total).toBeGreaterThan(20);
    expect(find("ceo").people[0].position).toMatch(/ceo|chief executive/i);
    expect(find("ux").people.length).toBeGreaterThan(0);
    expect(find("ml engineer").people.length).toBeGreaterThan(0);
  });

  it("a single role word ranks that title above the rest of its area", () => {
    expect(find("marketing").people[0].position).toMatch(/marketing/i);
  });
});

describe("a company whose name contains the role", () => {
  it("still lists the people with that role first, with the company as a suggestion", () => {
    const withAccelerator = [...companies, { key: "product manager accelerator", name: "Product Manager Accelerator", count: 1 }];
    const r = searchEverything("product manager", { people, companies: withAccelerator, settings });
    expect(r.intent).toBe("people");
    expect(r.total).toBeGreaterThan(15);
    expect(r.people.length).toBe(6);
    expect(r.companies.map((c) => c.name)).toContain("Product Manager Accelerator");
  });
});

describe("companies", () => {
  it("an exact company name lists the company first and counts its people", () => {
    const r = find("google");
    expect(r.intent).toBe("company");
    expect(r.companies[0].name).toBe("Google");
    expect(r.total).toBeGreaterThanOrEqual(r.companies[0].count);
  });

  it("a part of a company name still offers it", () => {
    expect(find("iit").companies.map((c) => c.name)).toContain("IIT Delhi");
  });
});

describe("people by name", () => {
  it("a first or last name finds that person first", () => {
    const r = find("kabir");
    expect(r.intent).toBe("name");
    for (const p of r.people) expect(p.name.toLowerCase()).toContain("kabir");
    expect(find("nguyen").intent).toBe("name");
  });

  it("a full name narrows to that person", () => {
    const r = find("ava nguyen");
    expect(r.intent).toBe("name");
    expect(r.total).toBeLessThan(5);
    for (const p of r.people) expect(p.name.toLowerCase()).toBe("ava nguyen");
  });

  it("name plus company narrows further", () => {
    const r = find("nguyen google");
    expect(r.total).toBeGreaterThan(0);
    for (const p of r.people) expect(`${p.name} ${p.company}`.toLowerCase()).toMatch(/nguyen.*google|google.*nguyen/);
  });
});

describe("natural phrases", () => {
  it("engineer at amazon", () => {
    const r = find("engineer at amazon");
    expect(r.understood.join(" ")).toMatch(/amazon/i);
    expect(r.total).toBeGreaterThan(5);
    for (const p of r.people) expect(p.company).toMatch(/amazon/i);
  });

  it("mckinsey consultant", () => {
    const r = find("mckinsey consultant");
    expect(r.total).toBeGreaterThan(3);
    for (const p of r.people) expect(p.company).toMatch(/mckinsey/i);
  });

  it("not contacted founders", () => {
    const r = find("not contacted founders");
    expect(r.understood.length).toBeGreaterThan(1);
    expect(r.total).toBeGreaterThan(5);
  });

  it("a nearly-right phrase drops the least important word instead of showing nothing", () => {
    const r = find("senior product manager at google");
    expect(r.total).toBeGreaterThan(0);
    expect(r.dropped.length).toBeGreaterThan(0);
    for (const p of r.people) expect(titleOf(p)).toMatch(/product/);
  });

  it("founders in fintech keeps founders rather than turning into fintech", () => {
    const r = find("founders in fintech");
    expect(r.total).toBeGreaterThan(0);
    for (const p of r.people) expect(titleOf(p)).toMatch(/founder|ceo|chief|executive|entrepreneur/);
  });
});

describe("no invented results", () => {
  it("a search with nothing behind it finds nothing", () => {
    const r = find("xyzzy");
    expect(r.intent).toBe("none");
    expect(r.total).toBe(0);
    expect(r.people).toEqual([]);
  });

  it("a status that nobody has yet is an honest zero, not everyone", () => {
    const r = find("people who replied");
    expect(r.total).toBe(0);
    expect(r.understood.length).toBeGreaterThan(0);
  });

  it("one character searches nothing", () => {
    expect(find("a").total).toBe(0);
  });
});

describe("typos", () => {
  it("corrects a misspelt company only when nothing matched", () => {
    const r = find("googel");
    expect(r.shownFor).toBe("google");
    expect(r.companies[0].name).toBe("Google");
  });

  it("corrects a misspelt role", () => {
    expect(find("recruter").shownFor).toBe("recruiter");
  });

  it("leaves a correct search alone", () => {
    expect(find("google").shownFor).toBeUndefined();
    expect(correctTypos("google", people, companies)).toBeNull();
  });
});

describe("matcher", () => {
  it("stopwords do not have to appear", () => {
    expect(tokenizeQuery("people who work at google").words).toEqual(["google"]);
  });

  it("keeps the words when everything is a stopword", () => {
    expect(tokenizeQuery("who").words).toEqual(["who"]);
  });

  it("tries whole words before word starts and partial words", () => {
    const international = people.find((p) => /international/i.test(p.company) && !/intern|internship/i.test(p.position));
    expect(international).toBeDefined();
    expect(makeTextMatcher("intern", "whole")!(international!)).toBe(0);
    expect(makeTextMatcher("intern", "start")!(international!)).toBeGreaterThan(0);
  });

  it("a word start still finds people while typing", () => {
    expect(applyFilters(people, { q: "engin" }, settings).length).toBeGreaterThan(5);
    expect(applyFilters(people, { q: "kab" }, settings).some((p) => /kabir/i.test(p.name))).toBe(true);
  });
});
