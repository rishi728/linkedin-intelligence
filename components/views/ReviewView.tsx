"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ListChecks, SkipForward, Undo2 } from "lucide-react";
import { domainLabel, functionLabel, rolesInText, FUNCTIONS } from "@/lib/intelligence";
import { DOMAINS } from "@/lib/roles";
import type { Hierarchy } from "@/lib/intelligence";
import type { Person } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { Avatar, Button, Card, Checkbox, EmptyState, Field, Meter, Pill, Select, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

interface Suggestion {
  label: string;
  hierarchy: Pick<Hierarchy, "domain" | "fn" | "role">;
}

function suggestionsFor(person: Person): Suggestion[] {
  const out: Suggestion[] = [];
  const push = (domain: string, fn: string, role: string, label?: string) => {
    if (out.some((s) => s.hierarchy.fn === fn && s.hierarchy.role === role)) return;
    out.push({ label: label ?? `${role} · ${functionLabel(fn)}`, hierarchy: { domain, fn, role } });
  };
  if (person.domain !== "unclassified") push(person.domain, person.fn, person.role, `Keep: ${person.role} · ${functionLabel(person.fn)}`);
  // Anything the title hints at, including matches that lost to something else.
  for (const c of rolesInText(person.position).slice(0, 5)) push(c.domain, c.fn, c.role);
  // Common destinations, so there is always something to press.
  for (const fn of ["software-engineering", "management-consulting", "product-management", "business-ops", "students", "sales"]) {
    const info = FUNCTIONS.get(fn);
    if (info && out.length < 8) push(info.domain, info.id, info.generalist);
  }
  return out.slice(0, 8);
}

export function ReviewView() {
  const { people, setClassification, updateRecord } = useWorkspace();
  const { openPerson, toast } = useUI();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [learn, setLearn] = useState(true);
  const [done, setDone] = useState<string[]>([]);
  const [custom, setCustom] = useState<{ domain: string; fn: string } | null>(null);

  const queue = useMemo(
    () => people
      .filter((p) => (p.needsReview || p.domain === "unclassified") && p.classSource === "auto" && !done.includes(p.id))
      .sort((a, b) => b.priorityScore - a.priorityScore || (b.position ? 1 : 0) - (a.position ? 1 : 0)),
    [people, done],
  );
  const person = queue[index] ?? queue[0] ?? null;
  const suggestions = useMemo(() => (person ? suggestionsFor(person) : []), [person]);
  const sameTitle = useMemo(
    () => (person?.position ? people.filter((p) => p.position.toLowerCase() === person.position.toLowerCase()).length : 1),
    [people, person],
  );

  const accept = (s: Suggestion) => {
    if (!person) return;
    const n = setClassification(person.id, { ...s.hierarchy, seniority: person.seniority, industry: person.industry }, learn && sameTitle > 1 ? "exact" : null);
    setDone((d) => [...d, person.id]);
    setCustom(null);
    toast(
      learn && sameTitle > 1 && person.position ? `Saved for ${n} people titled “${person.position}”` : `${person.name}: ${s.hierarchy.role}`,
      { label: "Undo", run: () => setDone((d) => d.filter((x) => x !== person.id)) },
    );
  };

  const skip = () => {
    if (!person) return;
    setDone((d) => [...d, person.id]);
    setCustom(null);
    setIndex(0);
  };

  const markUnknown = () => {
    if (!person) return;
    updateRecord(person.id, { classification: { domain: "unclassified", fn: "unclassified", role: "Role not shared" } }, { kind: "classification", text: "Marked as no role information" });
    setDone((d) => [...d, person.id]);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
      const n = Number(e.key);
      if (n >= 1 && n <= suggestions.length) {
        e.preventDefault();
        accept(suggestions[n - 1]);
      } else if (e.key === "Enter" && suggestions[0]) {
        e.preventDefault();
        accept(suggestions[0]);
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        skip();
      } else if (e.key.toLowerCase() === "u") {
        e.preventDefault();
        markUnknown();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const total = queue.length + done.length;
  const progress = total ? (done.length / total) * 100 : 100;

  return (
    <>
      <PageHeader
        title="Review"
        subtitle={queue.length ? `${queue.length.toLocaleString()} left to check · ${done.length} done this session` : "Nothing left to review"}
        actions={
          <>
            {done.length ? (
              <Button icon={Undo2} onClick={() => { setDone((d) => d.slice(0, -1)); setIndex(0); }}>Undo last</Button>
            ) : null}
            <Button onClick={() => router.push("/people")}>Back to people</Button>
          </>
        }
      />
      <PageBody>
        {!person ? (
          <EmptyState
            icon={ListChecks}
            title="Every connection has been checked"
            body="Nothing is sitting on a weak guess. New reviews appear here whenever you import a fresh export."
            action={<Button variant="primary" onClick={() => router.push("/people")}>Go to people</Button>}
          />
        ) : (
          <div className="mx-auto max-w-2xl">
            <div className="mb-4">
              <Meter value={progress} />
              <p className="mt-1.5 text-[11.5px] text-muted">
                Press <kbd className="rounded border border-line px-1">1</kbd>–<kbd className="rounded border border-line px-1">{suggestions.length}</kbd> to pick,{" "}
                <kbd className="rounded border border-line px-1">S</kbd> to skip, <kbd className="rounded border border-line px-1">U</kbd> if there is nothing to classify.
              </p>
            </div>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <Avatar name={person.name} size={40} />
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => openPerson(person.id)} className="text-left">
                    <h2 className="truncate text-[17px] font-semibold tracking-tight hover:text-accent">{person.name}</h2>
                  </button>
                  <p className="mt-0.5 text-[13px] text-ink-2">{person.position || <span className="text-muted">No job title in the export</span>}</p>
                  <p className="text-[12.5px] text-muted">{person.company || "No company in the export"}</p>
                </div>
                <div className="text-right">
                  <Pill tone={person.domain === "unclassified" ? "gray" : person.confidence >= 60 ? "blue" : "amber"}>
                    {person.fn === "unspecified" ? "Area not stated" : person.domain === "unclassified" ? "No role data" : `${person.confidence}% sure`}
                  </Pill>
                  {person.priorityScore > 0 ? <p className="mt-1 text-[11px] text-muted">Priority {person.priority}</p> : null}
                </div>
              </div>

              {person.reasons.length ? (
                <p className="mt-3 rounded-lg bg-subtle px-3 py-2 text-[12px] text-ink-2">Matched {person.reasons.join(" · ")}</p>
              ) : null}

              <p className="mb-2 mt-4 text-[11px] font-medium uppercase tracking-wide text-muted">Where does this person belong?</p>
              <div className="space-y-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.hierarchy.fn}-${s.hierarchy.role}`}
                    type="button"
                    onClick={() => accept(s)}
                    className={cx(
                      "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] transition",
                      i === 0 ? "border-accent bg-accent-soft/50 hover:bg-accent-soft" : "border-line hover:border-line-strong hover:bg-hover",
                    )}
                  >
                    <kbd className="rounded border border-line bg-panel px-1.5 text-[11px] text-muted">{i + 1}</kbd>
                    <span className="flex-1 truncate">{s.label}</span>
                    <span className="text-[11.5px] text-muted">{domainLabel(s.hierarchy.domain)}</span>
                    <ChevronRight size={13} className="text-faint" />
                  </button>
                ))}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Field label="Or choose a domain">
                  <Select
                    value={custom?.domain ?? ""}
                    onChange={(e) => {
                      const d = DOMAINS.find((x) => x.id === e.target.value);
                      setCustom(d ? { domain: d.id, fn: d.functions[0].id } : null);
                    }}
                  >
                    <option value="">-</option>
                    {DOMAINS.filter((d) => d.id !== "unclassified").map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </Select>
                </Field>
                {custom ? (
                  <Field label="Function">
                    <div className="flex gap-2">
                      <Select value={custom.fn} onChange={(e) => setCustom({ ...custom, fn: e.target.value })}>
                        {DOMAINS.find((d) => d.id === custom.domain)!.functions.map((f) => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </Select>
                      <Button
                        variant="primary"
                        icon={Check}
                        onClick={() => accept({ label: "", hierarchy: { domain: custom.domain, fn: custom.fn, role: FUNCTIONS.get(custom.fn)!.generalist } })}
                      >
                        Set
                      </Button>
                    </div>
                  </Field>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                {sameTitle > 1 && person.position ? (
                  <Checkbox checked={learn} onChange={setLearn} label={<span>Apply to all <strong>{sameTitle}</strong> people titled “{person.position}”</span>} />
                ) : <span className="text-[12px] text-muted">Only this person has this title.</span>}
                <div className="flex gap-2">
                  <Button icon={SkipForward} onClick={skip}>Skip</Button>
                  <Button onClick={markUnknown}>Nothing to classify</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </PageBody>
    </>
  );
}
