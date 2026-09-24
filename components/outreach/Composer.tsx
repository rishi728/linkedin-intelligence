"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Mail, Save, Send } from "lucide-react";
import { CHANNELS, PURPOSES } from "@/lib/workspace/defaults";
import { LINKEDIN_NOTE_LIMIT, renderTemplate, templateVars } from "@/lib/workspace/outreach";
import { Button, Dialog, Field, Input, Select, Textarea, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

export function Composer() {
  const { byId, settings, updateRecord, setStatus, updateSettings } = useWorkspace();
  const { composerFor, openComposer, toast } = useUI();
  const person = composerFor ? byId.get(composerFor) : null;

  const [purpose, setPurpose] = useState("Referral");
  const [channel, setChannel] = useState("LinkedIn");
  const [templateId, setTemplateId] = useState("");
  const [vars, setVars] = useState({ reason: "", ask: "", common_context: "", my_background: "" });
  /** null until the user edits the generated message by hand. */
  const [edited, setEdited] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [personKey, setPersonKey] = useState<string | null>(null);

  const templates = useMemo(
    () => settings.templates.filter((t) => t.purpose === purpose || t.channel === channel).concat(settings.templates.filter((t) => t.purpose !== purpose && t.channel !== channel)),
    [settings.templates, purpose, channel],
  );

  // Re-seed the form whenever a different person is opened.
  if (person && personKey !== person.id) {
    setPersonKey(person.id);
    setPurpose(person.opportunityType === "Internship" ? "Internship" : "Referral");
    setVars({
      reason: person.personalization.why,
      ask: person.personalization.ask,
      common_context: person.personalization.common,
      my_background: settings.profile.background,
    });
    setEdited(null);
    setCopied(false);
  }

  const template = useMemo(
    () => settings.templates.find((t) => t.id === templateId) ?? templates.find((t) => t.purpose === purpose) ?? templates[0],
    [settings.templates, templateId, templates, purpose],
  );

  if (!person) return null;

  const message = edited ?? (template ? renderTemplate(template.body, templateVars(person, settings, vars)) : "");
  const overLimit = channel === "LinkedIn" && message.length > LINKEDIN_NOTE_LIMIT;

  const persist = () => {
    updateRecord(person.id, (rec) => ({
      draft: message,
      channel,
      personalization: { ...rec.personalization, why: vars.reason, ask: vars.ask, common: vars.common_context },
    }));
  };

  return (
    <Dialog
      open
      onClose={() => openComposer(null)}
      title={`Message ${person.name}`}
      subtitle={`${person.position || "No title shared"}${person.company ? ` · ${person.company}` : ""} — NetLens never sends anything; you copy and send it yourself.`}
      width={860}
      footer={
        <>
          <Button
            icon={Save}
            onClick={() => {
              persist();
              toast("Draft saved to their profile.");
            }}
          >
            Save draft
          </Button>
          {person.email ? (
            <Button
              icon={Mail}
              onClick={() => {
                persist();
                window.open(`mailto:${person.email}?subject=${encodeURIComponent(`${purpose} — ${settings.profile.name || "hello"}`)}&body=${encodeURIComponent(message)}`, "_blank");
              }}
            >
              Open email draft
            </Button>
          ) : null}
          {person.url ? (
            <Button icon={ExternalLink} onClick={() => window.open(person.url, "_blank", "noopener,noreferrer")}>
              Open LinkedIn
            </Button>
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
                toast("Couldn't copy — select the text and copy manually.");
              }
              persist();
            }}
          >
            {copied ? "Copied" : "Copy message"}
          </Button>
          <Button
            icon={Send}
            onClick={() => {
              persist();
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
      <div className="grid gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-2.5">
          <Field label="Purpose">
            <Select value={purpose} onChange={(e) => { setPurpose(e.target.value); setTemplateId(""); setEdited(null); }}>
              {PURPOSES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Channel">
            <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Template">
            <Select value={template?.id ?? ""} onChange={(e) => { setTemplateId(e.target.value); setEdited(null); }}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} · {t.channel}</option>
              ))}
            </Select>
          </Field>
          <Field label="Why you're reaching out">
            <Textarea rows={2} value={vars.reason} onChange={(e) => { setVars({ ...vars, reason: e.target.value }); setEdited(null); }} placeholder="I saw your work on…" />
          </Field>
          <Field label="Your ask">
            <Textarea rows={2} value={vars.ask} onChange={(e) => { setVars({ ...vars, ask: e.target.value }); setEdited(null); }} placeholder="a referral for the SDE intern role" />
          </Field>
          <Field label="Common context">
            <Textarea rows={2} value={vars.common_context} onChange={(e) => { setVars({ ...vars, common_context: e.target.value }); setEdited(null); }} placeholder="We were both at NIT Warangal" />
          </Field>
          <Field label="About you" hint="Saved to your profile for next time">
            <Input
              value={vars.my_background}
              onChange={(e) => { setVars({ ...vars, my_background: e.target.value }); setEdited(null); }}
              onBlur={(e) => e.target.value !== settings.profile.background && updateSettings((s) => ({ ...s, profile: { ...s.profile, background: e.target.value } }))}
              placeholder="a final-year student at…"
            />
          </Field>
        </div>

        <div className="flex flex-col">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Message</span>
            <span className={cx("tabular text-[11.5px]", overLimit ? "font-medium text-[var(--t-red)]" : "text-muted")}>
              {message.length}{channel === "LinkedIn" ? ` / ${LINKEDIN_NOTE_LIMIT} for a connection note` : ""}
            </span>
          </div>
          <Textarea
            value={message}
            onChange={(e) => setEdited(e.target.value)}
            className="min-h-[320px] flex-1 font-[inherit] text-[13px] leading-relaxed"
          />
          <p className="mt-2 text-[11.5px] text-muted">
            Placeholders like <span className="rounded bg-subtle px-1">[ask]</span> mean a field is still empty — fill it in on the left or edit the text directly.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
