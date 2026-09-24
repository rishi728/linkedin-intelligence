"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Building2, Calendar, CheckCircle2, Mail, MessageSquarePlus, Pencil, RotateCcw, X } from "lucide-react";
import { domainLabel, functionLabel } from "@/lib/intelligence";
import { DOMAINS, INDUSTRIES } from "@/lib/roles";
import { SENIORITY_LEVELS } from "@/lib/taxonomy";
import { ROLE_CATALOG } from "@/lib/intelligence";
import { addDays, formatDate, relativeDue, todayISO } from "@/lib/workspace/dates";
import { CHANNELS, OPPORTUNITY_TYPES, RESPONSES } from "@/lib/workspace/defaults";
import type { Hierarchy } from "@/lib/intelligence";
import type { Person } from "@/lib/workspace/types";
import { useUI, useWorkspace } from "@/components/workspace/store";
import { Avatar, Button, Checkbox, Field, IconButton, Input, Meter, Pill, Select, Sheet, Textarea, cx } from "@/components/ui";
import { ConfidenceBadge, LinkedInLink, PRIORITY_LABEL, ResearchMenu } from "./common";
import { StatusMenu } from "./StatusMenu";

function Section({ title, children, action, className }: { title: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <section className={cx("border-t border-line px-5 py-4", className)}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-3 py-1">
      <span className="text-[12px] text-muted">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ClassificationEditor({ person, onDone }: { person: Person; onDone: () => void }) {
  const { setClassification, people } = useWorkspace();
  const { toast } = useUI();
  const [draft, setDraft] = useState<Hierarchy>({
    domain: person.domain, fn: person.fn, role: person.role, seniority: person.seniority, industry: person.industry,
  });
  const sameTitle = useMemo(
    () => (person.position ? people.filter((p) => p.position.toLowerCase() === person.position.toLowerCase()).length : 1),
    [people, person.position],
  );
  const [learn, setLearn] = useState(sameTitle > 1);
  const domain = DOMAINS.find((d) => d.id === draft.domain) ?? DOMAINS[0];
  const roleOptions = ROLE_CATALOG.filter((r) => r.fn === draft.fn).map((r) => r.role);

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Domain">
          <Select
            value={draft.domain}
            onChange={(e) => {
              const d = DOMAINS.find((x) => x.id === e.target.value)!;
              setDraft((v) => ({ ...v, domain: d.id, fn: d.functions[0].id, role: d.functions[0].generalist }));
            }}
          >
            {DOMAINS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Function">
          <Select value={draft.fn} onChange={(e) => setDraft((v) => ({ ...v, fn: e.target.value }))}>
            {domain.functions.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Role" hint="Pick a known role or type your own">
          <Input list="role-options" value={draft.role} onChange={(e) => setDraft((v) => ({ ...v, role: e.target.value }))} />
          <datalist id="role-options">
            {roleOptions.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </Field>
        <Field label="Seniority">
          <Select value={draft.seniority} onChange={(e) => setDraft((v) => ({ ...v, seniority: e.target.value as Person["seniority"] }))}>
            {SENIORITY_LEVELS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Industry" className="col-span-2">
          <Select value={draft.industry} onChange={(e) => setDraft((v) => ({ ...v, industry: e.target.value }))}>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </Select>
        </Field>
      </div>

      {sameTitle > 1 && person.position ? (
        <Checkbox
          checked={learn}
          onChange={setLearn}
          label={<span>Remember this for all <strong>{sameTitle}</strong> people titled “{person.position}”</span>}
        />
      ) : null}

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            const n = setClassification(person.id, draft, learn && sameTitle > 1 ? "exact" : null);
            toast(learn && sameTitle > 1 ? `Saved. Rule applied to ${n} people with this title.` : "Classification updated.");
            onDone();
          }}
        >
          Save
        </Button>
        <Button size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

export function PersonPanel() {
  const { byId, settings, people, updateRecord, setStatus, resetClassification } = useWorkspace();
  const { personId, openPerson, openComposer, toast, setPeopleFilters } = useUI();
  const [editing, setEditing] = useState(false);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState(false);
  const pathname = usePathname();
  const person = personId ? byId.get(personId) : null;

  // Close the inline classification editor when a different person is opened.
  if (personId !== openFor) {
    setOpenFor(personId);
    if (editing) setEditing(false);
  }

  if (!person) return null;
  const today = todayISO();
  const colleagues = person.companyKey ? people.filter((p) => p.companyKey === person.companyKey && p.id !== person.id).length : 0;
  const patch = (p: Parameters<typeof updateRecord>[1], activity?: Parameters<typeof updateRecord>[2]) => updateRecord(person.id, p, activity);

  // Same person, different question depending on where you opened them from: mid
  // conversation the history matters most, while researching you want the match.
  /**
   * One thread from two sources: messages LinkedIn exported, and drafts written
   * here. Drafts are labelled, so one is never mistaken for something sent.
   */
  const conversation = [
    ...(person.history?.messages ?? []).map((m) => ({
      at: m.at, kind: m.dir as "in" | "out", subject: m.subject, text: m.text, draft: false,
    })),
    ...person.messages.map((m) => ({
      at: m.at, kind: "out" as const, subject: "", text: m.text, draft: !m.sent,
    })),
  ].sort((a, b) => (a.at || "").localeCompare(b.at || ""));

  const relationshipFirst = pathname === "/outreach" || pathname === "/follow-ups" || pathname === "/session";

  return (
    <Sheet open onClose={() => openPerson(null)} width={580}>
      <header className="flex items-start gap-3 px-5 py-4">
        <Avatar name={person.name} size={40} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[16px] font-semibold tracking-tight">{person.name}</h2>
          <p className="truncate text-[12.5px] text-ink-2">{person.position || "No title shared"}</p>
          {person.company ? (
            <button
              type="button"
              onClick={() => {
                setPeopleFilters({ companies: [person.companyKey] });
                openPerson(null);
              }}
              className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-accent"
            >
              <Building2 size={12} />
              {person.company}
              {colleagues > 0 ? <span className="text-faint">· {colleagues} more here</span> : null}
            </button>
          ) : null}
        </div>
        <IconButton label="Close" icon={X} onClick={() => openPerson(null)} />
      </header>

      <div className="flex flex-wrap gap-2 px-5 pb-4">
        <LinkedInLink person={person} />
        {person.email ? (
          <Button size="sm" icon={Mail} onClick={() => window.open(`mailto:${person.email}`, "_blank")}>Email</Button>
        ) : null}
        <ResearchMenu person={person} align="left" />
        <Button size="sm" variant="primary" icon={MessageSquarePlus} onClick={() => openComposer(person.id)}>
          Create outreach
        </Button>
      </div>

      <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-auto">
        <Section title="Why this person">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Pill tone={person.priority === "high" ? "orange" : person.priority === "medium" ? "blue" : "gray"}>
              {PRIORITY_LABEL[person.priority]} priority{person.priorityManual ? " · set by you" : ""}
            </Pill>
            {person.isTarget ? <Pill tone="teal">Target company</Pill> : null}
            {person.isAlumni ? <Pill tone="violet">Alumni</Pill> : null}
            {person.isCampus ? <Pill tone="gray">Campus organisation</Pill> : null}
            {person.tags.map((t) => (
              <Pill key={t} tone="gray">{t}</Pill>
            ))}
          </div>
          <ul className="space-y-1">
            {(person.priorityReasons.length ? person.priorityReasons : ["No goals set yet. Add target areas or companies in Settings to rank people."]).map((r) => (
              <li key={r} className="flex gap-2 text-[12.5px] text-ink-2">
                <span className="text-faint">•</span>
                {r}
              </li>
            ))}
            {person.connectedOn ? (
              <li className="flex gap-2 text-[12.5px] text-ink-2">
                <span className="text-faint">•</span>
                Connected on {formatDate(person.connectedOn, true)}
              </li>
            ) : null}
          </ul>
        </Section>

        {conversation.length ? (
          <Section
            title="Conversation"
            className={relationshipFirst ? "order-first border-t-0" : undefined}
            action={
              conversation.length > 4 ? (
                <button type="button" onClick={() => setAllMessages((v) => !v)} className="text-[11.5px] text-muted transition hover:text-accent">
                  {allMessages ? "Show recent" : `Show all ${conversation.length}`}
                </button>
              ) : null
            }
          >
            <ol className="space-y-2.5">
              {(allMessages ? conversation : conversation.slice(-4)).map((m, i) => (
                <li key={`${m.at}-${i}`} className={cx("flex flex-col", m.kind === "out" ? "items-end" : "items-start")}>
                  <span className="mb-0.5 flex items-center gap-1.5 text-[11px] text-faint">
                    {m.kind === "out" ? "You" : person.firstName || person.name}
                    <span>· {m.at ? formatDate(m.at) : "date unknown"}</span>
                    {m.draft ? <Pill tone="gray">Draft</Pill> : null}
                  </span>
                  <span
                    className={cx(
                      "max-w-[88%] whitespace-pre-wrap rounded-xl px-3 py-2 text-[12.5px] leading-relaxed",
                      m.kind === "out" ? "bg-accent-soft text-ink" : "bg-subtle text-ink-2",
                    )}
                  >
                    {m.subject ? <span className="mb-0.5 block font-medium">{m.subject}</span> : null}
                    {m.text}
                  </span>
                </li>
              ))}
            </ol>
          </Section>
        ) : null}

        {person.history || person.pastCompanies.length ? (
          <Section title="Relationship" className={relationshipFirst ? "order-first border-t-0" : undefined}>
            <div className="space-y-1">
              {person.history?.messageCount ? (
                <>
                  <Row label="Messages">
                    {person.history.messageCount} exchanged
                    {person.history.lastMessageAt ? ` · last on ${formatDate(person.history.lastMessageAt)}` : ""}
                  </Row>
                  <Row label="Replies">
                    {person.history.theyReplied
                      ? <Pill tone="green">They have replied to you</Pill>
                      : <Pill tone="amber">No reply yet</Pill>}
                  </Row>
                </>
              ) : person.history ? (
                <Row label="Messages"><span className="text-muted">None in your archive</span></Row>
              ) : null}
              {person.history?.invited ? (
                <Row label="Invitation">
                  {person.history.invited === "them" ? "They invited you" : "You invited them"}
                  {person.history.invitedAt ? ` · ${formatDate(person.history.invitedAt)}` : ""}
                </Row>
              ) : null}
              {person.pastCompanies.length ? (
                <Row label="Previously">
                  <span className="flex flex-wrap gap-1">
                    {person.pastCompanies.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { setPeopleFilters({ pastCompanies: [c] }); openPerson(null); }}
                        className="rounded-md border border-line px-1.5 py-0.5 text-[11.5px] hover:border-accent hover:text-accent"
                      >
                        {c}
                      </button>
                    ))}
                  </span>
                </Row>
              ) : null}
            </div>
          </Section>
        ) : null}

        <Section
          title="Classification"
          action={
            editing ? null : (
              <div className="flex gap-1">
                {person.classSource !== "auto" ? (
                  <IconButton label="Reset to automatic" icon={RotateCcw} onClick={() => { resetClassification(person.id); toast("Back to the automatic classification."); }} />
                ) : null}
                <IconButton label="Edit classification" icon={Pencil} onClick={() => setEditing(true)} />
              </div>
            )
          }
        >
          {editing ? (
            <ClassificationEditor person={person} onDone={() => setEditing(false)} />
          ) : (
            <div className="space-y-1">
              <Row label="Domain">{domainLabel(person.domain)}</Row>
              <Row label="Function">{functionLabel(person.fn)}</Row>
              <Row label="Role">{person.role}</Row>
              <Row label="Seniority">{person.seniority}</Row>
              <Row label="Industry">
                {person.industry}
                {person.industryInferred ? <span className="ml-1 text-[11px] text-muted">(inferred from colleagues)</span> : null}
              </Row>
              <div className="mt-2 flex items-center gap-2">
                <ConfidenceBadge person={person} />
                {person.classSource === "auto" && person.domain !== "unclassified" ? (
                  <span className="flex-1">
                    <Meter value={person.confidence} tone={person.confidence >= 80 ? "green" : person.confidence >= 60 ? "blue" : "amber"} />
                  </span>
                ) : null}
              </div>
              {person.reasons.length ? <p className="mt-1.5 text-[11.5px] text-muted">Matched {person.reasons.join(" · ")}</p> : null}
            </div>
          )}
        </Section>

        <Section title="Outreach">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Status">
              <Select value={person.status} onChange={(e) => setStatus([person.id], e.target.value)}>
                {settings.statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select
                value={person.priorityManual ? person.priority : "auto"}
                onChange={(e) => patch({ priority: e.target.value === "auto" ? undefined : (e.target.value as Person["priority"]) }, { kind: "priority", text: `Priority set to ${e.target.value}` })}
              >
                <option value="auto">Automatic ({PRIORITY_LABEL[person.priority]})</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </Field>
            <Field label="Last contacted">
              <Input type="date" value={person.lastContactedAt} onChange={(e) => patch({ lastContactedAt: e.target.value })} />
            </Field>
            <Field label="Next follow-up" hint={person.followUpAt ? relativeDue(person.followUpAt, today) : undefined}>
              <Input type="date" value={person.followUpAt} onChange={(e) => patch({ followUpAt: e.target.value }, { kind: "followup", text: `Follow-up set for ${e.target.value}` })} />
            </Field>
            <Field label="Channel">
              <Select value={person.channel} onChange={(e) => patch({ channel: e.target.value })}>
                <option value="">-</option>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Response">
              <Select value={person.response} onChange={(e) => patch({ response: e.target.value })}>
                <option value="">-</option>
                {RESPONSES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </Field>
            <Field label="Opportunity type">
              <Select value={person.opportunityType} onChange={(e) => patch({ opportunityType: e.target.value })}>
                <option value="">-</option>
                {OPPORTUNITY_TYPES.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="Next action">
              <Input
                defaultValue={person.nextAction}
                placeholder="What happens next?"
                onBlur={(e) => e.target.value !== person.nextAction && patch({ nextAction: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[3, 7, 14].map((d) => (
              <Button key={d} size="sm" variant="subtle" icon={Calendar} onClick={() => patch({ followUpAt: addDays(today, d) }, { kind: "followup", text: `Follow-up in ${d} days` })}>
                +{d}d
              </Button>
            ))}
            <Button
              size="sm"
              variant="subtle"
              icon={CheckCircle2}
              onClick={() => patch({ lastContactedAt: today, followUpAt: "" }, { kind: "contacted", text: "Marked as contacted today" })}
            >
              Contacted today
            </Button>
          </div>
        </Section>

        <Section title="Personalization">
          <div className="space-y-2.5">
            {([
              ["why", "Why I'm contacting them"],
              ["common", "Common context"],
              ["ask", "My ask"],
              ["know", "What I know about them"],
              ["personal", "Personal notes"],
            ] as const).map(([key, label]) => (
              <Field key={key} label={label}>
                <Textarea
                  defaultValue={person.personalization[key]}
                  rows={2}
                  onBlur={(e) => e.target.value !== person.personalization[key] && patch((rec) => ({ personalization: { ...rec.personalization, [key]: e.target.value } }))}
                />
              </Field>
            ))}
          </div>
        </Section>

        <Section title="Notes">
          <Textarea
            defaultValue={person.notes}
            rows={3}
            placeholder="Anything worth remembering…"
            onBlur={(e) => e.target.value !== person.notes && patch({ notes: e.target.value }, { kind: "note", text: "Note updated" })}
          />
        </Section>

        <Section title="Details">
          <div className="space-y-1">
            <Row label="Email">{person.email || <span className="text-muted">Not shared in the export</span>}</Row>
            <Row label="LinkedIn">
              {person.url ? (
                <a href={person.url} target="_blank" rel="noopener noreferrer" className="truncate text-accent hover:underline">
                  {person.url.replace("https://www.linkedin.com/in/", "")}
                </a>
              ) : (
                <span className="text-muted">-</span>
              )}
            </Row>
            <Row label="Location">
              <Input
                defaultValue={person.location}
                placeholder="Not in LinkedIn's export. Add it yourself"
                onBlur={(e) => e.target.value !== person.location && patch({ location: e.target.value })}
              />
            </Row>
            <Row label="Connected">{person.connectedOn ? formatDate(person.connectedOn, true) : "-"}</Row>
            {person.duplicateOf ? <Row label="Duplicate">Same profile appears earlier in your export</Row> : null}
          </div>
        </Section>

        {person.activity.length ? (
          <Section title="Activity">
            <ul className="space-y-1.5">
              {[...person.activity].reverse().slice(0, 25).map((a, i) => (
                <li key={i} className="flex gap-2 text-[12px]">
                  <span className="tabular w-[76px] shrink-0 text-muted">{formatDate(new Date(a.at))}</span>
                  <span className="text-ink-2">{a.text}</span>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </div>

      <footer className={cx("flex items-center justify-between gap-2 border-t border-line px-5 py-3")}>
        <StatusMenu person={person} />
        <div className="flex gap-2">
          {person.status === "not_contacted" ? (
            <Button size="sm" onClick={() => { setStatus([person.id], "to_contact"); toast(`${person.name} added to outreach.`); }}>
              Add to outreach
            </Button>
          ) : null}
          <Button size="sm" variant="primary" onClick={() => openComposer(person.id)}>Write message</Button>
        </div>
      </footer>
    </Sheet>
  );
}
