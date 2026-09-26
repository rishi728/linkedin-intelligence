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
    expect(f.buckets).toContain("people-and-talent");
    const matched = applyFilters(people, f, settings);
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.every((p) => p.bucket === "people-and-talent")).toBe(true);
  });

  it("widens rather than narrows when several goals are picked", () => {
    const { people, settings } = sample();
    settings.focus = { goals: ["job"], direction: "", confirmedAt: "x" };
    const one = applyFilters(people, focusFilters(settings), settings).length;
    settings.focus = { goals: ["job", "research", "networking"], direction: "", confirmedAt: "x" };
    const many = applyFilters(people, focusFilters(settings), settings).length;
    expect(many).toBeGreaterThan(one);
  });

  it("never overrides areas the user named themselves", () => {
    const { settings } = sample();
    settings.goals.buckets = ["finance-and-investment"];
    settings.focus = { goals: ["job"], direction: "", confirmedAt: "x" };
    const f = focusFilters(settings);
    // The user's own area wins; the goal does not widen past it.
    expect(f.buckets).toEqual(["finance-and-investment"]);
  });
});
