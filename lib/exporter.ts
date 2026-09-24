// Excel outreach tracker. Built in the browser with ExcelJS (loaded on demand).

import type { Workbook, Worksheet } from "exceljs";
import { domainLabel, functionLabel } from "./intelligence";
import { CHANNELS, OPPORTUNITY_TYPES } from "./workspace/defaults";
import { parseISODate } from "./workspace/dates";
import type { Person, Settings } from "./workspace/types";

export interface ExportColumn {
  key: string;
  label: string;
  width: number;
  kind?: "date" | "link" | "wrap" | "list";
  get: (p: Person, s: Settings) => string | Date | null;
}

const iso = (v: string) => (v ? parseISODate(v) : null);

export const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "name", label: "Name", width: 24, get: (p) => p.name },
  { key: "company", label: "Company", width: 26, get: (p) => p.company },
  { key: "position", label: "Position", width: 36, kind: "wrap", get: (p) => p.position },
  { key: "domain", label: "Domain", width: 22, get: (p) => domainLabel(p.domain) },
  { key: "function", label: "Function", width: 26, get: (p) => functionLabel(p.fn) },
  { key: "role", label: "Role", width: 26, get: (p) => p.role },
  { key: "seniority", label: "Seniority", width: 15, get: (p) => p.seniority },
  { key: "industry", label: "Industry", width: 24, get: (p) => p.industry },
  { key: "location", label: "Location", width: 16, get: (p) => p.location },
  { key: "email", label: "Email", width: 26, get: (p) => p.email },
  { key: "linkedin", label: "LinkedIn", width: 14, kind: "link", get: (p) => p.url },
  { key: "status", label: "Status", width: 18, kind: "list", get: (p, s) => s.statuses.find((x) => x.id === p.status)?.label ?? p.status },
  { key: "priority", label: "Priority", width: 10, kind: "list", get: (p) => p.priority[0].toUpperCase() + p.priority.slice(1) },
  { key: "channel", label: "Channel", width: 14, kind: "list", get: (p) => p.channel },
  { key: "opportunity", label: "Opportunity Type", width: 18, kind: "list", get: (p) => p.opportunityType },
  { key: "contacted", label: "Date Contacted", width: 14, kind: "date", get: (p) => iso(p.lastContactedAt) },
  { key: "followup", label: "Follow-up Date", width: 14, kind: "date", get: (p) => iso(p.followUpAt) },
  { key: "nextAction", label: "Next Action", width: 26, kind: "wrap", get: (p) => p.nextAction },
  { key: "response", label: "Response", width: 18, get: (p) => p.response },
  { key: "notes", label: "Notes", width: 36, kind: "wrap", get: (p) => p.notes },
  {
    key: "personalization", label: "Personalization", width: 40, kind: "wrap",
    get: (p) => [
      p.personalization.why && `Why: ${p.personalization.why}`,
      p.personalization.common && `Common: ${p.personalization.common}`,
      p.personalization.ask && `Ask: ${p.personalization.ask}`,
      p.personalization.know && `Known: ${p.personalization.know}`,
    ].filter(Boolean).join("\n"),
  },
  { key: "connected", label: "Connected On", width: 14, kind: "date", get: (p) => p.connectedOn },
  { key: "confidence", label: "Classification Confidence", width: 12, get: (p) => (p.domain === "unclassified" ? "" : `${p.confidence}%`) },
  { key: "tags", label: "Tags", width: 24, get: (p) => p.tags.join(", ") },
];

export const DEFAULT_EXPORT_COLUMNS = [
  "name", "company", "position", "domain", "function", "role", "seniority", "industry", "location", "email", "linkedin",
  "status", "priority", "contacted", "followup", "notes", "personalization", "nextAction",
];

export interface ExportOptions {
  columns: string[];
  title: string;
  includeSummary: boolean;
}

const INK = "FF15171B";
const HEADER_TEXT = "FFFFFFFF";
const ACCENT = "FF0F766E";
const MUTED = "FF6B7280";

