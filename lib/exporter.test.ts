import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parseConnectionsCsv } from "./analyzer";
import { buildTrackerWorkbook, DEFAULT_EXPORT_COLUMNS, EXPORT_COLUMNS } from "./exporter";
import { generateSampleCsv } from "./sample";
import { autoClassifyAll, buildPeople } from "./workspace/build";
import { defaultSettings } from "./workspace/defaults";

async function load(buffer: ArrayBuffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return wb;
}

describe("buildTrackerWorkbook", () => {
  const rows = parseConnectionsCsv(generateSampleCsv(120));
  const settings = defaultSettings();
  const first = rows[0];
  const people = buildPeople(rows, autoClassifyAll(rows), {
    [first.id]: { status: "contacted", followUpAt: "2026-09-20", lastContactedAt: "2026-09-15", notes: "Met at a meetup", priority: "high" },
  }, settings);

  it("writes only the chosen columns, in order, with a frozen, filterable header", async () => {
    const wb = await load(await buildTrackerWorkbook(people, settings, { columns: ["name", "status", "followup", "notes"], title: "Test", includeSummary: false }));
    const ws = wb.getWorksheet("Outreach Tracker")!;
    expect(ws.getRow(1).values).toEqual([undefined, "Name", "Status", "Follow-up Date", "Notes"]);
    expect(ws.rowCount).toBe(people.length + 1);
    expect(ws.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
    expect(ws.autoFilter).toBeTruthy();
    const row = ws.getRow(2);
    expect(row.getCell(2).value).toBe("Contacted");
    expect(row.getCell(3).value).toBeInstanceOf(Date);
    expect(row.getCell(4).value).toBe("Met at a meetup");
  });

  it("adds dropdown validation for status, priority, channel and opportunity type", async () => {
    const wb = await load(await buildTrackerWorkbook(people, settings, { columns: ["name", "status", "priority", "channel", "opportunity"], title: "T", includeSummary: true }));
    expect(wb.worksheets.map((w) => w.name)).toEqual(["Summary", "Outreach Tracker", "Lists"]);
    const ws = wb.getWorksheet("Outreach Tracker")!;
    for (const col of ["B", "C", "D", "E"]) {
      const v = ws.getCell(`${col}5`).dataValidation;
      expect(v?.type, col).toBe("list");
    }
    const lists = wb.getWorksheet("Lists")!;
    expect(lists.getCell("A2").value).toBe("Not contacted");
  });

  it("knows every default column", () => {
    for (const k of DEFAULT_EXPORT_COLUMNS) expect(EXPORT_COLUMNS.some((c) => c.key === k)).toBe(true);
  });
});
