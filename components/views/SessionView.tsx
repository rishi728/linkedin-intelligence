"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Send, SkipForward, ThumbsDown, Users } from "lucide-react";
import { functionLabel } from "@/lib/intelligence";
import { addDays, todayISO } from "@/lib/workspace/dates";
import { applyFilters } from "@/lib/workspace/filters";
import { LINKEDIN_NOTE_LIMIT, renderTemplate, templateVars } from "@/lib/workspace/outreach";
import type { Person } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { Avatar, Button, Card, EmptyState, Field, Meter, Pill, Select, Textarea, cx } from "@/components/ui";
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
    setPos((p) => p + 1);
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
        title="Outreach session"
        subtitle={`${pos + 1} of ${queue.length} · ${sent} contacted`}
        actions={<Button onClick={() => setQueue(null)}>End session</Button>}
      />
      <PageBody>
        <div className="mx-auto max-w-3xl">
          <Meter value={((pos) / queue.length) * 100} />

          <Card className="mt-4 p-5">
            <div className="flex items-start gap-3">
              <Avatar name={live.name} size={42} />
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => openPerson(live.id)} className="truncate text-[17px] font-semibold tracking-tight hover:text-accent">
                  {live.name}
                </button>
                <p className="truncate text-[13px] text-ink-2">{live.position || live.role}</p>
                <p className="truncate text-[12.5px] text-muted">{live.company}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                {live.isTarget ? <Pill tone="teal">Target</Pill> : null}
                {live.isAlumni ? <Pill tone="violet">Alumni</Pill> : null}
                {live.history?.theyReplied ? <Pill tone="green">Replied before</Pill> : null}
                <Pill tone="gray">{functionLabel(live.fn)}</Pill>
              </div>
            </div>

            {live.priorityReasons.length ? (
              <ul className="mt-3 space-y-0.5">
                {live.priorityReasons.slice(0, 3).map((r) => (
                  <li key={r} className="text-[12px] text-ink-2">• {r}</li>
                ))}
              </ul>
            ) : null}

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Message</span>
                <span className={cx("tabular text-[11.5px]", overLimit ? "font-medium text-[var(--t-red)]" : "text-muted")}>
                  {message.length} / {LINKEDIN_NOTE_LIMIT} for a connection note
                </span>
              </div>
              <Textarea value={message} onChange={(e) => setEdited(e.target.value)} rows={6} className="text-[13px] leading-relaxed" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" icon={copied ? Check : Copy} onClick={copy}>{copied ? "Copied" : "Copy message"}</Button>
              {live.url ? (
                <Button icon={ExternalLink} onClick={() => window.open(live.url, "_blank", "noopener,noreferrer")}>Open LinkedIn</Button>
              ) : null}
              <Button icon={Send} onClick={markSent}>Mark sent</Button>
              <Button icon={SkipForward} onClick={() => { setSkipped((n) => n + 1); next(); }}>Skip</Button>
              <Button variant="danger" icon={ThumbsDown} onClick={notAFit}>Not a fit</Button>
            </div>

            <p className="mt-3 text-[11.5px] text-muted">
              Shortcuts: <kbd className="rounded border border-line px-1">C</kbd> copy · <kbd className="rounded border border-line px-1">O</kbd> open ·{" "}
              <kbd className="rounded border border-line px-1">S</kbd> sent · <kbd className="rounded border border-line px-1">K</kbd> skip ·{" "}
              <kbd className="rounded border border-line px-1">N</kbd> not a fit
            </p>
          </Card>

          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted">
            <Users size={12} />
            Up next: {queue.slice(pos + 1, pos + 4).map((p) => p.name).join(", ") || "nobody — this is the last one"}
          </p>
        </div>
      </PageBody>
    </>
  );
}
