import { existsSync, readFileSync } from "fs";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { parseConnectionsCsv } from "./analyzer";
import { isZip, readZipCsvs, splitExport } from "./zip";

const REAL_ZIP = process.env.NETLENS_EXPORT_ZIP ?? "C:/Users/agraw/Downloads/Basic_LinkedInDataExport_09-15-2026.zip.zip";

describe("reading a LinkedIn export zip", () => {
  it("spots a zip by name or type", () => {
    expect(isZip({ name: "Basic_LinkedInDataExport.zip" })).toBe(true);
    expect(isZip({ name: "export", type: "application/zip" })).toBe(true);
    expect(isZip({ name: "Connections.csv" })).toBe(false);
  });

  it("pulls the CSVs out, ignores everything else, and finds Connections.csv in a folder", async () => {
    const zip = zipSync({
      "export/Connections.csv": strToU8("First Name,Last Name,Company,Position\nAsha,Rao,Acme,Product Manager\n"),
      "export/messages.csv": strToU8("CONVERSATION ID,FROM,TO,DATE\n1,Me,Asha,2026-01-01\n"),
      "export/Rich_Media.csv": strToU8("URL\nhttps://example.com\n"),
      "export/photo.jpg": new Uint8Array([1, 2, 3]),
    });

    const entries = await readZipCsvs(zip.buffer as ArrayBuffer);
    expect(entries.map((e) => e.name).sort()).toEqual(["Connections.csv", "Rich_Media.csv", "messages.csv"]);

    const { connections, archive } = splitExport(entries);
    expect(connections?.name).toBe("Connections.csv");
    expect(archive.map((e) => e.name).sort()).toEqual(["Rich_Media.csv", "messages.csv"]);
    expect(parseConnectionsCsv(connections!.text)).toHaveLength(1);
  });

  it("rejects something that is not a zip", async () => {
    await expect(readZipCsvs(strToU8("not a zip at all").buffer as ArrayBuffer)).rejects.toThrow();
  });

  it.skipIf(!existsSync(REAL_ZIP))("reads the real export end to end", async () => {
    const entries = await readZipCsvs(readFileSync(REAL_ZIP).buffer as ArrayBuffer);
    const { connections, archive } = splitExport(entries);
    expect(connections).not.toBeNull();
    expect(parseConnectionsCsv(connections!.text).length).toBeGreaterThan(1000);
    expect(archive.some((e) => /messages\.csv/i.test(e.name))).toBe(true);
  });
});
