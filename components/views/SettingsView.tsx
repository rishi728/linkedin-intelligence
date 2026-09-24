"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, Trash2, Upload, X } from "lucide-react";
import { CsvFormatError } from "@/lib/analyzer";
import { domainLabel, functionLabel } from "@/lib/intelligence";
import { DOMAINS } from "@/lib/roles";
import { SENIORITY_LEVELS } from "@/lib/taxonomy";
import { OPPORTUNITY_TYPES, PURPOSES, CHANNELS, defaultSettings } from "@/lib/workspace/defaults";
import { groupCompanies } from "@/lib/workspace/insights";
import { TEMPLATE_VARIABLES } from "@/lib/workspace/outreach";
import type { StatusDef, Tone } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { Button, Card, CardTitle, Checkbox, Field, Input, Pill, Segmented, Select, Textarea, Toggle, cx } from "@/components/ui";
import { ArchiveImport } from "@/components/workspace/ArchiveImport";
import { DEFAULT_WEIGHTS } from "@/lib/workspace/defaults";
import { formatDate } from "@/lib/workspace/dates";
import { useUI, useWorkspace } from "@/components/workspace/store";

type Tab = "goals" | "targets" | "pipeline" | "outreach" | "templates" | "rules" | "data";

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

export function SettingsView() {
  const {
    people, settings, updateSettings, deleteRule, deleteSegment, toggleTarget, importCsv, exportBackup, importBackup,
    resetWorkspace, dataset, snapshots, restoreSnapshot, savedAt,
  } = useWorkspace();
  const { toast } = useUI();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("goals");
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
        subtitle="Goals, targets, pipeline, templates and your data — all stored in this browser"
        actions={
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "goals", label: "Goals" },
              { value: "targets", label: "Targets" },
              { value: "pipeline", label: "Pipeline" },
              { value: "outreach", label: "Outreach" },
              { value: "templates", label: "Templates" },
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
                <CardTitle hint="What you're looking for right now — this drives priority">Goals</CardTitle>
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
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Target domains</p>
                    <div className="flex flex-wrap gap-2">
                      {DOMAINS.filter((d) => d.id !== "unclassified").map((d) => (
                        <Chip key={d.id} active={settings.goals.domains.includes(d.id)} onClick={() => toggle(settings.goals.domains, d.id, (next) => updateSettings((s) => ({ ...s, goals: { ...s.goals, domains: next } })))}>
                          {d.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Target functions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {settings.goals.functions.map((f) => (
                        <button key={f} type="button" onClick={() => toggle(settings.goals.functions, f, (next) => updateSettings((s) => ({ ...s, goals: { ...s.goals, functions: next } })))} className="inline-flex items-center gap-1 rounded-md border border-accent bg-accent-soft px-2 py-0.5 text-[12px] text-accent">
                          {functionLabel(f)}
                          <X size={11} />
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 max-w-sm">
                      <Select
                        value=""
                        onChange={(e) => e.target.value && toggle(settings.goals.functions, e.target.value, (next) => updateSettings((s) => ({ ...s, goals: { ...s.goals, functions: next } })))}
                      >
                        <option value="">Add a function…</option>
                        {DOMAINS.filter((d) => d.id !== "unclassified").map((d) => (
                          <optgroup key={d.id} label={d.label}>
                            {d.functions.map((f) => (
                              <option key={f.id} value={f.id}>{f.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Seniority you want to reach</p>
                    <div className="flex flex-wrap gap-2">
                      {SENIORITY_LEVELS.filter((s) => s !== "Unknown").map((lvl) => (
                        <Chip key={lvl} active={settings.goals.seniorities.includes(lvl)} onClick={() => toggle(settings.goals.seniorities, lvl, (next) => updateSettings((s) => ({ ...s, goals: { ...s.goals, seniorities: next } })))}>
                          {lvl}
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
                  {!settings.targetCompanies.length ? <p className="text-[12.5px] text-muted">No targets yet — add a few below.</p> : null}
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
                <CardTitle hint="When you mark someone as contacted, the next nudge is scheduled for you">Follow-up cadence</CardTitle>
                <div className="p-4 pt-3">
                  <Checkbox
                    checked={settings.cadence.enabled}
                    onChange={(v) => updateSettings((s) => ({ ...s, cadence: { ...s.cadence, enabled: v } }))}
                    label="Schedule follow-ups automatically"
                  />
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    {settings.cadence.steps.map((d, i) => (
                      <Field key={i} label={i === 0 ? "First nudge" : i === 1 ? "Second nudge" : `Nudge ${i + 1}`} className="w-32">
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
                      </Field>
                    ))}
                    <Button
                      onClick={() => updateSettings((s) => ({ ...s, cadence: { ...s.cadence, steps: [...s.cadence.steps, (s.cadence.steps.at(-1) ?? 7) + 7] } }))}
                    >
                      Add a step
                    </Button>
                    {settings.cadence.steps.length > 1 ? (
                      <Button variant="ghost" onClick={() => updateSettings((s) => ({ ...s, cadence: { ...s.cadence, steps: s.cadence.steps.slice(0, -1) } }))}>
                        Remove last
                      </Button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[12px] text-muted">
                    Days after the previous step. Marking a follow-up done moves the person to the next step automatically.
                  </p>
                </div>
              </Card>

              <Card>
                <CardTitle
                  hint="How each signal moves someone up your priority list"
                  action={<Button size="sm" onClick={() => updateSettings((s) => ({ ...s, weights: { ...DEFAULT_WEIGHTS } }))}>Reset</Button>}
                >
                  Priority weights
                </CardTitle>
                <div className="grid gap-3 p-4 pt-3 sm:grid-cols-2">
                  {([
                    ["functionMatch", "Target function"],
                    ["domainMatch", "Target domain"],
                    ["targetCompany", "Target company"],
                    ["seniorityMatch", "Target seniority"],
                    ["recruiter", "Recruiter (when job hunting)"],
                    ["hiring", "Mentions hiring"],
                    ["alumni", "Shares your school"],
                    ["replied", "Has replied to you"],
                    ["theyInvited", "They invited you"],
                    ["hasEmail", "Email available"],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span>{label}</span>
                        <span className="tabular text-muted">+{settings.weights[key]}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={40}
                        value={settings.weights[key]}
                        onChange={(e) => updateSettings((s) => ({ ...s, weights: { ...s.weights, [key]: Number(e.target.value) } }))}
                        className="mt-1 w-full accent-[var(--accent)]"
                      />
                    </div>
                  ))}
                </div>
                <p className="px-4 pb-4 text-[12px] text-muted">
                  High priority starts at 55 points. Every person&apos;s profile lists exactly which of these applied to them.
                </p>
              </Card>
            </>
          ) : null}

          {tab === "templates" ? (
            <Card>
              <CardTitle
                hint={`Variables: ${TEMPLATE_VARIABLES.map((v) => `{{${v.key}}}`).join(", ")}`}
                action={
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateSettings((s) => ({ ...s, templates: defaultSettings().templates }))}>Reset</Button>
                    <Button
                      size="sm"
                      icon={Plus}
                      onClick={() => updateSettings((s) => ({ ...s, templates: [...s.templates, { id: `t_${Date.now()}`, name: "New template", purpose: "Networking", channel: "LinkedIn", body: "Hi {{first_name}}, …" }] }))}
                    >
                      Add
                    </Button>
                  </div>
                }
              >
                Message templates
              </CardTitle>
              <div className="space-y-3 p-4 pt-3">
                {settings.templates.map((t) => (
                  <div key={t.id} className="rounded-xl border border-line p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Input defaultValue={t.name} onBlur={(e) => updateSettings((s) => ({ ...s, templates: s.templates.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)) }))} className="h-7 w-48" />
                      <div className="w-36">
                        <Select value={t.purpose} onChange={(e) => updateSettings((s) => ({ ...s, templates: s.templates.map((x) => (x.id === t.id ? { ...x, purpose: e.target.value } : x)) }))} className="h-7 text-[12px]">
                          {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </Select>
                      </div>
                      <div className="w-32">
                        <Select value={t.channel} onChange={(e) => updateSettings((s) => ({ ...s, templates: s.templates.map((x) => (x.id === t.id ? { ...x, channel: e.target.value } : x)) }))} className="h-7 text-[12px]">
                          {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Select>
                      </div>
                      <Button size="sm" variant="ghost" icon={Trash2} className="ml-auto" onClick={() => updateSettings((s) => ({ ...s, templates: s.templates.filter((x) => x.id !== t.id) }))}>
                        Delete
                      </Button>
                    </div>
                    <Textarea
                      defaultValue={t.body}
                      rows={4}
                      className="mt-2"
                      onBlur={(e) => updateSettings((s) => ({ ...s, templates: s.templates.map((x) => (x.id === t.id ? { ...x, body: e.target.value } : x)) }))}
                    />
                  </div>
                ))}
              </div>
            </Card>
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
                    const affected = people.filter((p) => p.classSource === "rule" && p.reasons[0]?.includes(r.example)).length;
                    return (
                      <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-hover">
                        <span className="truncate text-[12.5px] font-medium">“{r.example}”</span>
                        <span className="text-[12px] text-muted">
                          → {[r.set.domain && domainLabel(r.set.domain), r.set.fn && functionLabel(r.set.fn), r.set.role, r.set.seniority].filter(Boolean).join(" · ")}
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
                    Importing a newer export keeps all your notes, statuses, follow-ups and classifications — they’re matched by LinkedIn profile URL.
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
                <p className="px-4 pt-3 text-[12.5px] text-muted">
                  Your pipeline lives here: statuses, notes, follow-ups and classifications save the moment you change them
                  {savedAt ? ` (last saved ${formatDate(new Date(savedAt), true)})` : ""}. The Excel export is for sharing a list
                  with someone else — you never need it to keep your work safe.
                </p>
                <div className="flex flex-wrap gap-2 p-4 pt-3">
                  <Button
                    icon={Download}
                    onClick={() => {
                      const blob = new Blob([exportBackup()], { type: "application/json" });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `netlens-backup-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(a.href);
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
