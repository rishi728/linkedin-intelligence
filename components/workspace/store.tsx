"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { parseConnectionsCsv, type Connection } from "@/lib/analyzer";
import { describeArchive, parseArchive, type ArchiveResult } from "@/lib/archive";
import { titleKey, type CustomRule, type Hierarchy } from "@/lib/intelligence";
import { generateSampleCsv } from "@/lib/sample";
import { archiveSeedPatches, autoClassifyAll, buildPeople, nextCadenceDate, statusChangePatch, type AutoCache } from "@/lib/workspace/build";
import { todayISO } from "@/lib/workspace/dates";
import { dbDelete, dbGet, dbSet, requestPersistence } from "@/lib/workspace/db";
import { defaultSettings } from "@/lib/workspace/defaults";
import type { Activity, ArchiveData, Dataset, DatasetFile, Filters, Person, PersonRecord, Settings } from "@/lib/workspace/types";

type Records = Record<string, PersonRecord>;

interface DataContext {
  ready: boolean;
  dataset: Dataset | null;
  people: Person[];
  byId: Map<string, Person>;
  settings: Settings;
  records: Records;
  archive: ArchiveData | null;
  /** When the workspace was last written to this browser's local database. */
  savedAt: string | null;
  snapshots: Snapshot[];
  importCsv: (text: string, fileName: string, mode?: "add" | "replace") => { total: number; added: number; updated: number };
  removeDatasetFile: (fileName: string) => void;
  importArchive: (files: Array<{ name: string; text: string }>) => ArchiveSummary;
  completeFollowUp: (id: string) => void;
  restoreSnapshot: (at: string) => void;
  loadSample: () => void;
  updateRecord: (id: string, patch: PersonRecord | ((rec: PersonRecord) => PersonRecord), activity?: Omit<Activity, "at">) => void;
  setStatus: (ids: string[], status: string) => void;
  setClassification: (id: string, patch: Partial<Hierarchy>, learn: null | "exact") => number;
  resetClassification: (id: string) => void;
  updateSettings: (fn: (s: Settings) => Settings) => void;
  deleteRule: (ruleId: string) => void;
  toggleTarget: (companyName: string) => void;
  saveSegment: (name: string, filters: Filters) => string;
  deleteSegment: (id: string) => void;
  exportBackup: () => string;
  importBackup: (json: string) => void;
  resetWorkspace: () => Promise<void>;
}

export interface ArchiveSummary {
  matched: number;
  applied: number;
  skipped: number;
  description: string;
  schools: string[];
  profileName: string;
  skippedFiles: string[];
}

export interface Snapshot {
  at: string;
  people: number;
  records: Records;
}

export interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

interface UIContext {
  personId: string | null;
  openPerson: (id: string | null) => void;
  composerFor: string | null;
  openComposer: (id: string | null) => void;
  exportRequest: { filters: Filters; ids?: string[]; title?: string } | null;
  openExport: (req: { filters: Filters; ids?: string[]; title?: string } | null) => void;
  wizardOpen: boolean;
  openWizard: (open: boolean) => void;
  peopleFilters: Filters;
  setPeopleFilters: (f: Filters) => void;
  toasts: Toast[];
  toast: (text: string, action?: Toast["action"]) => void;
  dismissToast: (id: number) => void;
}

const Data = createContext<DataContext | null>(null);
const UI = createContext<UIContext | null>(null);

export function useWorkspace() {
  const ctx = useContext(Data);
  if (!ctx) throw new Error("useWorkspace outside provider");
  return ctx;
}

export function useUI() {
  const ctx = useContext(UI);
  if (!ctx) throw new Error("useUI outside provider");
  return ctx;
}

const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

function mergeSettings(saved: Partial<Settings> | undefined): Settings {
  const d = defaultSettings();
  if (!saved) return d;
  return {
    ...d,
    ...saved,
    profile: { ...d.profile, ...saved.profile },
    goals: { ...d.goals, ...saved.goals },
    statuses: saved.statuses?.length ? saved.statuses : d.statuses,
    templates: saved.templates?.length ? saved.templates : d.templates,
  };
}

