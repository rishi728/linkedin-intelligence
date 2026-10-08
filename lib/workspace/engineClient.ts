import { createEngine, type EngineRequest, type EngineResponse } from "./engine";

type Out = { seq: number; res?: EngineResponse; error?: string };

let worker: Worker | null = null;
let broken = false;
let seq = 0;
const waiting = new Map<number, { resolve: (r: EngineResponse) => void; reject: (e: Error) => void }>();
const inline = createEngine();
/** What the worker already holds, so big payloads are only sent when they change. */
let sentKey: string | null = null;
let sentArchive: ArchiveLike | undefined;
type ArchiveLike = EngineRequest["archive"];

function start(): Worker | null {
  if (broken || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./engine.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<Out>) => {
      const w = waiting.get(e.data.seq);
      if (!w) return;
      waiting.delete(e.data.seq);
      if (e.data.res) w.resolve(e.data.res);
      else w.reject(new Error(e.data.error ?? "engine failed"));
    };
    worker.onerror = () => {
      broken = true;
      worker?.terminate();
      worker = null;
      for (const w of waiting.values()) w.reject(new Error("worker crashed"));
      waiting.clear();
    };
    return worker;
  } catch {
    broken = true;
    return null;
  }
}

/**
 * Builds everyone in the background. Falls back to doing the same work on the main thread
 * if workers are unavailable, so the app works the same either way, just less smoothly.
 */
export function buildEverything(args: { dataKey: string; csvFiles: string[]; records: EngineRequest["records"]; settings: EngineRequest["settings"]; archive: ArchiveLike }): Promise<EngineResponse> {
  const w = start();
  const needFiles = sentKey !== args.dataKey;
  const req: EngineRequest = {
    dataKey: args.dataKey,
    csvFiles: needFiles ? args.csvFiles : undefined,
    records: args.records,
    settings: args.settings,
    archive: needFiles || sentArchive !== args.archive ? args.archive : undefined,
  };

  if (!w) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(inline({ ...req, csvFiles: args.csvFiles, archive: args.archive }));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      }, 0);
    });
  }

  const id = ++seq;
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject });
    w.postMessage({ seq: id, req });
    sentKey = args.dataKey;
    sentArchive = args.archive;
  }).catch((e) => {
    // The worker died mid-request; do it here once rather than leaving the app empty.
    sentKey = null;
    sentArchive = undefined;
    return inline({ dataKey: args.dataKey, csvFiles: args.csvFiles, records: args.records, settings: args.settings, archive: args.archive });
  }) as Promise<EngineResponse>;
}
