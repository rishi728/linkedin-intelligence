// Reading a LinkedIn export straight from the .zip LinkedIn emails you, so nobody
// has to unzip anything or hunt for the right files.

import { unzip } from "fflate";

export interface ZipEntry {
  /** File name without any folder, e.g. "Connections.csv". */
  name: string;
  text: string;
}

export class ZipError extends Error {}

/** The connections file, whatever casing or folder LinkedIn put it in. */
const CONNECTIONS = /(^|\/)connections\.csv$/i;

export function isZip(file: { name: string; type?: string }): boolean {
  return /\.zip$/i.test(file.name) || file.type === "application/zip";
}

/** Every CSV inside the archive, decoded as text. Other files are ignored. */
export async function readZipCsvs(data: ArrayBuffer): Promise<ZipEntry[]> {
  const files = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(new Uint8Array(data), { filter: (f) => /\.csv$/i.test(f.name) }, (err, out) =>
      err ? reject(new ZipError("That zip file could not be opened.")) : resolve(out),
    );
  });

  const decoder = new TextDecoder("utf-8");
  return Object.entries(files)
    .filter(([, bytes]) => bytes.length > 0)
    .map(([path, bytes]) => ({ name: path.split("/").pop() ?? path, text: decoder.decode(bytes) }));
}

/**
 * Splits an unzipped export into the connections file and everything else, so the
 * caller can import the network and the conversation history in one step.
 */
export function splitExport(entries: ZipEntry[]): { connections: ZipEntry | null; archive: ZipEntry[] } {
  const connections = entries.find((e) => CONNECTIONS.test(e.name)) ?? null;
  return { connections, archive: entries.filter((e) => e !== connections) };
}
