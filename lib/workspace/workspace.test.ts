import { describe, expect, it } from "vitest";
import { parseConnectionsCsv } from "../analyzer";
import { titleKey } from "../intelligence";
import { profileKey } from "../archive";
import { generateSampleCsv } from "../sample";
import { archiveSeedPatches, autoClassifyAll, buildPeople, companyMatches, statusChangePatch } from "./build";
import { buildFollowUpCalendar } from "./calendar";
import { addDays, dueBucket } from "./dates";
import { defaultSettings } from "./defaults";
import { applyFilters, broaden, INTENTS, parseQuery } from "./filters";
import { followUpBuckets, groupCompanies, healthCounts } from "./insights";
import { readableRole, renderTemplate, researchUrl, shortenHeadline, templateVars } from "./outreach";
import { INTENT_MAP, OUTREACH_INTENTS } from "./intents";

const rows = parseConnectionsCsv(generateSampleCsv(640));
const cache = autoClassifyAll(rows);

describe("buildPeople", () => {
  it("keeps manual classification over rules and automatic results", () => {
    const settings = defaultSettings();
    const target = rows.find((r) => r.position === "Growth Marketer") ?? rows[0];
    settings.rules.push({ id: "r", match: "exact", pattern: titleKey(target.position), example: target.position, set: { bucket: "sales-and-business-development", section: "sales", roleId: "sales-executive" }, createdAt: "" });
    const people = buildPeople(rows, cache, { [target.id]: { classification: { bucket: "business-and-consulting", section: "founders-office-and-chief-of-staff", roleId: "chief-of-staff" } } }, settings);
    const p = people.find((x) => x.id === target.id)!;
    expect(p).toMatchObject({ bucket: "business-and-consulting", roleId: "chief-of-staff", classSource: "manual", certainty: "high" });
    const other = people.find((x) => x.position === target.position && x.id !== target.id);
    if (other) expect(other.classSource).toBe("rule");
  });

  it("marks target companies and scores priority transparently", () => {
    const settings = defaultSettings();
    settings.targetCompanies = ["Google"];
    settings.goals.buckets = ["product-and-design"];
    const people = buildPeople(rows, cache, {}, settings);
    const pm = people.find((p) => p.company === "Google" && p.bucket === "product-and-design")!;
    expect(pm.isTarget).toBe(true);
    expect(["high", "medium"]).toContain(pm.priority);
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
    expect(people.every((p) => p.certainty && p.evidence.length)).toBe(true);
  });
});

describe("filters", () => {
  const settings = defaultSettings();
  const people = buildPeople(rows, cache, {}, settings);

  it("combines role area, sector and status filters", () => {
    const result = applyFilters(people, { buckets: ["business-and-consulting"], statuses: ["not_contacted"] }, settings);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.bucket === "business-and-consulting" && p.status === "not_contacted")).toBe(true);
  });

  it("parses the phrasings people actually type", () => {
    const companies = groupCompanies(people, settings).map((c) => ({ key: c.key, name: c.name }));
    const p = (q: string) => parseQuery(q, companies, { schools: ["NIT Warangal"] }).filters;

    // Seniority words survive as ordinary text: the product no longer classifies on them.
    expect(p("senior product managers")).toMatchObject({ roles: ["product-manager"] });
    expect(p("product managers at amazon")).toMatchObject({ roles: ["product-manager"], companies: ["amazon"] });
    expect(p("supply chain people i haven't contacted")).toMatchObject({ sections: ["supply-chain"], statuses: ["not_contacted"] });
    expect(p("founders")).toMatchObject({ audiences: ["founders"] });
    expect(p("founders i haven't contacted")).toMatchObject({ audiences: ["founders"], statuses: ["not_contacted"] });
    expect(p("people i've spoken to in operations")).toMatchObject({ history: "messaged" });
    expect(p("alumni in finance")).toMatchObject({ audiences: ["alumni"] });
    expect(p("recruiters at target companies")).toMatchObject({ audiences: ["recruiters"], targetOnly: true });
    expect(p("people in manufacturing")).toMatchObject({ sectors: ["manufacturing"] });
    expect(p("people in financial services")).toMatchObject({ sectors: ["financial"] });

    // Nothing understood should be left behind as noise.
    expect(p("founders")).not.toHaveProperty("q");
  });

  it("broadens a dead-end search by dropping the narrowest filter", () => {
    const f = { buckets: ["product-and-design"], roles: ["Nobody Has This Role"], statuses: ["not_contacted"] };
    const first = broaden(f, settings)!;
    expect(first.filters.roles).toBeUndefined();

    // The role area is the last thing to go, and an empty search cannot be broadened.
    expect(broaden({ buckets: ["product-and-design"] }, settings)!.filters.buckets).toBeUndefined();
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
    const q = parseQuery("people in supply chain", companies);
    expect(q.filters.sections).toContain("supply-chain");
    expect(q.filters.q).toBeUndefined();

    const g = parseQuery("product managers at google not contacted", companies);
    expect(g.filters.companies).toContain("google");
    expect(g.filters.companies).not.toContain("microsoft");
    expect(g.filters.roles).toContain("product-manager");
    expect(g.filters.statuses).toEqual(["not_contacted"]);
  });
});

