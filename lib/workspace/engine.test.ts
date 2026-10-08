import { describe, expect, it } from "vitest";
import { parseConnectionsCsv } from "../analyzer";
import { generateSampleCsv } from "../sample";
import { autoClassifyAll, buildCorpus, buildPeople, patchPerson } from "./build";
import { defaultSettings } from "./defaults";
import { createEngine } from "./engine";
import type { PersonRecord } from "./types";

const csv = generateSampleCsv(300, 11);
const rows = parseConnectionsCsv(csv);
const cache = autoClassifyAll(rows);
const corpus = buildCorpus(rows);
const settings = defaultSettings();
settings.targetCompanies = ["Google"];
settings.goals.categories = ["engineering"];

/** Plain-data view so Dates and key order do not matter. */
const plain = (v: unknown) => JSON.parse(JSON.stringify(v));

describe("patchPerson", () => {
  const edits: Record<string, PersonRecord> = {
    status: { status: "contacted", lastContactedAt: "2026-01-02", followUpAt: "2026-01-09", updatedAt: "x" },
    closed: { status: "closed", followUpAt: "2026-02-01" },
    manualPriority: { priority: "high" },
    notes: { notes: "Met at the fair", userTags: ["alumni-event"], location: "Pune" },
    personal: { personalization: { why: "loved the talk", ask: "advice" }, draft: "Hi", channel: "Email", sequenceStep: 2 },
    nextAction: { nextAction: "Send resume", status: "to_contact" },
  };

  for (const [name, rec] of Object.entries(edits)) {
    it(`gives the same person as a full rebuild: ${name}`, () => {
      const target = rows[7];
      const before = buildPeople(rows, cache, {}, settings, null, corpus);
      const full = buildPeople(rows, cache, { [target.id]: rec }, settings, null, corpus);
      const i = before.findIndex((p) => p.id === target.id);
      expect(plain(patchPerson(before[i], rec, settings))).toEqual(plain(full[i]));
    });
  }

  it("also matches when the previous record is cleared", () => {
    const target = rows[3];
    const withRec = buildPeople(rows, cache, { [target.id]: edits.status }, settings, null, corpus);
    const clean = buildPeople(rows, cache, {}, settings, null, corpus);
    const i = withRec.findIndex((p) => p.id === target.id);
    expect(plain(patchPerson(withRec[i], {}, settings))).toEqual(plain(clean[i]));
  });
});

describe("engine", () => {
  it("builds the same people as calling buildPeople directly", () => {
    const run = createEngine();
    const res = run({ dataKey: "a", csvFiles: [csv], records: {}, settings, archive: null });
    expect(res.rows?.length).toBe(rows.length);
    expect(plain(res.people)).toEqual(plain(buildPeople(rows, cache, {}, settings, null, corpus)));
  });

  it("reuses what it holds for the same dataset and only sends rows once", () => {
    const run = createEngine();
    run({ dataKey: "a", csvFiles: [csv], records: {}, settings, archive: null });
    const again = run({ dataKey: "a", records: { [rows[0].id]: { status: "contacted" } }, settings });
    expect(again.rows).toBeUndefined();
    expect(again.people.find((p) => p.id === rows[0].id)?.status).toBe("contacted");
  });

  it("asks for the files when the dataset changed", () => {
    const run = createEngine();
    run({ dataKey: "a", csvFiles: [csv], records: {}, settings, archive: null });
    expect(() => run({ dataKey: "b", records: {}, settings })).toThrow();
  });

  it("merges several files and keeps one row per person", () => {
    const run = createEngine();
    const res = run({ dataKey: "m", csvFiles: [csv, csv], records: {}, settings, archive: null });
    expect(res.people.length).toBe(rows.length);
  });
});
