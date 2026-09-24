"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, FileSpreadsheet, KanbanSquare, Lock, Search, Upload, Users } from "lucide-react";
import { CsvFormatError } from "@/lib/analyzer";
import { isZip, readZipCsvs, splitExport, ZipError } from "@/lib/zip";
import { Button, Card, Spinner, cx } from "@/components/ui";
import { useWorkspace } from "@/components/workspace/store";

const STEPS = [
  ["Settings & Privacy", "on LinkedIn, open Settings & Privacy"],
  ["Data Privacy", "go to Data Privacy → Get a copy of your data"],
  ["Connections", "tick Connections and request the archive"],
  ["Connections.csv", "unzip the email attachment and drop the file here"],
];

const FEATURES = [
  { icon: Users, title: "Understand who you know", body: "Every connection sorted into domain, function, role and seniority — with a confidence score you can correct." },
  { icon: Search, title: "Find the right people", body: "Ask for “senior people in supply chain” or use guided search to build a shortlist in seconds." },
  { icon: KanbanSquare, title: "Run your outreach", body: "Track conversations on a board, prepare personalised messages, and never lose a thread." },
  { icon: Bell, title: "Never miss a follow-up", body: "Reminders are scheduled for you when you mark someone as contacted." },
];

export function WelcomeView() {
  const { ready, dataset, importCsv, importArchive, loadSample } = useWorkspace();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && dataset) router.replace("/home");
  }, [ready, dataset, router]);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    if (!isZip(file) && !/\.csv$/i.test(file.name)) {
      setError(`“${file.name}” is neither the export .zip nor a CSV.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // The .zip LinkedIn emails you holds both the connections and the history.
      if (isZip(file)) {
        const { connections, archive } = splitExport(await readZipCsvs(await file.arrayBuffer()));
        if (!connections) throw new CsvFormatError("That zip has no Connections.csv in it.");
        const { total } = importCsv(connections.text, file.name);
        if (!total) throw new CsvFormatError("That export has no connections in it.");
        if (archive.length) importArchive(archive);
      } else {
        const { total } = importCsv(await file.text(), file.name);
        if (!total) throw new CsvFormatError("That file has no connections in it.");
      }
      router.push("/home");
    } catch (e) {
      setError(
        e instanceof CsvFormatError || e instanceof ZipError
          ? e.message
          : "Could not read that file. Try the export .zip, or the Connections.csv inside it.",
      );
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }

  return (
    <div className="scroll-thin h-full overflow-auto">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-accent text-[12px] font-bold text-accent-ink">N</span>
          <span className="text-[13.5px] font-semibold tracking-tight">NetLens</span>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <h1 className="max-w-lg text-[34px] font-semibold leading-[1.1] tracking-tight">
              You already know thousands of people. Start using that.
            </h1>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink-2">
              NetLens turns your LinkedIn connections export into a working outreach system: who they are, who matters for
              what you need right now, and what to do next — all in your browser, with nothing uploaded anywhere.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <Card key={f.title} className="p-4">
                  <span className="grid size-7 place-items-center rounded-lg tone-teal"><f.icon size={14} /></span>
                  <p className="mt-2.5 text-[13.5px] font-semibold">{f.title}</p>
                  <p className="mt-1 text-[12.5px] text-muted">{f.body}</p>
                </Card>
              ))}
            </div>

            <div className="mt-8">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Getting your file</p>
              <ol className="mt-2 space-y-1.5">
                {STEPS.map(([strong, rest], i) => (
                  <li key={strong} className="flex gap-2.5 text-[12.5px] text-ink-2">
                    <span className="tabular text-muted">{i + 1}.</span>
                    <span><strong className="font-medium text-ink">{strong}</strong> — {rest}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-[12px] text-muted">LinkedIn emails the archive in 10 minutes to an hour.</p>
            </div>
          </div>

          <div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handle(e.dataTransfer.files[0]);
              }}
              className={cx(
                "flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition",
                dragging ? "border-accent bg-accent-soft" : "border-line bg-panel hover:border-accent/60",
              )}
            >
              {busy ? (
                <Spinner label="Reading your connections…" />
              ) : (
                <>
                  <span className="grid size-10 place-items-center rounded-xl tone-teal"><Upload size={18} /></span>
                  <p className="mt-3 text-[14px] font-medium">Drop your LinkedIn export here</p>
                  <p className="mt-1 text-[12.5px] text-muted">the whole .zip, or just Connections.csv</p>
                  <Button variant="primary" className="mt-4" icon={ArrowRight}>Choose file</Button>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".zip,.csv,text/csv,application/zip"
                className="hidden"
                onChange={(e) => {
                  handle(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>

            {error ? (
              <p role="alert" className="mt-3 rounded-lg border border-[var(--t-red)] bg-[var(--t-red-bg)] px-3 py-2 text-[12.5px] text-[var(--t-red)]">
                {error}
              </p>
            ) : null}

            <p className="mt-3 rounded-lg border border-line bg-subtle px-3 py-2 text-[12px] text-muted">
              Drop the whole <strong className="text-ink">.zip</strong> and NetLens also reads your messages, invitations and
              education from it — so it knows who you have already spoken to. Nothing is uploaded; it is all read here.
            </p>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-[12px] text-muted">
                <Lock size={12} />
                Stays in this browser
              </p>
              <Button size="sm" icon={FileSpreadsheet} onClick={() => { loadSample(); router.push("/home"); }}>
                Explore with sample data
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
