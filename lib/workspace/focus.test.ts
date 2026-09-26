import { describe, expect, it } from "vitest";
import { parseConnectionsCsv } from "../analyzer";
import { generateSampleCsv } from "../sample";
import { autoClassifyAll, buildPeople } from "./build";
import { defaultSettings } from "./defaults";
import { applyFilters } from "./filters";
import { focusFilters, focusIsUseful } from "./focus";
import type { Person, Settings } from "./types";

function sample(): { people: Person[]; settings: Settings } {
  const rows = parseConnectionsCsv(generateSampleCsv(640));
  const settings = defaultSettings();
  return { people: buildPeople(rows, autoClassifyAll(rows), {}, settings), settings };
}

describe("networking focus", () => {
  it("says nothing is set before the user chooses", () => {
    const { settings } = sample();
    expect(focusIsUseful(settings)).toBe(false);
    expect(focusFilters(settings)).toEqual({});
  });

  it("turns a job goal into people who can actually help with a job", () => {
    const { people, settings } = sample();
    settings.focus = { goals: ["job"], direction: "", confirmedAt: "x" };
    const f = focusFilters(settings);
    expect(f.primaries).toContain("recruiters");
    const matched = applyFilters(people, f, settings);
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.every((p) => p.primary === "recruiters")).toBe(true);
  });

  it("widens rather than narrows when several goals are picked", () => {
    const { people, settings } = sample();
    settings.focus = { goals: ["job"], direction: "", confirmedAt: "x" };
    const one = applyFilters(people, focusFilters(settings), settings).length;
    settings.focus = { goals: ["job", "research", "building"], direction: "", confirmedAt: "x" };
    const many = applyFilters(people, focusFilters(settings), settings).length;
    expect(many).toBeGreaterThan(one);
  });

  it("never overrides areas the user named themselves", () => {
    const { settings } = sample();
    settings.goals.domains = ["finance"];
    settings.focus = { goals: ["job"], direction: "", confirmedAt: "x" };
    const f = focusFilters(settings);
    expect(f.domains).toEqual(["finance"]);
    expect(f.primaries).toBeUndefined();
  });
});
