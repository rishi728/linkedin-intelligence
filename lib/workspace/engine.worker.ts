import { createEngine, type EngineRequest, type EngineResponse } from "./engine";

type In = { seq: number; req: EngineRequest };
type Out = { seq: number; res?: EngineResponse; error?: string };

const run = createEngine();

self.onmessage = (e: MessageEvent<In>) => {
  const { seq, req } = e.data;
  try {
    (self as unknown as { postMessage: (m: Out) => void }).postMessage({ seq, res: run(req) });
  } catch (err) {
    (self as unknown as { postMessage: (m: Out) => void }).postMessage({ seq, error: err instanceof Error ? err.message : String(err) });
  }
};
