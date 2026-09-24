"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, FolderUp, Trash2 } from "lucide-react";
import { CsvFormatError } from "@/lib/analyzer";
import { isZip, readZipCsvs, splitExport, ZipError } from "@/lib/zip";
import { formatDate } from "@/lib/workspace/dates";
import { Button, Dialog, Pill, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

/**
 * Add more data whenever you like: another connections export, or the rest of the
 * LinkedIn archive. Everything is re-read and re-analysed on the spot, and nothing
 * you have written, statuses, notes, follow-ups, corrections, is touched.
 */
export function AddData({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dataset, people, archive, importCsv, importArchive, removeDatasetFile } = useWorkspace();
  const { toast } = useUI();
  const csvInput = useRef<HTMLInputElement>(null);
  const archiveInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"add" | "replace">("add");
  const [busy, setBusy] = useState<null | "csv" | "archive">(null);

  const files = dataset?.files?.length
    ? dataset.files
    : dataset
      ? [{ fileName: dataset.fileName, importedAt: dataset.importedAt, csv: dataset.csv }]
      : [];

  const withHistory = people.filter((p) => p.history?.messageCount).length;

  const takeCsv = async (file: File | undefined) => {
    if (!file) return;
    setBusy("csv");
    try {
      // A whole export .zip does both jobs at once: connections plus the history.
      if (isZip(file)) {
        const { connections, archive: rest } = splitExport(await readZipCsvs(await file.arrayBuffer()));
        if (!connections) throw new CsvFormatError("That zip has no Connections.csv in it.");
        const { total, added, updated } = importCsv(connections.text, file.name, mode);
        const extra = rest.length ? importArchive(rest) : null;
        toast(
          `${mode === "replace" ? total.toLocaleString() : `${added.toLocaleString()} new · ${updated.toLocaleString()} already known`}` +
            (extra?.matched ? ` · ${extra.applied} with message history` : ""),
        );
        return;
      }
      const { total, added, updated } = importCsv(await file.text(), file.name, mode);
      toast(
        mode === "replace"
          ? `Starting fresh with ${total.toLocaleString()} connections.`
          : `${added.toLocaleString()} new · ${updated.toLocaleString()} already known. Everything re-analysed.`,
      );
    } catch (e) {
      toast(
        e instanceof CsvFormatError || e instanceof ZipError
          ? e.message
          : "That file could not be read as a LinkedIn export.",
      );
    } finally {
      setBusy(null);
    }
  };

  const takeArchive = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy("archive");
    try {
      const parts = await Promise.all([...list].map(async (f) => ({ name: f.name, text: await f.text() })));
      const summary = importArchive(parts);
      toast(
        summary.matched
          ? `Found ${summary.description}. ${summary.applied} people updated${summary.skipped ? `, ${summary.skipped} left as you set them` : ""}.`
          : `Read ${summary.description}, but none of it matched your connections.`,
      );
    } catch {
      toast("Could not read those files. Pick the CSV files from your LinkedIn export folder.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add data"
      subtitle="Add a new export any time. Your statuses, notes and corrections are always kept."
      width={620}
      footer={<Button variant="primary" onClick={onClose}>Done</Button>}
    >
      <input
        ref={csvInput}
        type="file"
        accept=".zip,.csv,text/csv,application/zip"
        className="hidden"
        onChange={(e) => {
          void takeCsv(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={archiveInput}
        type="file"
        accept=".csv,text/csv"
        multiple
        className="hidden"
        onChange={(e) => {
          void takeArchive(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Connections */}
      <section>
        <p className="text-[13.5px] font-semibold">Connections</p>
        <p className="mt-0.5 text-[12.5px] text-muted">
          Drop in the whole <strong className="text-ink">export .zip</strong> LinkedIn emails you, or just a{" "}
          <strong className="text-ink">Connections.csv</strong>. People in more than one file are counted once, and
          everyone is classified again from scratch.
        </p>

        <div className="mt-2.5 flex gap-2">
          {(["add", "replace"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cx(
                "flex-1 rounded-xl border px-3 py-2 text-left transition",
                mode === m ? "border-accent bg-accent-soft/40" : "border-line hover:border-line-strong",
              )}
            >
              <span className="block text-[12.5px] font-medium">{m === "add" ? "Add to what I have" : "Start fresh"}</span>
              <span className="mt-0.5 block text-[11.5px] text-muted">
                {m === "add" ? "Keeps your current connections too" : "Replaces the connections, keeps your notes"}
              </span>
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          icon={FileSpreadsheet}
          className="mt-2.5"
          disabled={busy !== null}
          onClick={() => csvInput.current?.click()}
        >
          {busy === "csv" ? "Reading…" : "Choose your export (.zip or .csv)"}
        </Button>

        {files.length ? (
          <div className="mt-3 space-y-1">
            {files.map((f) => (
              <div key={f.fileName} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-1.5">
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px]">{f.fileName}</span>
                  <span className="block text-[11.5px] text-muted">Added {formatDate(new Date(f.importedAt))}</span>
                </span>
                {files.length > 1 ? (
                  <button
                    type="button"
                    aria-label={`Remove ${f.fileName}`}
                    title="Remove this file"
                    onClick={() => {
                      removeDatasetFile(f.fileName);
                      toast(`${f.fileName} removed.`);
                    }}
                    className="shrink-0 text-muted transition hover:text-[var(--t-red)]"
                  >
                    <Trash2 size={13} />
                  </button>
                ) : null}
              </div>
            ))}
            <p className="pt-0.5 text-[11.5px] text-muted">
              {people.length.toLocaleString()} people in total right now.
            </p>
          </div>
        ) : null}
      </section>

      <hr className="my-4 border-line" />

      {/* Archive */}
      <section>
        <p className="flex items-center gap-2 text-[13.5px] font-semibold">
          The rest of your export
          {archive ? <Pill tone="teal">Loaded</Pill> : null}
        </p>
        <p className="mt-0.5 text-[12.5px] text-muted">
          {archive
            ? `${withHistory.toLocaleString()} people have message history. Import again after a fresh download to bring it up to date.`
            : "Pick messages.csv, Invitations.csv, Education.csv, Positions.csv and Profile.csv from your export folder to see who you have already spoken to."}
        </p>
        <p className="mt-1.5 text-[11.5px] text-muted">
          Your conversations are kept so you can read them on a person’s profile. They stay in this browser and are never uploaded.
        </p>
        <Button
          icon={FolderUp}
          className="mt-2.5"
          disabled={busy !== null}
          onClick={() => archiveInput.current?.click()}
        >
          {busy === "archive" ? "Reading…" : archive ? "Import again" : "Choose archive files"}
        </Button>
      </section>

      <p className="mt-4 rounded-lg border border-line bg-subtle px-3 py-2 text-[11.5px] text-muted">
        Nothing is uploaded anywhere. Every file is read in this browser and stays on this device.
      </p>
    </Dialog>
  );
}