function columnLetter(n: number): string {
  let s = "";
  for (n++; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

export async function buildTrackerWorkbook(people: Person[], settings: Settings, options: ExportOptions): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import("exceljs");
  const wb: Workbook = new ExcelJS.Workbook();
  wb.creator = "LinkedIn Intelligence";
  wb.created = new Date();

  const columns = options.columns.map((k) => EXPORT_COLUMNS.find((c) => c.key === k)).filter((c): c is ExportColumn => !!c);
  const summary = options.includeSummary ? wb.addWorksheet("Summary") : null;
  const ws = wb.addWorksheet("Outreach Tracker", { views: [{ state: "frozen", ySplit: 1, xSplit: 1 }], properties: { tabColor: { argb: ACCENT } } });

  // Hidden sheet holding dropdown values.
  const lists = wb.addWorksheet("Lists", { state: "veryHidden" });
  const listValues: Record<string, string[]> = {
    status: settings.statuses.map((s) => s.label),
    priority: ["High", "Medium", "Low"],
    channel: CHANNELS,
    opportunity: OPPORTUNITY_TYPES,
  };
  const listRanges: Record<string, string> = {};
  Object.entries(listValues).forEach(([key, values], i) => {
    const col = columnLetter(i);
    lists.getCell(`${col}1`).value = key;
    values.forEach((v, r) => (lists.getCell(`${col}${r + 2}`).value = v));
    listRanges[key] = `Lists!$${col}$2:$${col}$${values.length + 1}`;
  });

  ws.columns = columns.map((c) => ({ header: c.label, key: c.key, width: c.width }));
  for (const p of people) {
    const row = ws.addRow(Object.fromEntries(columns.map((c) => [c.key, c.get(p, settings) ?? ""])));
    for (const c of columns) {
      const cell = row.getCell(c.key);
      if (c.kind === "link" && p.url) {
        cell.value = { text: "Open profile", hyperlink: p.url };
        cell.font = { color: { argb: ACCENT }, underline: true };
      }
      if (c.kind === "wrap") cell.alignment = { wrapText: true, vertical: "top" };
      else cell.alignment = { vertical: "top" };
    }
  }

  const header = ws.getRow(1);
  header.height = 22;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_TEXT } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
    cell.alignment = { vertical: "middle" };
  });

  // `dataValidations` exists at runtime but is missing from ExcelJS's type definitions.
  const validations = (ws as unknown as { dataValidations: { add(address: string, v: object): void } }).dataValidations;
  const lastRow = Math.max(people.length + 1, 2);
  const validationRows = Math.max(lastRow, 1000);
  columns.forEach((c, i) => {
    const letter = columnLetter(i);
    if (c.kind === "date") ws.getColumn(i + 1).numFmt = "dd mmm yyyy";
    if (c.kind === "list" && listRanges[c.key]) {
      validations.add(`${letter}2:${letter}${validationRows}`, {
        type: "list",
        allowBlank: true,
        formulae: [listRanges[c.key]],
        showErrorMessage: false,
      });
    }
    if (c.kind === "date") {
      validations.add(`${letter}2:${letter}${validationRows}`, {
        type: "date", operator: "greaterThan", allowBlank: true, formulae: [new Date(2000, 0, 1)],
        showErrorMessage: true, errorTitle: "Date", error: "Enter a date, e.g. 21 Sep 2026",
      });
    }
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Math.max(columns.length, 1) } };

  // Highlight follow-ups that are due.
  const followCol = columns.findIndex((c) => c.key === "followup");
  if (followCol >= 0 && people.length) {
    const letter = columnLetter(followCol);
    ws.addConditionalFormatting({
      ref: `${letter}2:${letter}${lastRow}`,
      rules: [{
        type: "expression", priority: 1,
        formulae: [`AND(${letter}2<>"",${letter}2<=TODAY())`],
        style: { font: { color: { argb: "FFB45309" }, bold: true } },
      }],
    });
  }

  if (summary) fillSummary(summary, ws, people, settings, options.title);
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

function fillSummary(s: Worksheet, tracker: Worksheet, people: Person[], settings: Settings, title: string) {
  s.columns = [{ width: 3 }, { width: 34 }, { width: 12 }, { width: 4 }, { width: 30 }, { width: 12 }];
  s.getCell("B2").value = title;
  s.getCell("B2").font = { bold: true, size: 16, color: { argb: INK } };
  s.getCell("B3").value = `${people.length} people · exported ${new Date().toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}`;
  s.getCell("B3").font = { color: { argb: MUTED } };
  s.getCell("B4").value = { text: "Open the tracker →", hyperlink: `#'${tracker.name}'!A1` };
  s.getCell("B4").font = { color: { argb: ACCENT }, underline: true };

  const table = (col: "B" | "E", row: number, heading: string, rows: Array<[string, number]>) => {
    const h = s.getCell(`${col}${row}`);
    h.value = heading;
    h.font = { bold: true, color: { argb: HEADER_TEXT } };
    h.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
    const hc = s.getCell(`${String.fromCharCode(col.charCodeAt(0) + 1)}${row}`);
    hc.value = "People";
    hc.font = { bold: true, color: { argb: HEADER_TEXT } };
    hc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
    rows.forEach(([label, n], i) => {
      s.getCell(`${col}${row + 1 + i}`).value = label;
      s.getCell(`${String.fromCharCode(col.charCodeAt(0) + 1)}${row + 1 + i}`).value = n;
    });
  };
  const count = (get: (p: Person) => string) => {
    const m = new Map<string, number>();
    for (const p of people) m.set(get(p), (m.get(get(p)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  table("B", 6, "Status", count((p) => settings.statuses.find((x) => x.id === p.status)?.label ?? p.status));
  table("E", 6, "Priority", count((p) => p.priority[0].toUpperCase() + p.priority.slice(1)));
  table("B", 24, "Domain", count((p) => domainLabel(p.domain)));
  table("E", 24, "Top companies", count((p) => p.company || "—").slice(0, 15));
}

export async function downloadWorkbook(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