describe("outreach", () => {
  it("status changes set contact and follow-up dates", () => {
    const settings = defaultSettings();
    const patch = statusChangePatch({}, "contacted", settings, "2026-09-16");
    // Follow-ups default to three days after the status change.
    expect(patch).toMatchObject({ status: "contacted", lastContactedAt: "2026-09-16", followUpAt: "2026-09-19" });
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
    expect(researchUrl("careers", { name: "A B", company: "Blinkit", roleLabel: "Category Manager", position: "" })).toContain("Blinkit");
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
    expect(readableRole({ position: "Product Manager @ Acme | Ex-Google | Angel investor", roleLabel: "Product Manager" })).toBe("Product Manager @ Acme");
    expect(readableRole({ position: "Client Acquisition & Partnership Director at a very long headline that keeps going and going for ages", roleLabel: "Business Development Manager" })).toBe("Business Development Manager");
    expect(readableRole({ position: "", roleLabel: "Software Engineer" })).toBe("Software Engineer");
  });
});

describe("outreach presets", () => {
  const HEADLINE =
    "Intern @Closefuture | President @180DC NITW | Formula Student | Research - IIM Calcutta | HPAIR 25 | Ex- Care Netram";

  it("never pastes a whole LinkedIn headline into a message", () => {
    // This was the bug: the user's own headline went in verbatim and blew the limit.
    expect(shortenHeadline(HEADLINE)).toBe("Intern @Closefuture");
    expect(shortenHeadline(HEADLINE).length).toBeLessThan(71);
    expect(shortenHeadline("")).toBe("");
    expect(shortenHeadline("a final-year student at NIT Warangal")).toBe("a final-year student at NIT Warangal");
  });

  it("offers exactly three reasons to reach out", () => {
    expect(OUTREACH_INTENTS.map((i) => i.id)).toEqual(["explore_connect", "referral", "job_internship"]);
  });

  it("fills what it knows and leaves a visible blank for what it does not", () => {
    const settings = defaultSettings();
    settings.profile.name = "Rishi";
    settings.profile.background = HEADLINE;
    const people = buildPeople(rows, cache, {}, settings);
    const person = people.find((p) => p.company && p.section)!;

    const text = renderTemplate(INTENT_MAP.referral.body, templateVars(person, settings));
    expect(text).toContain(`Hi ${person.firstName},`);
    expect(text).toContain(person.company);
    expect(text).toContain("Intern @Closefuture");
    expect(text).not.toContain("180DC NITW");
    // Nothing is invented: the unknown role stays an editable blank.
    expect(text).toContain("[role]");
  });
});

describe("archive activity", () => {
  it("is dated by the conversation, not by when it was imported", () => {
    // The bug: every imported thread showed today's date, so a list of activity
    // read as one import event rather than as history.
    const person = rows[0];
    const { patches } = archiveSeedPatches(
      rows,
      {
        [profileKey(person.url)]: {
          messageCount: 3,
          lastMessageAt: "2021-11-24",
          lastOutgoingAt: "2021-11-24",
          lastIncomingAt: "2021-11-20",
          theyReplied: true,
          youMessaged: true,
          invited: null,
          invitedAt: "",
          note: "",
          messages: [],
        },
      },
      {},
    );

    const entry = patches[person.id]?.activity?.find((a) => a.kind === "message");
    expect(entry).toBeDefined();
    expect(entry!.at).toBe("2021-11-24");
    expect(entry!.at.slice(0, 4)).not.toBe(String(new Date().getFullYear()));
    // The date belongs in the timestamp, not repeated in the sentence.
    expect(entry!.text).toBe("3 messages in your LinkedIn archive");
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
