"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ListChecks, SkipForward, Undo2 } from "lucide-react";
import { matchRolesInText, type RoleHierarchy } from "@/lib/knowledge/classify";
import { ROLE_BUCKETS, ROLE_PATH, bucketLabel, roleLabel, sectionLabel } from "@/lib/knowledge/roles";
import type { Person } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { Avatar, Button, Card, Checkbox, EmptyState, Field, Meter, Pill, Select, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

interface Suggestion {
  label: string;
  hierarchy: RoleHierarchy;
}

/** The most common places a person like this belongs, so there is always something to press. */
const FALLBACK_ROLES = [
  "software-engineer", "data-analyst", "product-manager", "management-consultant",
  "business-development-manager", "operations-manager", "recruiter", "finance-manager",
];

function push(out: Suggestion[], roleId: string, label?: string) {
  const path = ROLE_PATH.get(roleId);
  if (!path || out.some((s) => s.hierarchy.roleId === roleId)) return;
  out.push({
    label: label ?? `${path.roleLabel} · ${path.sectionLabel}`,
    hierarchy: { bucket: path.bucketId, section: path.sectionId, roleId: path.roleId },
  });
}

function suggestionsFor(person: Person): Suggestion[] {
  const out: Suggestion[] = [];
  if (person.roleId) push(out, person.roleId, `Keep: ${roleLabel(person.roleId)}`);
  // Anything the title hints at, including matches that lost to something else.
  for (const roleId of matchRolesInText(person.position).roles.slice(0, 5)) push(out, roleId);
  for (const roleId of FALLBACK_ROLES) if (out.length < 8) push(out, roleId);
  return out.slice(0, 8);
}

export function ReviewView() {
  const { people, setClassification, updateRecord } = useWorkspace();
  const { openPerson, toast } = useUI();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [learn, setLearn] = useState(true);
  const [done, setDone] = useState<string[]>([]);
  const [custom, setCustom] = useState<{ bucket: string; section: string } | null>(null);

  const queue = useMemo(
    () => people
      .filter((p) => (p.needsReview || !p.bucket) && p.classSource === "repository" && !done.includes(p.id))
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
    const n = setClassification(person.id, s.hierarchy, learn && sameTitle > 1 ? "exact" : null);
    setDone((d) => [...d, person.id]);
    setCustom(null);
    toast(
      learn && sameTitle > 1 && person.position ? `Saved for ${n} people titled “${person.position}”` : `${person.name}: ${roleLabel(s.hierarchy.roleId)}`,
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
    updateRecord(person.id, { classification: { bucket: "", section: "", roleId: "" } }, { kind: "classification", text: "Marked as no role information" });
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
                  <Pill tone={!person.bucket ? "gray" : person.certainty === "medium" ? "blue" : "amber"}>
                    {person.bucket ? `${person.certainty[0].toUpperCase()}${person.certainty.slice(1)} confidence` : "Role not stated"}
                  </Pill>
                  {person.priorityScore > 0 ? <p className="mt-1 text-[11px] text-muted">Priority {person.priority}</p> : null}
                </div>
              </div>

              {person.evidence.length ? (
                <p className="mt-3 rounded-lg bg-subtle px-3 py-2 text-[12px] text-ink-2">{person.evidence.join(" · ")}</p>
              ) : null}

              <p className="mb-2 mt-4 text-[11px] font-medium uppercase tracking-wide text-muted">Where does this person belong?</p>
              <div className="space-y-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={s.hierarchy.roleId}
                    type="button"
                    onClick={() => accept(s)}
                    className={cx(
                      "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] transition",
                      i === 0 ? "border-accent bg-accent-soft/50 hover:bg-accent-soft" : "border-line hover:border-line-strong hover:bg-hover",
                    )}
                  >
                    <kbd className="rounded border border-line bg-panel px-1.5 text-[11px] text-muted">{i + 1}</kbd>
                    <span className="flex-1 truncate">{s.label}</span>
                    <span className="text-[11.5px] text-muted">{bucketLabel(s.hierarchy.bucket)}</span>
                    <ChevronRight size={13} className="text-faint" />
                  </button>
                ))}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Field label="Or choose a role area">
                  <Select
                    value={custom?.bucket ?? ""}
                    onChange={(e) => {
                      const b = ROLE_BUCKETS.find((x) => x.id === e.target.value);
                      setCustom(b ? { bucket: b.id, section: b.sections[0].id } : null);
                    }}
                  >
                    <option value="">-</option>
                    {ROLE_BUCKETS.map((b) => (
                      <option key={b.id} value={b.id}>{b.label}</option>
                    ))}
                  </Select>
                </Field>
                {custom ? (
                  <Field label="Section">
                    <div className="flex gap-2">
                      <Select value={custom.section} onChange={(e) => setCustom({ ...custom, section: e.target.value })}>
                        {ROLE_BUCKETS.find((b) => b.id === custom.bucket)!.sections.map((x) => (
                          <option key={x.id} value={x.id}>{x.label}</option>
                        ))}
                      </Select>
                      <Button
                        variant="primary"
                        icon={Check}
                        onClick={() => {
                          const section = ROLE_BUCKETS.find((b) => b.id === custom.bucket)!.sections.find((x) => x.id === custom.section)!;
                          accept({
                            label: sectionLabel(custom.bucket, custom.section),
                            hierarchy: { bucket: custom.bucket, section: custom.section, roleId: section.roles[0].id },
                          });
                        }}
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
