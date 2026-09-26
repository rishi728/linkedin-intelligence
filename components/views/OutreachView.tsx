"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, Inbox, Plus, Search, Send, Trash2, UserPlus } from "lucide-react";
import { daysBetween, todayISO } from "@/lib/workspace/dates";
import type { Person, PersonList } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { StatusMenu } from "@/components/people/StatusMenu";
import { Avatar, Button, EmptyState, Input, cx } from "@/components/ui";
import { NewList } from "@/components/outreach/NewList";
import { useUI, useWorkspace } from "@/components/workspace/store";

const COLS = "grid-cols-[minmax(190px,1.6fr)_minmax(130px,1fr)_180px_minmax(150px,0.9fr)_70px]";

/**
 * Lists on the left, the people in the open list on the right.
 *
 * A list is only a grouping the user made, never another status: status and the
 * follow-up date on the row stay the single account of where a conversation is.
 */
export function OutreachView() {
  const { people, settings, updateRecord, createList, deleteList, removeFromList } = useWorkspace();
  const { openPerson, openExport } = useUI();
  const router = useRouter();
  const [listId, setListId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const today = todayISO();

  const lists = settings.lists;
  const open = listId ? lists.find((l) => l.id === listId) ?? null : null;

  const inPipeline = useMemo(() => people.filter((p) => p.status !== "not_contacted"), [people]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const order = new Map(settings.statuses.map((s, i) => [s.id, i]));
    const base = open ? people.filter((p) => open.memberIds.includes(p.id)) : inPipeline;
    return base
      .filter((p) => !term || p.haystack.includes(term))
      .sort(
        (a, b) =>
          (a.followUpAt || "9999").localeCompare(b.followUpAt || "9999") ||
          (order.get(a.status) ?? 99) - (order.get(b.status) ?? 99) ||
          a.name.localeCompare(b.name),
      );
  }, [people, inPipeline, open, settings.statuses, q]);

  const due = rows.filter((p) => p.followUpAt && p.followUpAt <= today).length;

  return (
    <>
      <PageHeader
        title={open ? open.name : "Your outreach"}
        subtitle={
          open
            ? open.description || `${open.memberIds.length} ${open.memberIds.length === 1 ? "person" : "people"}`
            : rows.length
              ? `${rows.length.toLocaleString()} ${rows.length === 1 ? "conversation" : "conversations"}${due ? ` · ${due} waiting on you today` : ""}`
              : "Nobody added yet"
        }
        actions={
          <>
            <div className="relative w-52">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find someone" className="pl-8" />
            </div>
            <Button variant="primary" icon={Send} onClick={() => router.push("/session")}>Start a session</Button>
            <Button
              icon={Download}
              onClick={() => openExport({ filters: {}, ids: rows.map((p) => p.id), title: open?.name ?? "My outreach" })}
            >
              Export
            </Button>
          </>
        }
      />

      <PageBody>
        <div className="flex min-h-full">
          {/* ---- the lists the user made ---------------------------------- */}
          <aside className="w-[210px] shrink-0 border-r border-line p-2">
            <button
              type="button"
              onClick={() => setListId(null)}
              className={cx(
                "mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] transition duration-200",
                !open ? "bg-accent-soft/60 font-medium text-ink" : "text-ink-2 hover:bg-hover hover:text-ink",
              )}
            >
              <Inbox size={13} className={!open ? "text-accent" : "text-muted"} />
              <span className="flex-1 truncate">All conversations</span>
              <span className="tabular text-[11.5px] text-muted">{inPipeline.length.toLocaleString()}</span>
            </button>

            {lists.map((l) => (
              <ListButton key={l.id} list={l} active={open?.id === l.id} onOpen={() => setListId(l.id)} />
            ))}

            <button
              type="button"
              onClick={() => setCreating(true)}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] text-muted transition duration-200 hover:bg-hover hover:text-ink"
            >
              <Plus size={13} />
              New list
            </button>
          </aside>

          {/* ---- the people in it ----------------------------------------- */}
          <div className="min-w-0 flex-1">
            {rows.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title={open ? "This list is empty" : "Nobody here yet"}
                  body={
                    open
                      ? "Pick people on the People page and choose “Add to list”."
                      : "Pick people on the People page and give them a status. They show up here, and you change their status right in the table."
                  }
                  action={
                    <span className="flex gap-2">
                      <Button variant="primary" icon={UserPlus} onClick={() => router.push("/find")}>Find people</Button>
                      {open ? (
                        <Button
                          icon={Trash2}
                          onClick={() => {
                            if (!window.confirm(`Delete the list “${open.name}”? The people in it are not affected.`)) return;
                            deleteList(open.id);
                            setListId(null);
                          }}
                        >
                          Delete list
                        </Button>
                      ) : null}
                    </span>
                  }
                />
              </div>
            ) : (
              <div className="min-w-[780px]">
                <div className={cx("sticky top-0 z-10 grid items-center gap-3 border-b border-line bg-canvas px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted", COLS)}>
                  <span>Person</span>
                  <span>Company</span>
                  <span>Status</span>
                  <span>Follow-up on</span>
                  <span>LinkedIn</span>
                </div>
                {rows.map((p) => (
                  <Row
                    key={p.id}
                    person={p}
                    today={today}
                    onOpen={openPerson}
                    onEdit={updateRecord}
                    onRemove={open ? () => removeFromList(open.id, [p.id]) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </PageBody>

      <NewList
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(name, description) => setListId(createList(name, description))}
      />
    </>
  );
}

function ListButton({ list, active, onOpen }: { list: PersonList; active: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      title={list.description || undefined}
      className={cx(
        "mb-0.5 block w-full rounded-lg px-2 py-1.5 text-left transition duration-200",
        active ? "bg-accent-soft/60 text-ink" : "text-ink-2 hover:bg-hover hover:text-ink",
      )}
    >
      <span className="flex items-center gap-2">
        <span className={cx("flex-1 truncate text-[12.5px]", active && "font-medium")}>{list.name}</span>
        <span className="tabular text-[11.5px] text-muted">{list.memberIds.length}</span>
      </span>
      {list.description ? (
        <span className="mt-0.5 block truncate text-[11px] text-muted">{list.description}</span>
      ) : null}
    </button>
  );
}

function Row({
  person, today, onOpen, onEdit, onRemove,
}: {
  person: Person;
  today: string;
  onOpen: (id: string) => void;
  onEdit: (id: string, patch: { followUpAt?: string }) => void;
  onRemove?: () => void;
}) {
  const overdue = !!person.followUpAt && person.followUpAt < today;
  const dueToday = person.followUpAt === today;
  const late = overdue ? -daysBetween(today, person.followUpAt) : 0;

  return (
    <div
      className={cx(
        "group grid items-center gap-3 border-b px-4 py-1.5 transition duration-200",
        COLS,
        overdue ? "border-[var(--t-red)]/25 bg-[var(--t-red)]/[0.045]" : "border-line/60 hover:bg-hover",
      )}
    >
      <button type="button" onClick={() => onOpen(person.id)} className="flex min-w-0 items-center gap-2.5 text-left">
        <Avatar name={person.name} size={26} />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium">{person.name}</span>
          <span className="block truncate text-[12px] text-muted">{person.roleLabel}</span>
        </span>
      </button>

      <span className="truncate text-[12.5px] text-ink-2" title={person.company}>{person.company || "-"}</span>

      <span className="min-w-0"><StatusMenu person={person} /></span>

      <span className="min-w-0">
        <input
          type="date"
          aria-label={`Follow up with ${person.name} on`}
          value={person.followUpAt}
          onChange={(e) => onEdit(person.id, { followUpAt: e.target.value })}
          className={cx(
            "w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[12.5px] outline-none transition duration-200 hover:border-line focus:border-accent focus:bg-panel",
            overdue && "font-medium text-[var(--t-red)]",
            dueToday && "text-[var(--t-teal)]",
          )}
        />
        {overdue ? (
          <span className="block px-1.5 text-[11px] text-[var(--t-red)]">
            {late} {late === 1 ? "day" : "days"} overdue
          </span>
        ) : null}
      </span>

      <span className="flex items-center gap-2">
        {person.url ? (
          <a
            href={person.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-muted transition duration-200 hover:text-accent"
          >
            <span className="flex items-center gap-1">Open <ExternalLink size={11} /></span>
          </a>
        ) : (
          <span className="text-[12px] text-faint">-</span>
        )}
        {onRemove ? (
          <button
            type="button"
            aria-label={`Remove ${person.name} from this list`}
            onClick={onRemove}
            className="text-faint opacity-0 transition duration-200 hover:text-[var(--t-red)] group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        ) : null}
      </span>
    </div>
  );
}

