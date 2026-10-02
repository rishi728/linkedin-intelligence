"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ListChecks, SkipForward, Undo2 } from "lucide-react";
import { CATEGORY_ID, CATS, NOPRO } from "@/lib/classifier/categories";
import { ROLE_FAMILIES, familiesOf, matchCategoriesInText } from "@/lib/classifier/search";
import type { RoleHierarchy } from "@/lib/classifier/corrections";
import type { Person } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { Avatar, Button, Card, Checkbox, EmptyState, Field, Meter, Pill, Select, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

interface Suggestion {
  label: string;
  hierarchy: RoleHierarchy;
}

/** The families most people end up in, so there is always something to press. */
const FALLBACK = [
  "Software Engineering",
  "Core Engineering",
  "Data Science & Analytics",
  "Product Management",
  "Consulting / Strategy",
  "Finance / Investment",
  "Operations / Supply Chain",
  "Sales / Marketing",
];

function push(out: Suggestion[], family: string, label?: string) {
  const entry = ROLE_FAMILIES.find((f) => f.family === family);
  if (!entry || out.some((s) => s.hierarchy.roleFamily === family)) return;
  out.push({
    label: label ?? `${family} \u00b7 ${entry.category}`,
    hierarchy: { category: CATEGORY_ID[entry.category], roleFamily: family },
  });
}

function suggestionsFor(person: Person): Suggestion[] {
  const out: Suggestion[] = [];
  if (person.category !== NOPRO && person.roleFamily) push(out, person.roleFamily, `Keep: ${person.roleFamily}`);
  // Anything the title hints at, including matches that lost to something else.
  for (const f of matchCategoriesInText(person.position).roleFamilies.slice(0, 5)) push(out, f);
  // Then the families inside the runner-up category, which is the likeliest fix.
  if (person.secondCategory) for (const f of familiesOf(person.secondCategory).slice(0, 3)) push(out, f);
  for (const f of FALLBACK) if (out.length < 8) push(out, f);
  return out.slice(0, 8);
}

export function ReviewView() {
  const { people, setClassification, updateRecord } = useWorkspace();
  const { openPerson, toast } = useUI();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [learn, setLearn] = useState(true);
  const [done, setDone] = useState<string[]>([]);
  const [custom, setCustom] = useState<{ category: string; roleFamily: string } | null>(null);

  const queue = useMemo(
    () => people
      .filter((p) => p.needsReview && p.category !== NOPRO && p.classSource === "classifier" && !done.includes(p.id))
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
      learn && sameTitle > 1 && person.position ? `Saved for ${n} people titled “${person.position}”` : `${person.name}: ${s.hierarchy.roleFamily}`,
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
    updateRecord(person.id, { classification: { category: CATEGORY_ID[NOPRO], roleFamily: NOPRO } }, { kind: "classification", text: "Marked as no role information" });
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
  }, [suggestions, accept, skip, markUnknown]);

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
                  <Pill tone={person.band === "High" ? "green" : person.band === "Medium" ? "blue" : "amber"}>
                    {`${person.band} confidence \u00b7 ${person.confidence}`}
                  </Pill>
                  {person.priorityScore > 0 ? <p className="mt-1 text-[11px] text-muted">Priority {person.priority}</p> : null}
                </div>
              </div>

              {person.method ? (
                <p className="mt-3 rounded-lg bg-subtle px-3 py-2 text-[12px] text-ink-2">{person.method}</p>
              ) : null}

              <p className="mb-2 mt-4 text-[11px] font-medium uppercase tracking-wide text-muted">Where does this person belong?</p>
              <div className="space-y-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={s.hierarchy.roleFamily}
                    type="button"
                    onClick={() => accept(s)}
                    className={cx(
                      "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] transition",
                      i === 0 ? "border-accent bg-accent-soft/50 hover:bg-accent-soft" : "border-line hover:border-line-strong hover:bg-hover",
                    )}
                  >
                    <kbd className="rounded border border-line bg-panel px-1.5 text-[11px] text-muted">{i + 1}</kbd>
                    <span className="flex-1 truncate">{s.label}</span>
                    <span className="text-[11.5px] text-muted">{CATS.find((c) => CATEGORY_ID[c] === s.hierarchy.category)}</span>
                    <ChevronRight size={13} className="text-faint" />
                  </button>
                ))}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Field label="Or choose a category">
                  <Select
                    value={custom?.category ?? ""}
                    onChange={(e) => {
                      const c = CATS.find((x) => CATEGORY_ID[x] === e.target.value);
                      setCustom(c ? { category: CATEGORY_ID[c], roleFamily: familiesOf(c)[0] ?? c } : null);
                    }}
                  >
                    <option value="">-</option>
                    {CATS.map((c) => (
                      <option key={c} value={CATEGORY_ID[c]}>{c}</option>
                    ))}
                  </Select>
                </Field>
                {custom ? (
                  <Field label="Role family">
                    <div className="flex gap-2">
                      <Select value={custom.roleFamily} onChange={(e) => setCustom({ ...custom, roleFamily: e.target.value })}>
                        {familiesOf(CATS.find((c) => CATEGORY_ID[c] === custom.category) ?? CATS[0]).map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </Select>
                      <Button
                        variant="primary"
                        icon={Check}
                        onClick={() => accept({ label: custom.roleFamily, hierarchy: custom })}
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
