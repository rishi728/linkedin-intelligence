"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Download, ExternalLink, MoreHorizontal, Search, Send, UserPlus } from "lucide-react";
import { todayISO } from "@/lib/workspace/dates";
import type { Person } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { StatusMenu } from "@/components/people/StatusMenu";
import { Avatar, Button, EmptyState, Input, Menu, MenuItem, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

/**
 * The people you picked, as a plain editable table, the same shape you'd keep in
 * a spreadsheet, except the status is a real dropdown and nothing has to be saved.
 */
export function OutreachView() {
  const { people, settings, updateRecord } = useWorkspace();
  const { openPerson, openExport, openComposer } = useUI();
  const router = useRouter();
  const [q, setQ] = useState("");
  const today = todayISO();

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const order = new Map(settings.statuses.map((s, i) => [s.id, i]));
    return people
      .filter((p) => p.status !== "not_contacted" && (!term || p.haystack.includes(term)))
      .sort(
        (a, b) =>
          (a.followUpAt || "9999").localeCompare(b.followUpAt || "9999") ||
          (order.get(a.status) ?? 99) - (order.get(b.status) ?? 99) ||
          a.name.localeCompare(b.name),
      );
  }, [people, settings.statuses, q]);

  const due = rows.filter((p) => p.followUpAt && p.followUpAt <= today).length;

  return (
    <>
      <PageHeader
        title="Your outreach"
        subtitle={
          rows.length
            ? `${rows.length.toLocaleString()} ${rows.length === 1 ? "conversation" : "conversations"}${due ? ` · ${due} waiting on you today` : ""}`
            : "Nobody added yet"
        }
        actions={
          <>
            <div className="relative w-52">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find someone" className="pl-8" />
            </div>
            <Button variant="primary" icon={Send} onClick={() => router.push("/session")}>
              Start a session
            </Button>
            <Menu
              width={200}
              align="right"
              trigger={({ toggle }) => (
                <button
                  type="button"
                  aria-label="More outreach actions"
                  onClick={toggle}
                  className="grid size-8 place-items-center rounded-lg border border-line text-muted transition hover:border-line-strong hover:text-ink"
                >
                  <MoreHorizontal size={15} />
                </button>
              )}
            >
              {(close) => (
                <>
                  <MenuItem icon={Bell} onClick={() => { router.push("/follow-ups"); close(); }}>
                    Follow-ups{due ? ` · ${due}` : ""}
                  </MenuItem>
                  <MenuItem
                    icon={Download}
                    onClick={() => { openExport({ filters: {}, ids: rows.map((p) => p.id), title: "My outreach" }); close(); }}
                  >
                    Export to Excel
                  </MenuItem>
                </>
              )}
            </Menu>
          </>
        }
      />

      {rows.length === 0 ? (
        <PageBody className="p-6">
          <EmptyState
            title="Nobody here yet"
            body="Pick people on the People page and choose “Add to outreach”. They show up here, and you change their status right in the table."
            action={<Button variant="primary" icon={UserPlus} onClick={() => (router.push("/find"))}>Find people</Button>}
          />
        </PageBody>
      ) : (
        <PageBody>
          <div className="min-w-[860px]">
            <div className="sticky top-0 z-10 grid grid-cols-[minmax(190px,1.6fr)_minmax(130px,1fr)_170px_minmax(170px,1.2fr)_130px_34px] items-center gap-3 border-b border-line bg-canvas px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted">
              <span>Person</span>
              <span>Company</span>
              <span>Status</span>
              <span>What&apos;s next</span>
              <span>Follow up on</span>
              <span />
            </div>
            {rows.map((p) => (
              <Row key={p.id} person={p} today={today} onOpen={openPerson} onWrite={openComposer} onEdit={updateRecord} />
            ))}
          </div>
        </PageBody>
      )}
    </>
  );
}

function Row({
  person, today, onOpen, onWrite, onEdit,
}: {
  person: Person;
  today: string;
  onOpen: (id: string) => void;
  onWrite: (id: string) => void;
  onEdit: (id: string, patch: { nextAction?: string; followUpAt?: string }) => void;
}) {
  const overdue = !!person.followUpAt && person.followUpAt < today;
  const dueToday = person.followUpAt === today;

  return (
    <div className="grid grid-cols-[minmax(190px,1.6fr)_minmax(130px,1fr)_170px_minmax(170px,1.2fr)_130px_34px] items-center gap-3 border-b border-line/60 px-4 py-1.5 transition hover:bg-hover">
      <button type="button" onClick={() => onOpen(person.id)} className="flex min-w-0 items-center gap-2.5 text-left">
        <Avatar name={person.name} size={26} />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium">{person.name}</span>
          <span className="block truncate text-[12px] text-muted">{person.role}</span>
        </span>
      </button>

      <span className="truncate text-[12.5px] text-ink-2" title={person.company}>
        {person.company || "-"}
      </span>

      <span className="min-w-0"><StatusMenu person={person} /></span>

      <input
        value={person.nextAction}
        onChange={(e) => onEdit(person.id, { nextAction: e.target.value })}
        placeholder="Add a note…"
        className="w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[12.5px] outline-none transition placeholder:text-faint hover:border-line focus:border-accent focus:bg-panel"
      />

      <input
        type="date"
        value={person.followUpAt}
        onChange={(e) => onEdit(person.id, { followUpAt: e.target.value })}
        className={cx(
          "w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[12.5px] outline-none transition hover:border-line focus:border-accent focus:bg-panel",
          overdue && "text-[var(--t-orange)]",
          dueToday && "text-[var(--t-teal)]",
        )}
      />

      <span className="flex items-center gap-1">
        {person.url ? (
          <a
            href={person.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open on LinkedIn"
            className="text-muted transition hover:text-accent"
          >
            <ExternalLink size={13} />
          </a>
        ) : (
          <button type="button" title="Write a message" onClick={() => onWrite(person.id)} className="text-muted transition hover:text-accent">
            <ExternalLink size={13} />
          </button>
        )}
      </span>
    </div>
  );
}
