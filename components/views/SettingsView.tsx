"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, Trash2, Upload, X } from "lucide-react";
import { CsvFormatError } from "@/lib/analyzer";
import { CATEGORY_ID, CATS } from "@/lib/classifier/categories";
import { ROLE_FAMILIES, familiesOf } from "@/lib/classifier/search";
import { OPPORTUNITY_TYPES } from "@/lib/workspace/defaults";
import { groupCompanies } from "@/lib/workspace/insights";
import { hasGoals } from "@/lib/workspace/priority";
import type { StatusDef, Tone } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { Button, Card, CardTitle, Checkbox, Field, Input, Pill, Segmented, Select, Toggle, cx } from "@/components/ui";
import { ArchiveImport } from "@/components/workspace/ArchiveImport";
import { storageStatus } from "@/lib/workspace/db";
import { autoBackupSupported, backupFileName, chooseBackupFile, downloadBackup, forgetBackupFile, writeBackup } from "@/lib/workspace/autobackup";
import { DEFAULT_WEIGHTS } from "@/lib/workspace/defaults";
import { addDays, formatDate, todayISO } from "@/lib/workspace/dates";
import { useUI, useWorkspace } from "@/components/workspace/store";

type Tab = "goals" | "targets" | "pipeline" | "outreach" | "rules" | "data";

const TONES: Tone[] = ["gray", "blue", "violet", "amber", "orange", "teal", "green", "slate", "red"];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx("rounded-lg border px-2.5 py-1 text-[12.5px] font-medium transition", active ? "border-accent bg-accent-soft text-accent" : "border-line bg-panel text-ink-2 hover:border-line-strong hover:text-ink")}
    >
      {children}
    </button>
  );
}

const WEIGHT_ROWS = [
  ["functionMatch", "Works in a role you want", "Their job matches one of your target roles."],
  ["domainMatch", "Works in a field you want", "Their field matches one of your target categories."],
  ["targetCompany", "Works at a target company", "Their employer is on your target company list."],
  ["recruiter", "Is a recruiter", "Counts only if you are looking for jobs, internships or referrals."],
  ["hiring", "Says they are hiring", "Their headline mentions hiring."],
  ["alumni", "Went to your school", "Their employer or campus matches your school."],
  ["replied", "Has replied to you before", "You have already talked and they answered."],
  ["theyInvited", "Sent you the invite", "They asked to connect with you first."],
  ["hasEmail", "Has an email on file", "You have a direct way to reach them."],
] as const;

