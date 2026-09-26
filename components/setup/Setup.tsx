"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { domainLabel } from "@/lib/intelligence";
import { FOCUS_GOALS } from "@/lib/workspace/focus";
import type { FocusGoalId } from "@/lib/workspace/types";
import { Mascot } from "@/components/shell/Mascot";
import { Button, Input, cx } from "@/components/ui";
import { useWorkspace } from "@/components/workspace/store";

/**
 * Runs once, after the first import, before the workspace opens.
 *
 * Two things happen here and nothing else. It shows what could actually be read
 * about the user from their own export, so they can correct it; and it asks what
 * they want from their network, because that is the one thing no file can tell us.
 * Everything on the first screen is read from the archive, never inferred.
 */
export function Setup() {
  const { people, settings, updateSettings } = useWorkspace();
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(settings.profile.name);
  const [background, setBackground] = useState(settings.profile.background);
  const [schools, setSchools] = useState(settings.profile.schools);
  const [school, setSchool] = useState("");
  const [goals, setGoals] = useState<FocusGoalId[]>(settings.focus.goals);
  const [direction, setDirection] = useState(settings.focus.direction);

  /** The largest areas in the network. Theirs, counted, not a claim about them. */
  const areas = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of people) {
      if (p.domain === "unclassified" || p.domain === "students") continue;
      m.set(p.domain, (m.get(p.domain) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [people]);

  const knowSomething = !!(name || background || schools.length);

  const finish = () => {
    updateSettings((s) => ({
      ...s,
      profile: { ...s.profile, name: name.trim(), background: background.trim(), schools },
      focus: { goals, direction: direction.trim(), confirmedAt: new Date().toISOString() },
    }));
  };

  const addSchool = () => {
    const v = school.trim();
    if (!v || schools.includes(v)) return;
    setSchools([...schools, v]);
    setSchool("");
  };

  return (
    <div className="flex h-full flex-col overflow-auto bg-panel">
      <div className="mx-auto flex w-full max-w-[620px] flex-1 flex-col justify-center px-6 py-12">
        <div className="anim-rise">
          <Mascot size={96} className="text-accent" />

          {step === 0 ? (
            <section className="mt-7">
              <h1 className="text-[27px] font-semibold leading-tight tracking-tight">
                {knowSomething ? "Here is what I understand about you." : "I could not read much about you."}
              </h1>
              <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed text-muted">
                {knowSomething
                  ? "Read from your own export. Only what was actually in the files."
                  : "Your export did not include a profile file. Tell me the basics and everything else still works."}
              </p>

              {editing || !knowSomething ? (
                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="text-[12.5px] font-medium">Your name</span>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Name" />
                  </label>
                  <label className="block">
                    <span className="text-[12.5px] font-medium">What you do right now</span>
                    <Input
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      className="mt-1"
                      placeholder="e.g. Mechanical Engineering student at NIT Warangal"
                    />
                  </label>
                  <div>
                    <span className="text-[12.5px] font-medium">Schools and colleges</span>
                    <p className="text-[12px] text-muted">Connections from these count as alumni.</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {schools.map((s) => (
                        <span key={s} className="flex items-center gap-1 rounded-md border border-line bg-subtle px-2 py-1 text-[12px]">
                          {s}
                          <button
                            type="button"
                            aria-label={`Remove ${s}`}
                            onClick={() => setSchools(schools.filter((x) => x !== s))}
                            className="text-faint transition hover:text-ink"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-1.5 flex gap-2">
                      <Input
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSchool();
                          }
                        }}
                        placeholder="Add a school"
                      />
                      <Button onClick={addSchool}>Add</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <dl className="mt-6 space-y-3 border-l-2 border-accent/30 pl-4">
                  {background ? (
                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Currently</dt>
                      <dd className="text-[15px]">{background}</dd>
                    </div>
                  ) : null}
                  {schools.length ? (
                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Studied at</dt>
                      <dd className="text-[15px]">{schools.join(" · ")}</dd>
                    </div>
                  ) : null}
                  {areas.length ? (
                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
                        Your network is concentrated in
                      </dt>
                      <dd className="text-[15px]">
                        {areas.map(([d, n]) => `${domainLabel(d)} (${n.toLocaleString()})`).join(" · ")}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              )}

              <p className="mt-7 text-[14px] font-medium">Anything I should add or change?</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => (editing ? setEditing(false) : setStep(1))}>
                  {editing ? "Save" : "Looks right"}
                </Button>
                {!editing && knowSomething ? <Button onClick={() => setEditing(true)}>Add or change</Button> : null}
                {editing || !knowSomething ? <Button variant="ghost" onClick={() => setStep(1)}>Continue</Button> : null}
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="mt-7">
              <h1 className="text-[27px] font-semibold leading-tight tracking-tight">
                What are you hoping to find through your network right now?
              </h1>
              <p className="mt-2 text-[14px] text-muted">Pick as many as apply. You can change this later.</p>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {FOCUS_GOALS.map((g) => {
                  const on = goals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setGoals(on ? goals.filter((x) => x !== g.id) : [...goals, g.id])}
                      className={cx(
                        "rounded-xl border p-3 text-left transition",
                        on ? "border-accent bg-accent-soft/50" : "border-line hover:border-line-strong hover:bg-hover",
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-[13.5px] font-medium">
                        {g.label}
                        {on ? <Check size={13} className="text-accent" /> : null}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">{g.hint}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                <Button variant="primary" disabled={!goals.length} onClick={() => setStep(2)}>Continue</Button>
                <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="mt-7">
              <h1 className="text-[27px] font-semibold leading-tight tracking-tight">
                Anything specific you are focusing on?
              </h1>
              <p className="mt-2 text-[14px] text-muted">Optional. It keeps the shortlists pointed the right way.</p>

              <Input
                autoFocus
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finish();
                }}
                placeholder="e.g. Looking for AI research internships"
                className="mt-5 h-11 text-[14px]"
              />
              <p className="mt-2 text-[12px] text-muted">
                Other examples: moving from engineering into product, or meeting founders building in climate tech.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                <Button variant="primary" onClick={finish}>
                  {direction.trim() ? "Done" : "Skip and open my network"}
                </Button>
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              </div>
            </section>
          ) : null}

          <div className="mt-10 flex gap-1.5" aria-label={`Step ${step + 1} of 3`}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cx("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-accent" : "w-1.5 bg-line-strong")}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