/** Older saves held a single CSV; treat them as a one-file dataset. */
function datasetFiles(d: Dataset): DatasetFile[] {
  return d.files?.length ? d.files : [{ fileName: d.fileName, importedAt: d.importedAt, csv: d.csv }];
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [records, setRecords] = useState<Records>({});
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [archive, setArchive] = useState<ArchiveData | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  // ---- load -----------------------------------------------------------------
  useEffect(() => {
    let alive = true;
    Promise.all([
      dbGet<Dataset>("dataset"), dbGet<Records>("records"), dbGet<Settings>("settings"),
      dbGet<ArchiveData>("archive"), dbGet<Snapshot[]>("snapshots"), dbGet<string>("savedAt"),
    ]).then(([d, r, s, a, snaps, saved]) => {
      if (!alive) return;
      setDataset(d ?? null);
      setRecords(r ?? {});
      setSettings(mergeSettings(s));
      setArchive(a ?? null);
      setSnapshots(snaps ?? []);
      setSavedAt(saved ?? null);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // ---- save (debounced) --------------------------------------------------------
  const pending = useRef<{ records?: Records; settings?: Settings }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback(() => {
    const p = pending.current;
    pending.current = {};
    if (!p.records && !p.settings) return;
    if (p.records) void dbSet("records", p.records);
    if (p.settings) void dbSet("settings", p.settings);
    const at = now();
    setSavedAt(at);
    void dbSet("savedAt", at);
    // Keep a rolling local snapshot (one a day, last five) so a mistake is recoverable.
    const saved = p.records;
    if (saved) {
      setSnapshots((prev) => {
        if (prev.some((s) => s.at.slice(0, 10) === at.slice(0, 10))) return prev;
        const next = [...prev, { at, people: Object.keys(saved).length, records: saved }].slice(-5);
        void dbSet("snapshots", next);
        return next;
      });
    }
  }, []);
  const askedToPersist = useRef(false);

  const schedule = useCallback((patch: { records?: Records; settings?: Settings }) => {
    if (!askedToPersist.current) {
      askedToPersist.current = true;
      void requestPersistence();
    }
    Object.assign(pending.current, patch);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 350);
  }, [flush]);
  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flush]);

  const commitRecords = useCallback((fn: (r: Records) => Records) => {
    setRecords((prev) => {
      const next = fn(prev);
      schedule({ records: next });
      return next;
    });
  }, [schedule]);

  const updateSettings = useCallback((fn: (s: Settings) => Settings) => {
    setSettings((prev) => {
      const next = fn(prev);
      schedule({ settings: next });
      return next;
    });
  }, [schedule]);

  // ---- derived ------------------------------------------------------------------
  const rows: Connection[] = useMemo(() => {
    if (!dataset) return [];
    // Every export the user has added, merged. The same person in two files is kept
    // once, taking the newest row, so re-importing after a fresh download just updates.
    const merged = new Map<string, Connection>();
    for (const file of datasetFiles(dataset)) {
      try {
        for (const r of parseConnectionsCsv(file.csv)) merged.set(r.id, r);
      } catch {
        // A file that no longer parses should not take the rest of the workspace down.
      }
    }
    return [...merged.values()];
  }, [dataset]);
  const cache: AutoCache = useMemo(() => autoClassifyAll(rows), [rows]);
  const people = useMemo(() => buildPeople(rows, cache, records, settings, archive), [rows, cache, records, settings, archive]);
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  // ---- actions --------------------------------------------------------------------
  const importCsv = useCallback((text: string, fileName: string, mode: "add" | "replace" = "add") => {
    const parsed = parseConnectionsCsv(text); // throws CsvFormatError on bad files
    const before = new Set(rows.map((r) => r.id));
    const added = mode === "replace" || !rows.length ? parsed.length : parsed.filter((r) => !before.has(r.id)).length;
    const file = { fileName, importedAt: now(), csv: text };
    const keep = mode === "add" && dataset ? datasetFiles(dataset).filter((f) => f.csv !== text) : [];
    const d: Dataset = { files: [...keep, file], fileName, importedAt: file.importedAt, csv: text };
    setDataset(d);
    void dbSet("dataset", d);
    return { total: parsed.length, added, updated: parsed.length - added };
  }, [rows, dataset]);

  const loadSample = useCallback(() => {
    importCsv(generateSampleCsv(), "sample-connections.csv");
  }, [importCsv]);

  const importArchive = useCallback((files: Array<{ name: string; text: string }>): ArchiveSummary => {
    const parsed: ArchiveResult = parseArchive(files);
    const data: ArchiveData = {
      importedAt: now(),
      fileNames: files.map((f) => f.name),
      history: { ...(archive?.history ?? {}), ...parsed.history },
      counts: parsed.counts,
    };
    setArchive(data);
    void dbSet("archive", data);

    const seeded = archiveSeedPatches(rows, data.history, records);
    if (Object.keys(seeded.patches).length) commitRecords((prev) => ({ ...prev, ...seeded.patches }));

    // Fill in details about you that we do not already have.
    updateSettings((s) => ({
      ...s,
      profile: {
        name: s.profile.name || parsed.profile?.name || "",
        background: s.profile.background || parsed.profile?.headline
          || (parsed.positions[0] ? `${parsed.positions[0].title} at ${parsed.positions[0].company}` : ""),
        schools: s.profile.schools.length ? s.profile.schools : parsed.schools,
      },
    }));

    return {
      matched: seeded.matched,
      applied: seeded.applied,
      skipped: seeded.skipped,
      description: describeArchive(parsed),
      schools: parsed.schools,
      profileName: parsed.profile?.name ?? "",
      skippedFiles: parsed.skipped,
    };
  }, [archive, rows, records, commitRecords, updateSettings]);

  const completeFollowUp = useCallback((id: string) => {
    commitRecords((prev) => {
      const cur = prev[id] ?? {};
      const step = (cur.sequenceStep ?? 0) + 1;
      const next = nextCadenceDate(step, settings);
      return {
        ...prev,
        [id]: {
          ...cur,
          sequenceStep: step,
          followUpAt: next,
          lastContactedAt: todayISO(),
          activity: [
            ...(cur.activity ?? []),
            { at: now(), kind: "followup" as const, text: next ? `Follow-up done - next one on ${next}` : "Follow-up done - cadence finished" },
          ],
          updatedAt: now(),
        },
      };
    });
  }, [commitRecords, settings]);

  const restoreSnapshot = useCallback((at: string) => {
    const snap = snapshots.find((s) => s.at === at);
    if (!snap) return;
    commitRecords(() => ({ ...snap.records }));
  }, [snapshots, commitRecords]);

  const updateRecord = useCallback<DataContext["updateRecord"]>((id, patch, activity) => {
    commitRecords((prev) => {
      const cur = prev[id] ?? {};
      const p = typeof patch === "function" ? patch(cur) : patch;
      const next: PersonRecord = { ...cur, ...p, updatedAt: now() };
      if (activity) next.activity = [...(p.activity ?? cur.activity ?? []), { ...activity, at: now() }];
      return { ...prev, [id]: next };
    });
  }, [commitRecords]);

  const setStatus = useCallback((ids: string[], status: string) => {
    commitRecords((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        const cur = prev[id] ?? {};
        if ((cur.status ?? "not_contacted") === status) continue;
        next[id] = { ...cur, ...statusChangePatch(cur, status, settings, todayISO()), updatedAt: now() };
      }
      return next;
    });
  }, [commitRecords, settings]);

  const setClassification = useCallback((id: string, patch: Partial<Hierarchy>, learn: null | "exact") => {
    const person = byId.get(id);
    let affected = 1;
    const describe = Object.values(patch).filter(Boolean).join(" → ");
    if (learn && person?.position) {
      const pattern = titleKey(person.position);
      affected = people.filter((p) => titleKey(p.position) === pattern).length;
      updateSettings((s) => {
        const existing = s.rules.find((r) => r.match === "exact" && r.pattern === pattern);
        const rule: CustomRule = {
          id: existing?.id ?? uid(),
          match: "exact",
          pattern,
          example: person.position,
          set: { ...existing?.set, ...patch },
          createdAt: existing?.createdAt ?? now(),
        };
        return { ...s, rules: existing ? s.rules.map((r) => (r.id === rule.id ? rule : r)) : [...s.rules, rule] };
      });
    }
    // The person always gets a manual override; rules then cover everyone else with the same title.
    updateRecord(id, (rec) => ({ classification: { ...rec.classification, ...patch } }), { kind: "classification", text: `Classified as ${describe}${learn ? " (saved as a rule)" : ""}` });
    return affected;
  }, [byId, people, updateRecord, updateSettings]);

  const resetClassification = useCallback((id: string) => {
    updateRecord(id, { classification: undefined }, { kind: "classification", text: "Reset to automatic classification" });
  }, [updateRecord]);

  const deleteRule = useCallback((ruleId: string) => updateSettings((s) => ({ ...s, rules: s.rules.filter((r) => r.id !== ruleId) })), [updateSettings]);

  const toggleTarget = useCallback((companyName: string) => {
    updateSettings((s) => {
      const exists = s.targetCompanies.some((t) => t.toLowerCase() === companyName.toLowerCase());
      return { ...s, targetCompanies: exists ? s.targetCompanies.filter((t) => t.toLowerCase() !== companyName.toLowerCase()) : [...s.targetCompanies, companyName] };
    });
  }, [updateSettings]);

  const saveSegment = useCallback((name: string, filters: Filters) => {
    const id = uid();
    updateSettings((s) => ({ ...s, segments: [...s.segments, { id, name, filters, createdAt: now() }] }));
    return id;
  }, [updateSettings]);

  const deleteSegment = useCallback((id: string) => updateSettings((s) => ({ ...s, segments: s.segments.filter((x) => x.id !== id) })), [updateSettings]);

  const exportBackup = useCallback(
    () => JSON.stringify({ app: "netlens", version: 3, exportedAt: now(), settings, records, archive }, null, 2),
    [settings, records, archive],
  );

  const importBackup = useCallback((json: string) => {
    const data = JSON.parse(json) as { app?: string; settings?: Settings; records?: Records; rules?: CustomRule[]; archive?: ArchiveData };
    if (Array.isArray(data.rules) && !data.settings) {
      updateSettings((s) => ({ ...s, rules: [...s.rules.filter((r) => !data.rules!.some((n) => n.id === r.id)), ...data.rules!] }));
      return;
    }
    if (data.app !== "netlens") throw new Error("Not a LinkedIn Intelligence backup file.");
    if (data.settings) updateSettings(() => mergeSettings(data.settings));
    if (data.records) commitRecords((prev) => ({ ...prev, ...data.records }));
    if (data.archive) {
      setArchive(data.archive);
      void dbSet("archive", data.archive);
    }
  }, [commitRecords, updateSettings]);

  const removeDatasetFile = useCallback((fileName: string) => {
    if (!dataset) return;
    const left = datasetFiles(dataset).filter((f) => f.fileName !== fileName);
    if (!left.length) return; // removing the last file is a reset, which is its own button
    const newest = left[left.length - 1];
    const d: Dataset = { files: left, fileName: newest.fileName, importedAt: newest.importedAt, csv: newest.csv };
    setDataset(d);
    void dbSet("dataset", d);
  }, [dataset]);

  const resetWorkspace = useCallback(async () => {
    await Promise.all([
      dbDelete("dataset"), dbDelete("records"), dbDelete("settings"),
      dbDelete("archive"), dbDelete("snapshots"), dbDelete("savedAt"),
    ]);
    setDataset(null);
    setRecords({});
    setSettings(defaultSettings());
    setArchive(null);
    setSnapshots([]);
    setSavedAt(null);
  }, []);

  const data = useMemo<DataContext>(() => ({
    ready, dataset, people, byId, settings, records, archive, savedAt, snapshots,
    importCsv, importArchive, loadSample, updateRecord, setStatus, setClassification, resetClassification, updateSettings,
    deleteRule, toggleTarget, saveSegment, deleteSegment, exportBackup, importBackup, resetWorkspace, removeDatasetFile,
    completeFollowUp, restoreSnapshot,
  }), [ready, dataset, people, byId, settings, records, archive, savedAt, snapshots, importCsv, importArchive, loadSample,
    updateRecord, setStatus, setClassification, resetClassification, updateSettings, deleteRule, toggleTarget, saveSegment,
    deleteSegment, exportBackup, importBackup, resetWorkspace, removeDatasetFile, completeFollowUp, restoreSnapshot]);

  // ---- UI state -----------------------------------------------------------------
  const [personId, openPerson] = useState<string | null>(null);
  const [composerFor, openComposer] = useState<string | null>(null);
  const [exportRequest, openExport] = useState<UIContext["exportRequest"]>(null);
  const [wizardOpen, openWizard] = useState(false);
  const [peopleFilters, setPeopleFilters] = useState<Filters>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const toast = useCallback((text: string, action?: Toast["action"]) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, text, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 7000 : 3500);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const ui = useMemo<UIContext>(() => ({
    personId, openPerson, composerFor, openComposer, exportRequest, openExport, wizardOpen, openWizard,
    peopleFilters, setPeopleFilters, toasts, toast, dismissToast,
  }), [personId, composerFor, exportRequest, wizardOpen, peopleFilters, toasts, toast, dismissToast]);

  return (
    <Data.Provider value={data}>
      <UI.Provider value={ui}>{children}</UI.Provider>
    </Data.Provider>
  );
}