/** Keeps the thumb moving smoothly; the workspace is only updated when you let go. */
function WeightSlider({ label, hint, value, onCommit }: { label: string; hint: string; value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState<number | null>(null);
  const shown = draft ?? value;
  const commit = () => {
    if (draft !== null && draft !== value) onCommit(draft);
    setDraft(null);
  };
  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="font-medium">{label}</span>
        <span className="tabular text-[12px] font-medium text-ink-2">{shown === 0 ? "Ignored" : `+${shown} points`}</span>
      </div>
      <input
        type="range"
        min={0}
        max={40}
        value={shown}
        onChange={(e) => setDraft(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        className="mt-1 w-full accent-[var(--accent)]"
      />
      <p className="text-[11.5px] text-muted">{hint}</p>
    </div>
  );
}

export function SettingsView() {
  const {
    people, settings, updateSettings, deleteRule, deleteSegment, toggleTarget, importCsv, exportBackup, importBackup,
    resetWorkspace, dataset, snapshots, restoreSnapshot, savedAt,
  } = useWorkspace();
  const { toast } = useUI();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("goals");
  const [storage, setStorage] = useState<{ persisted: boolean; usedMb: number | null }>({ persisted: false, usedMb: null });

  const [backupFile, setBackupFile] = useState<string | null>(null);

  const priorityCounts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    for (const p of people) c[p.priority]++;
    return c;
  }, [people]);

  useEffect(() => {
    void storageStatus().then(setStorage);
    void backupFileName().then(setBackupFile);
  }, []);

  // Two weeks, compared as dates rather than with a clock read during render.
  const staleBefore = addDays(todayISO(), -14);
  const backupStale = !!settings.lastBackupAt && settings.lastBackupAt.slice(0, 10) < staleBefore;
  const [companyQuery, setCompanyQuery] = useState("");
  const [school, setSchool] = useState("");
  const csvInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);

  const companies = groupCompanies(people, settings);
  const toggle = <T extends string>(list: T[], value: T, apply: (next: T[]) => void) =>
    apply(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const setStatuses = (fn: (s: StatusDef[]) => StatusDef[]) => updateSettings((s) => ({ ...s, statuses: fn(s.statuses) }));

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Goals, targets, pipeline, templates and your data, all stored in this browser"
        actions={
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "goals", label: "Goals" },
              { value: "targets", label: "Targets" },
              { value: "pipeline", label: "Pipeline" },
              { value: "outreach", label: "Outreach" },
              { value: "rules", label: "Rules" },
              { value: "data", label: "Data" },
            ]}
          />
        }
      />
      <PageBody>
        <div className="mx-auto max-w-4xl space-y-4">
          {tab === "goals" ? (
            <>
              <Card>
                <CardTitle hint="Used in message templates and to spot alumni">About you</CardTitle>
                <div className="grid gap-3 p-4 pt-3 sm:grid-cols-2">
                  <Field label="Your name">
                    <Input defaultValue={settings.profile.name} onBlur={(e) => updateSettings((s) => ({ ...s, profile: { ...s.profile, name: e.target.value } }))} placeholder="Rishi" />
                  </Field>
                  <Field label="One line about you" hint="Used as {{my_background}} in messages">
                    <Input defaultValue={settings.profile.background} onBlur={(e) => updateSettings((s) => ({ ...s, profile: { ...s.profile, background: e.target.value } }))} placeholder="a final-year student at NIT Warangal" />
                  </Field>
                  <Field label="Your schools" className="sm:col-span-2" hint="Connections there (or in their clubs) are marked as alumni">
                    <div className="flex gap-2">
                      <Input
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        placeholder="NIT Warangal"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && school.trim()) {
                            updateSettings((s) => ({ ...s, profile: { ...s.profile, schools: [...s.profile.schools, school.trim()] } }));
                            setSchool("");
                          }
                        }}
                      />
                      <Button
                        icon={Plus}
                        onClick={() => {
                          if (!school.trim()) return;
                          updateSettings((s) => ({ ...s, profile: { ...s.profile, schools: [...s.profile.schools, school.trim()] } }));
                          setSchool("");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {settings.profile.schools.map((sc) => (
                        <button key={sc} type="button" onClick={() => updateSettings((s) => ({ ...s, profile: { ...s.profile, schools: s.profile.schools.filter((x) => x !== sc) } }))} className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-0.5 text-[12px] hover:border-line-strong">
                          {sc}
                          <X size={11} />
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </Card>

              <Card>
                <CardTitle hint="What you're looking for right now, this drives priority">Goals</CardTitle>
                <div className="space-y-4 p-4 pt-3">
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Opportunity type</p>
                    <div className="flex flex-wrap gap-2">
                      {OPPORTUNITY_TYPES.map((t) => (
                        <Chip key={t} active={settings.goals.opportunityTypes.includes(t)} onClick={() => toggle(settings.goals.opportunityTypes, t, (next) => updateSettings((s) => ({ ...s, goals: { ...s.goals, opportunityTypes: next } })))}>
                          {t}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Target categories</p>
                    <div className="flex flex-wrap gap-2">
                      {CATS.map((d) => (
                        <Chip key={d} active={settings.goals.categories.includes(CATEGORY_ID[d])} onClick={() => toggle(settings.goals.categories, CATEGORY_ID[d], (next) => updateSettings((s) => ({ ...s, goals: { ...s.goals, categories: next } })))}>
                          {d}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {settings.segments.length ? (
                <Card>
                  <CardTitle hint="Saved filter views">Segments</CardTitle>
                  <div className="p-2">
                    {settings.segments.map((seg) => (
                      <div key={seg.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-hover">
                        <span className="truncate text-[12.5px]">{seg.name}</span>
                        <Button size="sm" variant="ghost" icon={Trash2} onClick={() => { deleteSegment(seg.id); toast("Segment removed."); }}>Remove</Button>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
            </>
          ) : null}

          {tab === "targets" ? (
            <Card>
              <CardTitle hint="People at these companies get a priority boost and show under “Target companies”">Target companies</CardTitle>
              <div className="p-4 pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {settings.targetCompanies.map((c) => (
                    <button key={c} type="button" onClick={() => toggleTarget(c)} className="inline-flex items-center gap-1 rounded-md border border-accent bg-accent-soft px-2 py-0.5 text-[12.5px] text-accent">
                      {c}
                      <X size={11} />
                    </button>
                  ))}
                  {!settings.targetCompanies.length ? <p className="text-[12.5px] text-muted">No targets yet, add a few below.</p> : null}
                </div>
                <div className="mt-3 max-w-md">
                  <Input value={companyQuery} onChange={(e) => setCompanyQuery(e.target.value)} placeholder="Search your companies…" />
                </div>
                <div className="scroll-thin mt-2 max-h-72 overflow-auto rounded-lg border border-line">
                  {companies
                    .filter((c) => !companyQuery || c.name.toLowerCase().includes(companyQuery.toLowerCase()))
                    .slice(0, 100)
                    .map((c) => (
                      <button key={c.key} type="button" onClick={() => toggleTarget(c.name)} className="flex w-full items-center justify-between gap-2 border-b border-line/60 px-3 py-1.5 text-left last:border-0 hover:bg-hover">
                        <span className="truncate text-[12.5px]">{c.name}</span>
                        <span className="flex items-center gap-2">
                          <span className="tabular text-[12px] text-muted">{c.count}</span>
                          {c.isTarget ? <Pill tone="teal">Target</Pill> : <Plus size={13} className="text-muted" />}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </Card>
          ) : null}

          {tab === "pipeline" ? (
            <Card>
              <CardTitle
                hint="Rename stages, choose which appear as board columns, and add your own"
                action={
                  <Button
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      const label = window.prompt("New status name");
                      if (!label) return;
                      setStatuses((list) => [...list, { id: `custom_${Date.now()}`, label, tone: "gray", onBoard: true, kind: "active" }]);
                    }}
                  >
                    Add status
                  </Button>
                }
              >
                Pipeline statuses
              </CardTitle>
              <div className="p-2">
                {settings.statuses.map((s, i) => {
                  const used = people.filter((p) => p.status === s.id).length;
                  return (
                    <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-hover">
                      <span className={cx("size-2.5 shrink-0 rounded-full", `dot-${s.tone}`)} />
                      <Input
                        defaultValue={s.label}
                        onBlur={(e) => setStatuses((list) => list.map((x) => (x.id === s.id ? { ...x, label: e.target.value || x.label } : x)))}
                        className="h-7 w-44"
                      />
                      <div className="w-28">
                        <Select value={s.tone} onChange={(e) => setStatuses((list) => list.map((x) => (x.id === s.id ? { ...x, tone: e.target.value as Tone } : x)))} className="h-7 text-[12px]">
                          {TONES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </Select>
                      </div>
                      <label className="flex items-center gap-1.5 text-[12px] text-muted">
                        <Toggle checked={s.onBoard} onChange={(v) => setStatuses((list) => list.map((x) => (x.id === s.id ? { ...x, onBoard: v } : x)))} label="Show on board" />
                        Board column
                      </label>
                      <span className="tabular text-[12px] text-muted">{used} people</span>
                      <div className="ml-auto flex items-center gap-1">
                        <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => setStatuses((list) => { const c = [...list]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c; })}>↑</Button>
                        <Button size="sm" variant="ghost" disabled={i === settings.statuses.length - 1} onClick={() => setStatuses((list) => { const c = [...list]; [c[i + 1], c[i]] = [c[i], c[i + 1]]; return c; })}>↓</Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Trash2}
                          disabled={s.id === "not_contacted" || used > 0}
                          title={used > 0 ? "In use by some people" : "Delete"}
                          onClick={() => setStatuses((list) => list.filter((x) => x.id !== s.id))}
                        >
                          {""}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}

          {tab === "outreach" ? (
            <>
              <Card>
                <CardTitle hint="After you message someone, NesT reminds you to check back if they have not replied">Follow-up reminders</CardTitle>
                <div className="p-4 pt-3">
                  <Checkbox
                    checked={settings.cadence.enabled}
                    onChange={(v) => updateSettings((s) => ({ ...s, cadence: { ...s.cadence, enabled: v } }))}
                    label="Remind me to follow up automatically"
                  />
                  <div className={cx("mt-3 flex flex-wrap items-end gap-3", !settings.cadence.enabled && "pointer-events-none opacity-50")}>
                    {settings.cadence.steps.map((d, i) => (
                      <Field key={i} label={`Reminder ${i + 1}`} className="w-36">
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min={1}
                            max={120}
                            value={d}
                            onChange={(e) => updateSettings((s) => ({
                              ...s,
                              cadence: { ...s.cadence, steps: s.cadence.steps.map((x, j) => (j === i ? Math.max(1, Number(e.target.value) || 1) : x)) },
                            }))}
                          />
                          <span className="text-[12px] text-muted">days</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted">{i === 0 ? "after you contact them" : `after reminder ${i}`}</p>
                      </Field>
                    ))}
                    <Button
                      onClick={() => updateSettings((s) => ({ ...s, cadence: { ...s.cadence, steps: [...s.cadence.steps, (s.cadence.steps.at(-1) ?? 7) + 7] } }))}
                    >
                      Add a reminder
                    </Button>
                    {settings.cadence.steps.length > 1 ? (
                      <Button variant="ghost" onClick={() => updateSettings((s) => ({ ...s, cadence: { ...s.cadence, steps: s.cadence.steps.slice(0, -1) } }))}>
                        Remove last
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-3 rounded-lg bg-subtle px-3 py-2 text-[12.5px] text-ink-2">
                    {settings.cadence.enabled ? (
                      <>
                        <span className="font-medium">Example:</span> if you message someone today, you will be reminded on{" "}
                        {settings.cadence.steps.map((d, i, all) => {
                          const day = all.slice(0, i + 1).reduce((a, b) => a + b, 0);
                          return (
                            <span key={i}>
                              <strong>{formatDate(addDays(todayISO(), day))}</strong> (day {day}){i < all.length - 1 ? ", then " : "."}
                            </span>
                          );
                        })}
                      </>
                    ) : (
                      "Automatic reminders are off. You can still set a follow-up date on any person yourself."
                    )}
                  </div>
                  <p className="mt-2 text-[12px] text-muted">
                    Each gap counts from the one before it. Marking a reminder done moves that person on to the next one.
                  </p>
                </div>
              </Card>

              <Card>
                <CardTitle
                  hint="Everyone gets a score out of 100. Higher scores float to the top of your list"
                  action={<Button size="sm" onClick={() => updateSettings((s) => ({ ...s, weights: { ...DEFAULT_WEIGHTS } }))}>Reset to default</Button>}
                >
                  What makes someone a priority
                </CardTitle>
                <div className="px-4 pt-3 text-[12.5px] text-ink-2">
                  <p>
                    Each thing below adds points to a person when it is true for them. <strong>55 or more is High</strong>, 30 to 54 is Medium, anything lower is Low.
                    Drag right to make something matter more, or all the way left to ignore it.
                  </p>
                  <p className="mt-2 rounded-lg bg-subtle px-3 py-2">
                    <span className="font-medium">Right now:</span>{" "}
                    <strong>{priorityCounts.high.toLocaleString()}</strong> High, <strong>{priorityCounts.medium.toLocaleString()}</strong> Medium, <strong>{priorityCounts.low.toLocaleString()}</strong> Low
                    {" "}out of {people.length.toLocaleString()} people.
                    {hasGoals(settings) ? null : " Nobody scores yet because no target roles or companies are set. Add them under the Goals and Targets tabs."}
                  </p>
                </div>
                <div className="grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2">
                  {WEIGHT_ROWS.map(([key, label, hint]) => (
                    <WeightSlider
                      key={key}
                      label={label}
                      hint={hint}
                      value={settings.weights[key]}
                      onCommit={(v) => updateSettings((s) => ({ ...s, weights: { ...s.weights, [key]: v } }))}
                    />
                  ))}
                </div>
                <p className="px-4 pb-4 text-[12px] text-muted">
                  Open any person to see exactly which of these added to their score. A priority you set by hand on a person always wins over the score.
                </p>
              </Card>
            </>
          ) : null}

          {tab === "rules" ? (
            <Card>
              <CardTitle
                hint="Created when you correct a classification and choose to remember it"
                action={
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      icon={Download}
                      onClick={() => {
                        const blob = new Blob([JSON.stringify({ app: "netlens", rules: settings.rules }, null, 2)], { type: "application/json" });
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        a.download = "custom_rules.json";
                        a.click();
                        URL.revokeObjectURL(a.href);
                      }}
                    >
                      Export rules
                    </Button>
                  </div>
                }
              >
                Learned rules ({settings.rules.length})
              </CardTitle>
              <div className="p-2">
                {settings.rules.length === 0 ? (
                  <p className="px-2 py-6 text-center text-[12.5px] text-muted">
                    No rules yet. Open anyone, edit their classification, and tick “Remember this for all people titled …”.
                  </p>
                ) : (
                  settings.rules.map((r) => {
                    const affected = people.filter((p) => p.classSource === "rule" && p.method.includes(r.example)).length;
                    return (
                      <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-hover">
                        <span className="truncate text-[12.5px] font-medium">“{r.example}”</span>
                        <span className="text-[12px] text-muted">
                          → {[r.set.category && CATS.find((c) => CATEGORY_ID[c] === r.set.category), r.set.roleFamily].filter(Boolean).join(" · ")}
                        </span>
                        <span className="tabular ml-auto text-[12px] text-muted">{affected} people</span>
                        <Button size="sm" variant="ghost" icon={Trash2} onClick={() => { deleteRule(r.id); toast("Rule deleted."); }}>Delete</Button>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          ) : null}

          {tab === "data" ? (
            <>
              <ArchiveImport />

              <Card>
                <CardTitle hint={`${people.length.toLocaleString()} connections from ${dataset?.fileName}`}>Import connections</CardTitle>
                <div className="p-4 pt-3">
                  <p className="text-[12.5px] text-muted">
                    Importing a newer export keeps all your notes, statuses, follow-ups and classifications, they’re matched by LinkedIn profile URL.
                  </p>
                  <input
                    ref={csvInput}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      try {
                        const { total, added } = importCsv(await file.text(), file.name);
                        toast(`Imported ${total.toLocaleString()} connections${added ? ` · ${added.toLocaleString()} new` : ""}.`);
                      } catch (err) {
                        toast(err instanceof CsvFormatError ? err.message : "Could not read that file.");
                      }
                    }}
                  />
                  <Button className="mt-3" icon={Upload} onClick={() => csvInput.current?.click()}>Choose Connections.csv</Button>
                </div>
              </Card>

              <Card>
                <CardTitle hint="Snapshots are taken automatically, once a day, in this browser">Local snapshots</CardTitle>
                <div className="p-4 pt-3">
                  {snapshots.length === 0 ? (
                    <p className="text-[12.5px] text-muted">
                      No snapshots yet. One is saved the first time you change something each day, so you can roll back a bad edit.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {[...snapshots].reverse().map((snap) => (
                        <div key={snap.at} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                          <span className="text-[12.5px]">
                            {formatDate(new Date(snap.at), true)} · {snap.people.toLocaleString()} people with your edits
                          </span>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (!window.confirm("Replace your current notes, statuses and follow-ups with this snapshot?")) return;
                              restoreSnapshot(snap.at);
                              toast("Snapshot restored.");
                            }}
                          >
                            Restore
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <CardTitle hint="Everything is stored in this browser only">Backup & reset</CardTitle>
                <div className="px-4 pt-3">
                  <p className="text-[12.5px]">
                    <span className={storage.persisted ? "text-[var(--t-green)]" : "text-[var(--t-amber)]"}>
                      {storage.persisted
                        ? "This browser has been asked to keep your data and agreed."
                        : "This browser has not promised to keep your data."}
                    </span>{" "}
                    <span className="text-muted">
                      {storage.usedMb !== null ? `Using about ${storage.usedMb} MB. ` : ""}
                      {storage.persisted
                        ? "It will not be cleared to free up space, but clearing site data still removes it."
                        : "It could be cleared if the device runs low on space, or if you go a long time without opening the app."}
                    </span>
                  </p>
                  <p className="mt-1.5 text-[12.5px]">
                    {settings.lastBackupAt ? (
                      <span className={backupStale ? "text-[var(--t-amber)]" : "text-muted"}>
                        Last backup {formatDate(new Date(settings.lastBackupAt), true)}
                        {backupStale ? ". Worth taking a fresh one." : "."}
                      </span>
                    ) : (
                      <span className="text-[var(--t-amber)]">
                        You have never downloaded a backup. If this browser is cleared, the work is gone.
                      </span>
                    )}
                  </p>
                </div>
                <p className="px-4 pt-3 text-[12.5px] text-muted">
                  Your pipeline lives here: statuses, notes, follow-ups and classifications save the moment you change them
                  {savedAt ? ` (last saved ${formatDate(new Date(savedAt), true)})` : ""}. The Excel export is for sharing a list
                  with someone else, you never need it to keep your work safe.
                </p>
                {/* A copy the user owns, kept current without them thinking about it. */}
                <div className="mx-4 mt-3 rounded-lg border border-line bg-subtle p-3">
                  <p className="text-[12.5px] font-medium">Keep a copy on your own machine</p>
                  {backupFile ? (
                    <>
                      <p className="mt-0.5 text-[12px] text-muted">
                        Writing to <strong className="text-ink">{backupFile}</strong> as you work. Keep that file on a
                        drive you back up and this workspace can always be restored.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            const ok = await writeBackup(exportBackup());
                            if (ok) updateSettings((st) => ({ ...st, lastBackupAt: new Date().toISOString() }));
                            toast(ok ? "Backup file updated." : "Could not write. Choose the file again to re-grant access.");
                          }}
                        >
                          Update it now
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await forgetBackupFile();
                            setBackupFile(null);
                            toast("Stopped writing to that file.");
                          }}
                        >
                          Stop
                        </Button>
                      </div>
                    </>
                  ) : autoBackupSupported() ? (
                    <>
                      <p className="mt-0.5 text-[12px] text-muted">
                        Pick a file once and it is rewritten as you work, so clearing this browser or moving machine
                        costs you nothing.
                      </p>
                      <Button
                        size="sm"
                        variant="primary"
                        className="mt-2"
                        onClick={async () => {
                          const name = await chooseBackupFile();
                          if (!name) return;
                          setBackupFile(name);
                          const ok = await writeBackup(exportBackup());
                          if (ok) updateSettings((st) => ({ ...st, lastBackupAt: new Date().toISOString() }));
                          toast(ok ? `Backing up to ${name}.` : "Chose the file, but could not write to it yet.");
                        }}
                      >
                        Choose a backup file
                      </Button>
                    </>
                  ) : (
                    <p className="mt-0.5 text-[12px] text-muted">
                      This browser cannot write to a file on its own. Chrome and Edge can. Otherwise, download a backup
                      below now and then, and keep it somewhere safe.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 p-4 pt-3">
                  <Button
                    onClick={() => {
                      updateSettings((st) => ({ ...st, toursSeen: [] }));
                      toast("Owlie will introduce each page again.");
                    }}
                  >
                    Show the guide again
                  </Button>
                  <Button
                    icon={Download}
                    onClick={() => {
                      downloadBackup(exportBackup());
                      updateSettings((st) => ({ ...st, lastBackupAt: new Date().toISOString() }));
                      toast("Backup downloaded.");
                    }}
                  >
                    Export workspace backup
                  </Button>
                  <input
                    ref={backupInput}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      try {
                        importBackup(await file.text());
                        toast("Backup restored.");
                      } catch (err) {
                        toast(err instanceof Error ? err.message : "Could not read that backup.");
                      }
                    }}
                  />
                  <Button icon={Upload} onClick={() => backupInput.current?.click()}>Restore backup or rules</Button>
                  <Button
                    variant="danger"
                    icon={Trash2}
                    onClick={async () => {
                      if (!window.confirm("Delete the imported file, all notes, statuses and rules from this browser?")) return;
                      await resetWorkspace();
                      router.push("/");
                    }}
                  >
                    Reset workspace
                  </Button>
                </div>
              </Card>
            </>
          ) : null}
        </div>
      </PageBody>
    </>
  );
}
