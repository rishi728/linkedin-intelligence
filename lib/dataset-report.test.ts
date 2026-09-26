import { existsSync, readFileSync, writeFileSync } from "fs";
import { expect, it } from "vitest";
import { parseConnectionsCsv } from "./analyzer";
import { classifyAuto, domainLabel, functionLabel } from "./intelligence";

// Point this at a real LinkedIn export to get a classification report in report.txt.
// Skipped automatically when the file is not there, so CI and other machines stay green.
const CSV = process.env.NETLENS_CONNECTIONS ?? "C:/Users/agraw/Downloads/Basic_LinkedInDataExport_09-15-2026.zip/Connections.csv";

function tally<T>(items: T[], key: (t: T) => string) {
  const m = new Map<string, number>();
  for (const i of items) m.set(key(i), (m.get(key(i)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

it.skipIf(!existsSync(CSV))("writes a classification report for the real dataset", () => {
  const rows = parseConnectionsCsv(readFileSync(CSV, "utf8"));
  const t0 = Date.now();
  const people = rows.map((r) => ({ r, c: classifyAuto(r.position, r.company) }));
  const ms = Date.now() - t0;

  const L: string[] = [];
  const titled = rows.filter((r) => r.position.trim()).length;
  L.push(`Total connections      ${rows.length}`);
  L.push(`Titles populated       ${titled}`);
  L.push(`Unique raw titles      ${new Set(rows.map((r) => r.position.trim().toLowerCase())).size}`);
  L.push(`Unique normalized      ${new Set(people.map((p) => p.c.role)).size}`);
  L.push(`Domains used           ${new Set(people.map((p) => p.c.domain)).size}`);
  L.push(`Functions used         ${new Set(people.map((p) => p.c.fn)).size}`);
  L.push(`Classify time          ${ms} ms`);
  L.push(`Unclassified           ${people.filter((p) => p.c.domain === "unclassified").length}`);
  L.push(`Low confidence (<60)   ${people.filter((p) => p.c.domain !== "unclassified" && p.c.confidence < 60).length}`);
  L.push(`Student / campus       ${people.filter((p) => p.c.domain === "students").length}`);
  L.push(`  of which campus org  ${people.filter((p) => p.c.campusOrg).length}`);
  L.push(`Founders               ${people.filter((p) => p.c.isFounder).length}`);

  L.push("", "== BY DOMAIN ==");
  for (const [d, n] of tally(people, (p) => p.c.domain)) {
    const inD = people.filter((p) => p.c.domain === d);
    L.push(
      `${domainLabel(d).padEnd(30)} ${String(n).padStart(5)}  ${((n / rows.length) * 100).toFixed(1).padStart(5)}%  ` +
        `${new Set(inD.map((p) => p.c.fn)).size} fns  ${new Set(inD.map((p) => p.c.role)).size} roles  ` +
        `${new Set(inD.map((p) => p.r.company).filter(Boolean)).size} companies`,
    );
  }

  L.push("", "== TOP 60 RAW TITLES ==");
  for (const [title, n] of tally(rows, (r) => r.position.trim()).slice(0, 61)) {
    if (!title) continue;
    const p = people.find((x) => x.r.position.trim() === title)!;
    L.push(
      `${String(n).padStart(4)}  ${title.slice(0, 42).padEnd(42)} → ${p.c.role.slice(0, 30).padEnd(30)} | ${domainLabel(p.c.domain).slice(0, 20).padEnd(20)} | ${functionLabel(p.c.fn).slice(0, 26).padEnd(26)} | ${p.c.confidence}`,
    );
  }

  L.push("", "== LOWEST-CONFIDENCE TITLES (top 40 by frequency) ==");
  const weak = people.filter((p) => p.c.domain !== "unclassified" && p.c.confidence < 60);
  for (const [title, n] of tally(weak, (p) => p.r.position.trim()).slice(0, 40)) {
    const p = weak.find((x) => x.r.position.trim() === title)!;
    L.push(`${String(n).padStart(4)}  ${title.slice(0, 46).padEnd(46)} → ${p.c.role.slice(0, 28).padEnd(28)} | ${p.c.domain.padEnd(14)} | ${p.c.confidence}`);
  }

  L.push("", "== ROLE CLUSTERS PER DOMAIN (top 12 roles) ==");
  for (const [d] of tally(people, (p) => p.c.domain).slice(0, 12)) {
    L.push("", `${domainLabel(d).toUpperCase()}`);
    for (const [role, n] of tally(people.filter((p) => p.c.domain === d), (p) => p.c.role).slice(0, 12)) {
      L.push(`  ${role.padEnd(38)} ${n}`);
    }
  }

  writeFileSync("report.txt", L.join("\n"));
});

// --- Guided-search acceptance run over the real export ----------------------
it.skipIf(!existsSync(CSV))("walks the off-campus workflow on the real dataset", async () => {
  const { autoClassifyAll, buildPeople } = await import("./workspace/build");
  const { defaultSettings } = await import("./workspace/defaults");
  const { applyFilters, broaden, buildIntents, parseQuery } = await import("./workspace/filters");
  const { groupCompanies } = await import("./workspace/insights");

  const rows = parseConnectionsCsv(readFileSync(CSV, "utf8"));
  const settings = defaultSettings();
  settings.profile.schools = ["NIT Warangal"];
  const all = buildPeople(rows, autoClassifyAll(rows), {}, settings);
  const companies = groupCompanies(all, settings).map((c) => ({ key: c.key, name: c.name }));
  // Targets a student would actually pick: the biggest employers of the people
  // they're looking for, rather than the biggest employers overall.
  const SUPPLY_CHAIN = { sections: ["supply-chain", "procurement-sourcing", "logistics-planning"] };
  const supplyChain = applyFilters(all, SUPPLY_CHAIN, settings);
  const byCompany = new Map<string, number>();
  for (const p of supplyChain) if (p.company) byCompany.set(p.company, (byCompany.get(p.company) ?? 0) + 1);
  settings.targetCompanies = [...byCompany.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name);
  const people = buildPeople(rows, autoClassifyAll(rows), {}, settings);
  const n = (f: Parameters<typeof applyFilters>[1]) => applyFilters(people, f, settings).length;

  const L: string[] = ["== GUIDED FLOW: supply chain → targets → not contacted =="];
  const area = SUPPLY_CHAIN;
  const senior = { ...area };
  const targeted = { ...senior, targetOnly: true };
  const fresh = { ...targeted, statuses: ["not_contacted"], history: "never" as const };
  L.push(`Supply chain            ${n(area)}`);
  L.push(`  + senior and above    ${n(senior)}`);
  L.push(`  + target companies    ${n(targeted)}`);
  L.push(`  + never contacted     ${n(fresh)}`);

  // Each step can only narrow.
  expect(n(area)).toBeGreaterThanOrEqual(n(senior));
  expect(n(senior)).toBeGreaterThanOrEqual(n(targeted));
  expect(n(targeted)).toBeGreaterThanOrEqual(n(fresh));

  L.push("", "== TYPED SEARCHES ==");
  for (const q of [
    "founders i haven't contacted",
    "people i've spoken to in operations",
    "senior product managers",
    "product managers at google",
    "alumni in finance",
    "senior people in technology",
    "recruiters at target companies",
  ]) {
    const parsed = parseQuery(q, companies, { schools: settings.profile.schools });
    L.push(`${q.padEnd(40)} → ${parsed.understood.join(" · ").padEnd(46)} ${n(parsed.filters)} people`);
  }

  // The cards offered are built from this dataset, and each one has people behind it.
  const intents = buildIntents(people, settings);
  L.push("", "== CARDS BUILT FROM THIS DATASET ==");
  for (const i of intents) L.push(`${i.label.padEnd(30)} ${String(i.count).padStart(5)}  ${i.hint}`);
  expect(intents.length).toBeGreaterThan(4);
  for (const i of intents) expect(applyFilters(people, i.filters, settings).length).toBe(i.count);

  // Founders searches must only ever return people the classifier flagged.
  const founders = applyFilters(people, parseQuery("founders i haven't contacted", companies).filters, settings);
  expect(founders.every((p) => p.isFounder)).toBe(true);
  expect(founders.every((p) => p.status === "not_contacted")).toBe(true);
  L.push("", `Founders, never contacted: ${founders.length}, all isFounder: true`);

  // Conversation history really is used.
  const spoken = applyFilters(people, parseQuery("people i've spoken to in operations", companies).filters, settings);
  expect(spoken.every((p) => p.bucket === "operations-and-supply-chain")).toBe(true);

  // A dead end is always one click from results.
  const dead = { ...fresh, roles: ["Role That Does Not Exist"] };
  expect(n(dead)).toBe(0);
  expect(broaden(dead, settings)!.filters.roles).toBeUndefined();

  writeFileSync("acceptance.txt", L.join("\n"));
}, 30_000);
