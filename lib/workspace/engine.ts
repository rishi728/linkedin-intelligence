// The heavy "turn an export into everyone" work, as a plain function so a Web Worker
// can run it off the main thread and tests (or a browser without workers) can call it.

import { parseConnectionsCsv, type Connection } from "../analyzer";
import { autoClassifyAll, buildCorpus, buildPeople, type AutoCache, type CorpusCache } from "./build";
import { groupCompanies } from "./insights";
import type { ArchiveData, Person, PersonRecord, Settings } from "./types";

export interface EngineRequest {
  /** Identifies the imported files. The worker keeps parsed rows and the corpus per key. */
  dataKey: string;
  /** Only sent when the worker does not already hold this dataKey. */
  csvFiles?: string[];
  records: Record<string, PersonRecord>;
  settings: Settings;
  /** Only sent when it changed since the last request. */
  archive?: ArchiveData | null;
}

/** What the company pickers need. Membership only changes on a full build, never on an edit. */
export interface CompanyOption {
  key: string;
  name: string;
  count: number;
}

export interface EngineResponse {
  people: Person[];
  companies: CompanyOption[];
  /** Only present when the rows are new to the caller. */
  rows?: Connection[];
}

interface Held {
  dataKey: string;
  rows: Connection[];
  cache: AutoCache;
  corpus: CorpusCache;
  archive: ArchiveData | null;
}

/** Every export the user has added, merged. The same person in two files is kept once, newest row wins. */
export function mergeRows(csvFiles: string[]): Connection[] {
  const merged = new Map<string, Connection>();
  for (const csv of csvFiles) {
    try {
      for (const r of parseConnectionsCsv(csv)) merged.set(r.id, r);
    } catch {
      // A file that no longer parses should not take the rest of the workspace down.
    }
  }
  return [...merged.values()];
}

export function createEngine() {
  let held: Held | null = null;

  return function run(req: EngineRequest): EngineResponse {
    let sendRows = false;
    if (!held || held.dataKey !== req.dataKey) {
      if (!req.csvFiles) throw new Error("engine: dataset not loaded");
      const rows = mergeRows(req.csvFiles);
      held = { dataKey: req.dataKey, rows, cache: autoClassifyAll(rows), corpus: buildCorpus(rows), archive: null };
      sendRows = true;
    }
    if (req.archive !== undefined) held.archive = req.archive;
    const people = buildPeople(held.rows, held.cache, req.records, req.settings, held.archive, held.corpus);
    return {
      people,
      companies: groupCompanies(people, req.settings).map((c) => ({ key: c.key, name: c.name, count: c.count })),
      rows: sendRows ? held.rows : undefined,
    };
  };
}
