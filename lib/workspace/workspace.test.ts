import { describe, expect, it } from "vitest";
import { parseConnectionsCsv } from "../analyzer";
import { titleKey } from "../intelligence";
import { generateSampleCsv } from "../sample";
import { autoClassifyAll, buildPeople, companyMatches, statusChangePatch } from "./build";
import { buildFollowUpCalendar } from "./calendar";
import { addDays, dueBucket } from "./dates";
import { defaultSettings } from "./defaults";
import { applyFilters, broaden, INTENTS, parseQuery } from "./filters";
import { followUpBuckets, groupCompanies, healthCounts } from "./insights";
import { readableRole, renderTemplate, researchUrl } from "./outreach";

const rows = parseConnectionsCsv(generateSampleCsv(640));
const cache = autoClassifyAll(rows);

describe("buildPeople", () => {
  it("keeps manual classification over rules and automatic results", () => {
    const settings = defaultSettings();
    const target = rows.find((r) => r.position === "Growth Marketer") ?? rows[0];
    settings.rules.push({ id: "r", match: "exact", pattern: titleKey(target.position), example: target.position, set: { domain: "sales", fn: "sales" }, createdAt: "" });
    const people = buildPeople(rows, cache, { [target.id]: { classification: { domain: "strategy", fn: "business-operations", role: "Chief of Staff" } } }, settings);
    const p = people.find((x) => x.id === target.id)!;
    expect(p).toMatchObject({ domain: "strategy", role: "Chief of Staff", classSource: "manual", confidence: 100 });
    const other = people.find((x) => x.position === target.position && x.id !== target.id);
    if (other) expect(other.classSource).toBe("rule");
  });

  it("marks target companies and scores priority transparently", () => {
    const settings = defaultSettings();
    settings.targetCompanies = ["Google"];
    settings.goals.domains = ["product"];
    const people = buildPeople(rows, cache, {}, settings);
    const pm = people.find((p) => p.company === "Google" && p.domain === "product")!;
    expect(pm.isTarget).toBe(true);
    expect(pm.priority).toBe("high");
    expect(pm.priorityReasons.join(" ")).toMatch(/target company/);
  });
});

describe("adding more data", () => {
  /** Mirrors the store: every imported file is parsed, newest row wins per person. */
  const mergeFiles = (csvs: string[]) => {
    const merged = new Map<string, ReturnType<typeof parseConnectionsCsv>[number]>();
    for (const csv of csvs) for (const r of parseConnectionsCsv(csv)) merged.set(r.id, r);
    return [...merged.values()];
  };

  it("merges a second export without duplicating anyone", () => {
    const a = generateSampleCsv(120, 1);
    const b = generateSampleCsv(120, 2);
    const both = mergeFiles([a, b]);
    const idsA = new Set(parseConnectionsCsv(a).map((r) => r.id));
    const idsB = new Set(parseConnectionsCsv(b).map((r) => r.id));

    expect(both.length).toBe(new Set([...idsA, ...idsB]).size);
    expect(both.length).toBeGreaterThan(idsA.size);
    expect(new Set(both.map((r) => r.id)).size).toBe(both.length);
  });

  it("re-importing the same export changes nothing", () => {
    const a = generateSampleCsv(120, 1);
    expect(mergeFiles([a, a]).length).toBe(parseConnectionsCsv(a).length);
  });

  it("keeps your statuses and notes on people who came back in the new file", () => {
    const a = generateSampleCsv(120, 1);
    const settings = defaultSettings();
    const first = parseConnectionsCsv(a);
    const edited = first[0].id;
    const myWork = { [edited]: { status: "interested", notes: "Met at the campus talk" } };

    const after = buildPeople(mergeFiles([a, generateSampleCsv(120, 2)]), autoClassifyAll(mergeFiles([a, generateSampleCsv(120, 2)])), myWork, settings);
    const person = after.find((p) => p.id === edited)!;
    expect(person.status).toBe("interested");
    expect(person.notes).toBe("Met at the campus talk");
  });

  it("classifies everyone again after the merge, including the new people", () => {
    const merged = mergeFiles([generateSampleCsv(120, 1), generateSampleCsv(120, 2)]);
    const people = buildPeople(merged, autoClassifyAll(merged), {}, defaultSettings());
    expect(people.length).toBe(merged.length);
    expect(people.every((p) => p.domain && p.seniority)).toBe(true);
  });
});

