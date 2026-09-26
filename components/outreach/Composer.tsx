"use client";

import { useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, Mail, RotateCcw, Save, Send } from "lucide-react";
import { CHANNELS } from "@/lib/workspace/defaults";
import { DRAFT_TOOLS, INTENT_MAP, OUTREACH_INTENTS, type OutreachIntentId } from "@/lib/workspace/intents";
import { LINKEDIN_NOTE_LIMIT, renderTemplate, templateVars } from "@/lib/workspace/outreach";
import { Avatar, Button, Dialog, Field, Input, Select, Textarea, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

export function Composer() {
  const { byId, settings, updateRecord, setStatus, updateSettings } = useWorkspace();
  const { composerFor, openComposer, toast } = useUI();
  const person = composerFor ? byId.get(composerFor) : null;

  const [intentId, setIntentId] = useState<OutreachIntentId | null>(null);
  const [channel, setChannel] = useState("LinkedIn");
  const [vars, setVars] = useState({ my_background: "" });
  /** null until the user edits the draft by hand; their edits are never overwritten. */
  const [edited, setEdited] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [personKey, setPersonKey] = useState<string | null>(null);

  // Start again at the choice whenever a different person is opened.
  if (person && personKey !== person.id) {
    setPersonKey(person.id);
    setIntentId(null);
    setVars({ my_background: settings.profile.background });
    setEdited(null);
    setCopied(false);
  }

  if (!person) return null;

  const intent = intentId ? INTENT_MAP[intentId] : null;
  const preset = intent ? renderTemplate(intent.body, templateVars(person, settings, vars)) : "";
  const message = edited ?? preset;
  const overLimit = channel === "LinkedIn" && message.length > LINKEDIN_NOTE_LIMIT;

  /** Keep the draft, and log it once so the profile shows what was written. */
  const persist = (sent = false) => {
    updateRecord(person.id, (rec) => {
      const log = rec.messages ?? [];
      const last = log[log.length - 1];
      const same = last && last.text.trim() === message.trim();
      return {
        draft: message,
        channel,
        messages: same
          ? log.map((m, i) => (i === log.length - 1 ? { ...m, sent: m.sent || sent } : m))
          : [...log, { at: new Date().toISOString(), text: message, channel, intent: intent?.id, sent }],
      };
    });
  };

  const subtitle = `${person.position || "No title shared"}${person.company ? ` · ${person.company}` : ""}`;

  // ---- step one: why -------------------------------------------------------
  if (!intent) {
    return (
      <Dialog open onClose={() => openComposer(null)} title={`Message ${person.name}`} subtitle={subtitle} width={720}>
        <p className="text-[15px] font-semibold tracking-tight">Why are you reaching out?</p>
        <div className="mt-3 grid gap-2">
          {OUTREACH_INTENTS.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => { setIntentId(i.id); setEdited(null); }}
              className="group rounded-xl border border-line bg-panel px-4 py-3 text-left transition hover:-translate-y-px hover:border-accent/60 hover:shadow-pop focus-visible:border-accent"
            >
              <span className="block text-[14px] font-medium transition group-hover:text-accent">{i.label}</span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">{i.description}</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-[11.5px] text-muted">
          Nothing is ever sent for you. You pick the words, copy them, and send them yourself.
        </p>
      </Dialog>
    );
  }

  // ---- step two: the draft -------------------------------------------------
  return (
    <Dialog
      open
      onClose={() => openComposer(null)}
      title={`Message ${person.name}`}
      subtitle={subtitle}
      width={820}
      footer={
        <>
          <Button icon={Save} onClick={() => { persist(); toast("Draft saved to their profile."); }}>Save draft</Button>
          {person.email ? (
            <Button
              icon={Mail}
              onClick={() => {
                persist();
                window.open(
                  `mailto:${person.email}?subject=${encodeURIComponent(`${intent.purpose} from ${settings.profile.name || "hello"}`)}&body=${encodeURIComponent(message)}`,
                  "_blank",
                );
              }}
            >
              Open email draft
            </Button>
          ) : null}
          {person.url ? (
            <Button icon={ExternalLink} onClick={() => window.open(person.url, "_blank", "noopener,noreferrer")}>Open LinkedIn</Button>
          ) : null}
          <Button
            variant="primary"
            icon={copied ? Check : Copy}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(message);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              } catch {
                toast("Couldn't copy. Select the text and copy it manually.");
              }
              persist();
            }}
          >
            {copied ? "Copied" : "Copy message"}
          </Button>
          <Button
            icon={Send}
            onClick={() => {
              persist(person.status !== "not_contacted");
              setStatus([person.id], person.status === "not_contacted" ? "to_contact" : "contacted");
              toast(person.status === "not_contacted" ? "Added to outreach as “To contact”." : "Marked as contacted.");
              openComposer(null);
            }}
          >
            {person.status === "not_contacted" ? "Add to outreach" : "Mark as contacted"}
          </Button>
        </>
      }
    >
      <div className="anim-fade grid gap-5 md:grid-cols-[240px_minmax(0,1fr)]">
        {/* who, and why */}
        <div>
          <div className="flex items-start gap-2.5">
            <Avatar name={person.name} size={36} />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold tracking-tight">{person.name}</p>
              <p className="truncate text-[12px] text-muted">{person.roleLabel}</p>
              {person.company ? <p className="truncate text-[12px] text-faint">{person.company}</p> : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setIntentId(null); setEdited(null); }}
            className="mt-4 flex w-full items-center gap-1.5 rounded-lg border border-line px-2.5 py-2 text-left text-[12.5px] transition hover:border-line-strong"
          >
            <ArrowLeft size={13} className="shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate font-medium">{intent.label}</span>
          </button>

          <div className="mt-2.5 space-y-2.5">
            <Field label="Channel">
              <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="About you" hint="Saved for next time">
              <Input
                value={vars.my_background}
                onChange={(e) => { setVars({ my_background: e.target.value }); setEdited(null); }}
                onBlur={(e) =>
                  e.target.value !== settings.profile.background &&
                  updateSettings((s) => ({ ...s, profile: { ...s.profile, background: e.target.value } }))
                }
                placeholder="a final-year student at…"
              />
            </Field>
          </div>
        </div>

        {/* the draft */}
        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">Message</span>
            <span className={cx("tabular text-[11.5px]", overLimit ? "font-medium text-[var(--t-red)]" : "text-faint")}>
              {message.length}{channel === "LinkedIn" ? ` / ${LINKEDIN_NOTE_LIMIT}` : ""}
            </span>
          </div>
          <Textarea
            value={message}
            onChange={(e) => setEdited(e.target.value)}
            className="min-h-[300px] flex-1 font-[inherit] text-[13px] leading-relaxed"
          />

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {DRAFT_TOOLS.map((t) => (
              <Button key={t.id} size="sm" variant="ghost" onClick={() => setEdited(t.apply(message))}>
                {t.label}
              </Button>
            ))}
            {edited !== null ? (
              <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setEdited(null)}>
                Back to the preset
              </Button>
            ) : null}
          </div>

          <p className="mt-2 text-[11.5px] text-muted">
            Anything in <span className="rounded bg-subtle px-1">[brackets]</span> is a blank we could not fill from their
            profile. Edit it or delete the sentence.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
