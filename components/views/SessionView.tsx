"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Send, SkipForward, ThumbsDown } from "lucide-react";
import { addDays, todayISO } from "@/lib/workspace/dates";
import { applyFilters } from "@/lib/workspace/filters";
import { LINKEDIN_NOTE_LIMIT, renderTemplate, templateVars } from "@/lib/workspace/outreach";
import type { Person } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { Avatar, Button, Card, EmptyState, Field, Pill, Select, Textarea, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

/**
 * Work through a shortlist one person at a time: message ready, profile a click
 * away, status and follow-up handled when you mark it sent.
 */
export function SessionView() {
  const { people, settings, setStatus, updateRecord } = useWorkspace();
  const { peopleFilters, openPerson, toast } = useUI();
  const router = useRouter();
  const today = todayISO();

  const [queue, setQueue] = useState<Person[] | null>(null);
  const [pos, setPos] = useState(0);
  const [templateId, setTemplateId] = useState(settings.templates[0]?.id ?? "");
  const [edited, setEdited] = useState<string | null>(null);
  const [sent, setSent] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [copied, setCopied] = useState(false);
  const [dir, setDir] = useState<"next" | "prev">("next");

  const candidates = useMemo(() => {
    const closed = new Set(settings.statuses.filter((s) => s.kind === "closed").map((s) => s.id));
    return applyFilters(people, peopleFilters, settings)
      .filter((p) => !closed.has(p.status) && p.status !== "contacted" && p.status !== "awaiting")
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [people, peopleFilters, settings]);

  const current = queue ? queue[pos] : null;
  const live = current ? people.find((p) => p.id === current.id) ?? current : null;
  const template = settings.templates.find((t) => t.id === templateId) ?? settings.templates[0];
  const message = useMemo(
    () => (live && template ? edited ?? renderTemplate(template.body, templateVars(live, settings)) : ""),
    [live, template, settings, edited],
  );
  const overLimit = message.length > LINKEDIN_NOTE_LIMIT;

  const next = () => {
    setEdited(null);
    setCopied(false);
    setDir("next");
    setPos((p) => p + 1);
  };

  const prev = () => {
    if (pos === 0) return;
    setEdited(null);
    setCopied(false);
    setDir("prev");
    setPos((p) => p - 1);
  };

  const markSent = () => {
    if (!live) return;
    setStatus([live.id], "contacted");
    updateRecord(live.id, (rec) => ({
      draft: message,
      channel: rec.channel || "LinkedIn",
      sequenceStep: 1,
      followUpAt: settings.cadence.enabled ? addDays(today, settings.cadence.steps[0] ?? 5) : rec.followUpAt,
    }));
    setSent((n) => n + 1);
    toast(`${live.name} marked as contacted`, { label: "Undo", run: () => setStatus([live.id], "to_contact") });
    next();
  };

  const notAFit = () => {
    if (!live) return;
    setStatus([live.id], "not_interested");
    setSkipped((n) => n + 1);
    next();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Couldn't copy automatically — select the text and copy it.");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!queue || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const k = e.key.toLowerCase();
      if (k === "c") { e.preventDefault(); void copy(); }
      else if (k === "o" && live?.url) { e.preventDefault(); window.open(live.url, "_blank", "noopener,noreferrer"); }
      else if (k === "s") { e.preventDefault(); markSent(); }
      else if (k === "k") { e.preventDefault(); setSkipped((n) => n + 1); next(); }
      else if (k === "n") { e.preventDefault(); notAFit(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  if (!queue) {
    return (
      <>
        <PageHeader title="Outreach session" subtitle="Work through a shortlist without losing your place" />
        <PageBody>
          <div className="mx-auto max-w-xl">
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">Ready when you are</h2>
              <p className="mt-1 text-[12.5px] text-muted">
                {candidates.length.toLocaleString()} people match your current filters and haven&apos;t been contacted yet.
                Each one appears with a message ready to copy; marking it sent moves them along the pipeline and schedules the follow-up.
              </p>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <Field label="Message template">
                  <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                    {settings.templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} · {t.channel}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Session size">
                  <Select
                    defaultValue="10"
                    onChange={(e) => setQueue(candidates.slice(0, Number(e.target.value)))}
                  >
                    {[5, 10, 20, 50].map((n) => (
                      <option key={n} value={n}>{Math.min(n, candidates.length)} people</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="primary" disabled={!candidates.length} onClick={() => setQueue(candidates.slice(0, 10))}>
                  Start with {Math.min(10, candidates.length)}
                </Button>
                <Button onClick={() => router.push("/people")}>Change the shortlist</Button>
              </div>
              {!candidates.length ? (
                <p className="mt-3 text-[12px] text-[var(--t-orange)]">Nothing matches right now — pick a segment or filter in People first.</p>
              ) : null}
            </Card>
          </div>
        </PageBody>
      </>
    );
  }

  if (!live) {
    return (
      <>
        <PageHeader title="Session complete" subtitle={`${sent} contacted · ${skipped} skipped`} />
        <PageBody>
          <EmptyState
            icon={Check}
            title="That's the whole list"
            body={sent ? `${sent} people moved to Contacted, each with a follow-up scheduled.` : "Nothing was sent this time."}
            action={
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => { setQueue(null); setPos(0); setSent(0); setSkipped(0); }}>Start another session</Button>
                <Button onClick={() => router.push("/follow-ups")}>See follow-ups</Button>
              </div>
            }
          />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Conversations"
        subtitle={`${sent} contacted${skipped ? ` · ${skipped} skipped` : ""}`}
        actions={<Button onClick={() => setQueue(null)}>End session</Button>}
      />
      <PageBody className="px-6 py-8">
        <div className="mx-auto w-full max-w-2xl">

          {/* ---- carousel ------------------------------------------------- */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous person"
              disabled={pos === 0}
              onClick={prev}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-line-strong hover:text-ink disabled:opacity-30 disabled:hover:border-line"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="min-w-0 flex-1">
              <p className="tabular mb-2 text-center text-[11.5px] tracking-wide text-faint">
                {String(pos + 1).padStart(2, "0")} / {String(queue.length).padStart(2, "0")}
              </p>

              <article key={live.id} className={cx("rounded-2xl border border-line bg-panel p-6", dir === "next" ? "anim-next" : "anim-prev")}>
                <div className="text-center">
                  <Avatar name={live.name} size={44} />
                  <button
                    type="button"
                    onClick={() => openPerson(live.id)}
                    className="mt-3 block w-full truncate text-[20px] font-semibold tracking-tight transition hover:text-accent"
                  >
                    {live.name}
                  </button>
                  <p className="mt-0.5 truncate text-[13.5px] text-ink-2">{live.position || live.role}</p>
                  {live.company ? <p className="truncate text-[12.5px] text-muted">{live.company}</p> : null}

                  {(live.isTarget || live.isAlumni || live.history?.theyReplied) && (
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {live.isTarget ? <Pill tone="teal">Target company</Pill> : null}
                      {live.isAlumni ? <Pill tone="violet">Alumni</Pill> : null}
                      {live.history?.theyReplied ? <Pill tone="green">Replied before</Pill> : null}
                    </div>
                  )}
                </div>

                {live.priorityReasons.length ? (
                  <div className="mt-5 border-t border-line pt-4">
                    <p className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">Why this person</p>
                    <ul className="space-y-0.5">
                      {live.priorityReasons.slice(0, 3).map((r) => (
                        <li key={r} className="text-[12.5px] leading-relaxed text-ink-2">{r}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-5 border-t border-line pt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">Message</span>
                    <span className={cx("tabular text-[11.5px]", overLimit ? "font-medium text-[var(--t-red)]" : "text-faint")}>
                      {message.length} / {LINKEDIN_NOTE_LIMIT}
                    </span>
                  </div>
                  <Textarea value={message} onChange={(e) => setEdited(e.target.value)} rows={6} className="text-[13px] leading-relaxed" />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button variant="primary" icon={copied ? Check : Copy} onClick={copy}>{copied ? "Copied" : "Copy message"}</Button>
                  {live.url ? (
                    <Button icon={ExternalLink} onClick={() => window.open(live.url, "_blank", "noopener,noreferrer")}>Open LinkedIn</Button>
                  ) : null}
                  <Button icon={Send} onClick={markSent}>Mark sent</Button>
                  <span className="ml-auto flex gap-1">
                    <Button variant="ghost" icon={SkipForward} onClick={() => { setSkipped((n) => n + 1); next(); }}>Skip</Button>
                    <Button variant="ghost" icon={ThumbsDown} onClick={notAFit}>Not a fit</Button>
                  </span>
                </div>
              </article>
            </div>

            <button
              type="button"
              aria-label="Next person"
              onClick={next}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-line-strong hover:text-ink"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* ---- progress, as dots you can jump with ----------------------- */}
          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            {queue.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Go to ${p.name}`}
                aria-current={i === pos ? "true" : undefined}
                onClick={() => { setDir(i > pos ? "next" : "prev"); setEdited(null); setPos(i); }}
                className={cx(
                  "h-1.5 rounded-full transition-all",
                  i === pos ? "w-6 bg-accent" : i < pos ? "w-1.5 bg-line-strong" : "w-1.5 bg-line hover:bg-line-strong",
                )}
              />
            ))}
          </div>

          <p className="mt-5 text-center text-[11.5px] text-muted">
            <kbd className="rounded border border-line px-1">←</kbd> <kbd className="rounded border border-line px-1">→</kbd> move ·{" "}
            <kbd className="rounded border border-line px-1">C</kbd> copy · <kbd className="rounded border border-line px-1">O</kbd> open ·{" "}
            <kbd className="rounded border border-line px-1">S</kbd> sent · <kbd className="rounded border border-line px-1">N</kbd> not a fit
          </p>
        </div>
      </PageBody>
    </>
  );
}