describe("filters", () => {
  const settings = defaultSettings();
  const people = buildPeople(rows, cache, {}, settings);

  it("combines domain, seniority and status filters", () => {
    const result = applyFilters(people, { domains: ["strategy"], seniorities: ["Mid-level", "Senior"], statuses: ["not_contacted"] }, settings);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.domain === "strategy" && ["Mid-level", "Senior"].includes(p.seniority))).toBe(true);
  });

  it("parses the phrasings people actually type", () => {
    const companies = groupCompanies(people, settings).map((c) => ({ key: c.key, name: c.name }));
    const p = (q: string) => parseQuery(q, companies, { schools: ["NIT Warangal"] }).filters;

    expect(p("senior product managers")).toMatchObject({ functions: ["product-management"], seniorities: expect.arrayContaining(["Senior"]) });
    expect(p("product managers at amazon")).toMatchObject({ functions: ["product-management"], companies: ["amazon"] });
    expect(p("supply chain people i haven't contacted")).toMatchObject({ functions: expect.arrayContaining(["supply-chain"]), statuses: ["not_contacted"] });
    expect(p("founders")).toMatchObject({ audiences: ["founders"] });
    expect(p("founders i haven't contacted")).toMatchObject({ audiences: ["founders"], statuses: ["not_contacted"] });
    expect(p("people i've spoken to in operations")).toMatchObject({ domains: ["operations"], history: "messaged" });
    expect(p("senior people in technology")).toMatchObject({ domains: ["technology"], seniorities: expect.arrayContaining(["Senior"]) });
    expect(p("alumni in finance")).toMatchObject({ audiences: ["alumni"], domains: ["finance"] });
    expect(p("people from nit warangal working in product")).toMatchObject({ audiences: ["alumni"], domains: ["product"] });
    expect(p("recruiters at target companies")).toMatchObject({ audiences: ["recruiters"], targetOnly: true });
    expect(p("founders in saas")).toMatchObject({ audiences: ["founders"], industries: ["Technology"] });

    // Nothing understood should be left behind as noise.
    expect(p("founders")).not.toHaveProperty("q");
    expect(p("senior people in technology").q).toBeUndefined();
  });

  it("broadens a dead-end search by dropping the narrowest filter", () => {
    const f = { domains: ["product"], seniorities: ["VP"], roles: ["Nobody Has This Role"], statuses: ["not_contacted"] };
    const first = broaden(f, settings)!;
    expect(first.filters.roles).toBeUndefined();
    expect(first.removed).toContain("Nobody Has This Role");

    const second = broaden(first.filters, settings)!;
    expect(second.filters.seniorities).toBeUndefined();

    // Domain is the last thing to go, and an empty search cannot be broadened.
    expect(broaden({ domains: ["product"] }, settings)!.filters.domains).toBeUndefined();
    expect(broaden({}, settings)).toBeNull();
  });

  it("guided answers and typed searches produce the same filters", () => {
    const typed = parseQuery("founders i haven't contacted", []).filters;
    const guided = { ...INTENTS.find((i) => i.id === "founders")!.filters, statuses: ["not_contacted"] };
    expect(applyFilters(people, typed, settings).map((p) => p.id).sort())
      .toEqual(applyFilters(people, guided, settings).map((p) => p.id).sort());
  });

  it("the founders intent only returns people the classifier marked as founders", () => {
    const founders = applyFilters(people, INTENTS.find((i) => i.id === "founders")!.filters, settings);
    expect(founders.length).toBeGreaterThan(0);
    expect(founders.every((p) => p.isFounder)).toBe(true);
  });

  it("parses natural-language search into filters", () => {
    const companies = groupCompanies(people, settings).map((c) => ({ key: c.key, name: c.name }));
    const q = parseQuery("senior people in supply chain", companies);
    expect(q.filters.functions).toContain("supply-chain");
    expect(q.filters.seniorities).toContain("Director / Head");
    expect(q.filters.q).toBeUndefined();

    const g = parseQuery("product managers at google not contacted", companies);
    expect(g.filters.companies).toContain("google");
    expect(g.filters.companies).not.toContain("microsoft");
    expect(g.filters.functions).toContain("product-management");
    expect(g.filters.statuses).toEqual(["not_contacted"]);
  });
});

