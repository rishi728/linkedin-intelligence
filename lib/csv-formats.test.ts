import { describe, expect, it } from "vitest";
import { CsvFormatError, parseConnectionsCsv } from "./analyzer";

// Every shape of "connections" file people actually end up uploading.
const VARIANTS: Array<[name: string, csv: string]> = [
  [
    "LinkedIn export with Notes preamble",
    `Notes:
"When exporting your connection data, you may notice that some of the email addresses are missing."

First Name,Last Name,URL,Email Address,Company,Position,Connected On
Asha,Rao,https://www.linkedin.com/in/asharao,,Google,Product Manager,15 Jan 2024
Li,Wei,https://www.linkedin.com/in/liwei,li@x.com,Deloitte,Consultant,02 Apr 2023`,
  ],
  [
    "no preamble, header on line 1",
    `First Name,Last Name,URL,Email Address,Company,Position,Connected On
Asha,Rao,https://www.linkedin.com/in/asharao,,Google,Product Manager,15 Jan 2024
Li,Wei,https://www.linkedin.com/in/liwei,,Deloitte,Consultant,02 Apr 2023`,
  ],
  [
    "CRLF line endings and a UTF-8 BOM",
    "﻿First Name,Last Name,URL,Email Address,Company,Position,Connected On\r\nAsha,Rao,https://www.linkedin.com/in/asharao,,Google,Product Manager,15 Jan 2024\r\nLi,Wei,https://www.linkedin.com/in/liwei,,Deloitte,Consultant,02 Apr 2023\r\n",
  ],
  [
    "columns reordered with extra columns",
    `Connected On,Company,Position,First Name,Last Name,Notes,URL
15 Jan 2024,Google,Product Manager,Asha,Rao,met at a conference,https://www.linkedin.com/in/asharao
02 Apr 2023,Deloitte,Consultant,Li,Wei,,https://www.linkedin.com/in/liwei`,
  ],
  [
    "quoted fields containing commas",
    `First Name,Last Name,URL,Email Address,Company,Position,Connected On
Asha,Rao,https://www.linkedin.com/in/asharao,,"Google, Inc.","Product Manager, Payments",15 Jan 2024
Li,Wei,https://www.linkedin.com/in/liwei,,"Deloitte","Consultant",02 Apr 2023`,
  ],
  [
    "no email column at all",
    `First Name,Last Name,URL,Company,Position,Connected On
Asha,Rao,https://www.linkedin.com/in/asharao,Google,Product Manager,15 Jan 2024
Li,Wei,https://www.linkedin.com/in/liwei,Deloitte,Consultant,02 Apr 2023`,
  ],
  [
    "odd header casing and padding",
    `first name , LAST NAME ,Url,Email Address,  Company ,POSITION,Connected On
Asha,Rao,https://www.linkedin.com/in/asharao,,Google,Product Manager,15 Jan 2024
Li,Wei,https://www.linkedin.com/in/liwei,,Deloitte,Consultant,02 Apr 2023`,
  ],
  [
    "semicolon-delimited (European Excel)",
    `First Name;Last Name;URL;Email Address;Company;Position;Connected On
Asha;Rao;https://www.linkedin.com/in/asharao;;Google;Product Manager;15 Jan 2024
Li;Wei;https://www.linkedin.com/in/liwei;;Deloitte;Consultant;02 Apr 2023`,
  ],
  [
    "single Name column (generic contacts export)",
    `Name,Company,Job Title,Email,Profile
Asha Rao,Google,Product Manager,,https://www.linkedin.com/in/asharao
Li Wei,Deloitte,Consultant,,https://www.linkedin.com/in/liwei`,
  ],
  [
    "ISO dates and trailing blank lines",
    `First Name,Last Name,URL,Email Address,Company,Position,Connected On
Asha,Rao,https://www.linkedin.com/in/asharao,,Google,Product Manager,2024-01-15
Li,Wei,https://www.linkedin.com/in/liwei,,Deloitte,Consultant,2023-04-02

`,
  ],
  [
    "accented and non-Latin names",
    `First Name,Last Name,URL,Email Address,Company,Position,Connected On
Asha,Rao,https://www.linkedin.com/in/asharao,,Google,Product Manager,15 Jan 2024
José,Müller,https://www.linkedin.com/in/josemuller,,Siemens,Ingeniero Mecánico,02 Apr 2023`,
  ],
];

describe("uploading any connections file", () => {
  it.each(VARIANTS)("parses and classifies: %s", (_name, csv) => {
    const headerLine = csv.split(/\r?\n/).find((l) => /first name|^name,/i.test(l)) ?? "";
    const hasDate = /connected/i.test(headerLine);
    const rows = parseConnectionsCsv(csv);
    expect(rows).toHaveLength(2);
    const [asha, second] = rows;
    expect(asha.name).toBe("Asha Rao");
    expect(asha.company).toMatch(/^Google/);
    expect(asha.position).toMatch(/^Product Manager/);
    expect(asha.category).toBe("product");
    if (hasDate) expect(asha.connectedOn?.getFullYear()).toBe(2024);
    expect(second.category).not.toBe("unspecified");
  });

  it("keeps rows that are missing a title, a company or a date", () => {
    const rows = parseConnectionsCsv(`First Name,Last Name,URL,Email Address,Company,Position,Connected On
Asha,Rao,https://www.linkedin.com/in/asharao,,,,
Li,Wei,https://www.linkedin.com/in/liwei,,Deloitte,,`);
    expect(rows).toHaveLength(2);
    expect(rows[0].category).toBe("unspecified");
    expect(rows[1].category).toBe("consulting");
    expect(rows[0].connectedOn).toBeNull();
  });

  it("explains the problem when the file isn't a connections export", () => {
    expect(() => parseConnectionsCsv("total,amount\n1,2")).toThrow(CsvFormatError);
    expect(() => parseConnectionsCsv("")).toThrow(/header row with names/);
    expect(() => parseConnectionsCsv("First Name,Last Name,Company,Position")).toThrow(/no connections in it/);
  });

  it("handles a large file quickly", () => {
    const header = "First Name,Last Name,URL,Email Address,Company,Position,Connected On";
    const body = Array.from({ length: 10_000 }, (_, i) =>
      `Person${i},Test,https://www.linkedin.com/in/p${i},,Company ${i % 500},${i % 2 ? "Software Engineer" : "Supply Chain Manager"},15 Jan 2024`);
    const started = performance.now();
    const rows = parseConnectionsCsv([header, ...body].join("\n"));
    expect(rows).toHaveLength(10_000);
    expect(performance.now() - started).toBeLessThan(5000);
  });
});
