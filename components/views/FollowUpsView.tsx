"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, CalendarPlus, CheckCircle2, ExternalLink, StickyNote } from "lucide-react";
import { addDays, formatDate, relativeDue, todayISO } from "@/lib/workspace/dates";
import { followUpBuckets } from "@/lib/workspace/insights";
import { downloadFollowUpCalendar } from "@/lib/workspace/calendar";
import type { DueBucket } from "@/lib/workspace/dates";
import type { Person } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { Avatar, Button, Card, EmptyState, Input, Menu, MenuItem, MenuLabel, Pill, cx } from "@/components/ui";
import { StatusMenu } from "@/components/people/StatusMenu";
import { useUI, useWorkspace } from "@/components/workspace/store";

const SECTIONS: Array<{ key: DueBucket; label: string; tone: string }> = [
  { key: "overdue", label: "Overdue", tone: "orange" },
  { key: "today", label: "Today", tone: "teal" },
  { key: "tomorrow", label: "Tomorrow", tone: "blue" },
  { key: "week", label: "This week", tone: "gray" },
  { key: "later", label: "Later", tone: "gray" },
];

export function FollowUpsView() {
  const { people, settings, updateRecord, setStatus, completeFollowUp } = useWorkspace();
  const { openPerson, openComposer, toast } = useUI();
  const router = useRouter();
  const today = todayISO();
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const buckets = useMemo(() => followUpBuckets(people, settings, today), [people, settings, today]);
  const total = Object.values(buckets).reduce((n, list) => n + list.length, 0);
  const due = buckets.overdue.length + buckets.today.length;

  const complete = (p: Person) => {
    const previous = { followUpAt: p.followUpAt, lastContactedAt: p.lastContactedAt, sequenceStep: p.sequenceStep };
    completeFollowUp(p.id);
    if (p.status === "to_contact") setStatus([p.id], "contacted");
    const nextStep = settings.cadence.enabled ? settings.cadence.steps[p.sequenceStep + 1] : undefined;
    toast(
      nextStep === undefined ? `${p.name}: follow-up done.` : `${p.name}: done — next nudge in ${nextStep} days.`,
      { label: "Undo", run: () => updateRecord(p.id, previous) },
    );
  };

  const snooze = (p: Person, days: number) => {
    updateRecord(p.id, { followUpAt: addDays(today, days) }, { kind: "followup", text: `Snoozed ${days} days` });
    toast(`${p.name} snoozed to ${formatDate(addDays(today, days))}.`);
  };

  return (
    <>
      <PageHeader
        title="Follow-ups"
        subtitle={total ? `${due} due now · ${total} scheduled` : "Nothing scheduled"}
        actions={
          <>
            <Button
              icon={CalendarPlus}
              disabled={!total}
              onClick={() => {
                downloadFollowUpCalendar(people, settings);
                toast("Calendar file downloaded — open it to add the reminders.");
              }}
            >
              Add to calendar
            </Button>
            <Button icon={CalendarClock} onClick={() => router.push("/outreach")}>Open pipeline</Button>
          </>
        }
      />
      <PageBody>
        {total === 0 ? (
          <EmptyState
            icon={Bell}
            title="No follow-ups scheduled"
            body="When you mark someone as contacted, a reminder is scheduled automatically. You can also set a date on any profile."
            action={<Button variant="primary" onClick={() => router.push("/people")}>Go to people</Button>}
          />
        ) : (
          <div className="space-y-4">
            {SECTIONS.map(({ key, label, tone }) => {
              const list = buckets[key];
              if (!list.length) return null;
              return (
                <Card key={key}>
                  <div className="flex items-center gap-2 px-4 pt-3.5">
                    <span className={cx("size-2 rounded-full", `dot-${tone}`)} />
                    <h3 className="text-[13.5px] font-semibold tracking-tight">{label}</h3>
                    <span className="tabular text-[12px] text-muted">{list.length}</span>
                  </div>
                  <div className="p-2">
                    {list.map((p) => (
                      <div key={p.id} className="rounded-lg px-2 py-2 transition hover:bg-hover">
                        <div className="flex flex-wrap items-center gap-3">
                          <button type="button" onClick={() => openPerson(p.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                            <Avatar name={p.name} size={30} />
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-medium">{p.name}</span>
                              <span className="block truncate text-[12px] text-muted">
                                {p.role}{p.company ? ` · ${p.company}` : ""}
                                {p.lastContactedAt ? ` · last contacted ${formatDate(p.lastContactedAt)}` : ""}
                              </span>
                            </span>
                          </button>
                          <Pill tone={key === "overdue" ? "orange" : key === "today" ? "teal" : "gray"}>{relativeDue(p.followUpAt, today)}</Pill>
                          <StatusMenu person={p} size="sm" />
                          <div className="flex items-center gap-1.5">
                            <Button size="sm" icon={CheckCircle2} onClick={() => complete(p)}>Done</Button>
                            <Menu
                              width={180}
                              align="right"
                              trigger={({ toggle }) => <Button size="sm" onClick={toggle}>Snooze</Button>}
                            >
                              {(close) => (
                                <>
                                  <MenuLabel>Remind me in</MenuLabel>
                                  {[1, 3, 7, 14, 30].map((d) => (
                                    <MenuItem key={d} onClick={() => { snooze(p, d); close(); }}>{d} day{d > 1 ? "s" : ""}</MenuItem>
                                  ))}
                                </>
                              )}
                            </Menu>
                            <Input
                              type="date"
                              value={p.followUpAt}
                              onChange={(e) => updateRecord(p.id, { followUpAt: e.target.value }, { kind: "followup", text: `Rescheduled to ${e.target.value}` })}
                              className="h-7 w-[132px] text-[12px]"
                            />
                            <Button size="sm" icon={StickyNote} onClick={() => { setNoteFor(noteFor === p.id ? null : p.id); setNoteText(p.notes); }}>Note</Button>
                            <Button size="sm" onClick={() => openComposer(p.id)}>Message</Button>
                            {p.url ? (
                              <Button size="sm" variant="ghost" icon={ExternalLink} onClick={() => window.open(p.url, "_blank", "noopener,noreferrer")}>
                                LinkedIn
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        {noteFor === p.id ? (
                          <div className="mt-2 flex items-center gap-2 pl-[42px]">
                            <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note…" autoFocus />
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                updateRecord(p.id, { notes: noteText }, { kind: "note", text: "Note updated" });
                                setNoteFor(null);
                                toast("Note saved.");
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageBody>
    </>
  );
}