describe("outreach", () => {
  it("status changes set contact and follow-up dates", () => {
    const settings = defaultSettings();
    const patch = statusChangePatch({}, "contacted", settings, "2026-09-16");
    expect(patch).toMatchObject({ status: "contacted", lastContactedAt: "2026-09-16", followUpAt: "2026-09-21" });
    expect(statusChangePatch({ followUpAt: "2026-09-20" }, "closed", settings, "2026-09-16").followUpAt).toBe("");
  });

  it("buckets follow-ups", () => {
    expect(dueBucket("2026-09-15", "2026-09-16")).toBe("overdue");
    expect(dueBucket(addDays("2026-09-16", 1), "2026-09-16")).toBe("tomorrow");
    const settings = defaultSettings();
    const people = buildPeople(rows, cache, { [rows[0].id]: { status: "contacted", followUpAt: "2020-01-01" } }, settings);
    expect(followUpBuckets(people, settings).overdue.map((p) => p.id)).toEqual([rows[0].id]);
  });

  it("renders templates and leaves visible placeholders for missing values", () => {
    expect(renderTemplate("Hi {{first_name}}, {{ask}}", { first_name: "Asha" })).toBe("Hi Asha, [ask]");
  });

  it("builds research links only from the given person", () => {
    expect(researchUrl("careers", { name: "A B", company: "Blinkit", role: "Category Manager", position: "" })).toContain("Blinkit");
  });

  it("company matching tolerates suffixes", () => {
    expect(companyMatches("blinkit formerly grofers", ["Blinkit"])).toBe(true);
    expect(companyMatches("blinkitx", ["Blinkit"])).toBe(false);
  });

  it("counts data health issues", () => {
    const settings = defaultSettings();
    const h = healthCounts(buildPeople(rows, cache, {}, settings));
    expect(h["missing-position"]).toBeGreaterThan(0);
    expect(h["missing-email"]).toBe(640);
  });
});

describe("message variables", () => {
  it("uses the readable part of a headline, not the whole thing", () => {
    expect(readableRole({ position: "Product Manager @ Acme | Ex-Google | Angel investor", role: "Product Manager" })).toBe("Product Manager @ Acme");
    expect(readableRole({ position: "Client Acquisition & Partnership Director at a very long headline that keeps going and going for ages", role: "Business Development Manager" })).toBe("Business Development Manager");
    expect(readableRole({ position: "", role: "Software Engineer" })).toBe("Software Engineer");
  });
});

describe("follow-up calendar", () => {
  it("writes one all-day event per scheduled follow-up, with a reminder", () => {
    const settings = defaultSettings();
    const people = buildPeople(rows, cache, {
      [rows[0].id]: { status: "contacted", followUpAt: "2026-09-21", nextAction: "Ask about the referral" },
      [rows[1].id]: { status: "closed", followUpAt: "2026-09-22" },
    }, settings);
    const ics = buildFollowUpCalendar(people, settings, "2026-09-16");
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1); // the closed one is skipped
    expect(ics).toContain("DTSTART;VALUE=DATE:20260921");
    expect(ics).toContain("Ask about the referral");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });
});
