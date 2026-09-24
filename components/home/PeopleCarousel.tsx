"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import type { Person } from "@/lib/workspace/types";
import { Avatar, Button, Pill, cx } from "@/components/ui";

/**
 * The person in focus is large; their neighbours sit alongside, dimmed and narrow,
 * so it is obvious there are more and which way they run. Everything shown is from
 * the person's own record — the reason line is the priority rule that fired.
 */
export function PeopleCarousel({
  people,
  onOpen,
  onStart,
}: {
  people: Person[];
  onOpen: (id: string) => void;
  onStart: (id: string) => void;
}) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  if (!people.length) return null;

  const at = (n: number) => people[((n % people.length) + people.length) % people.length];
  const move = (d: 1 | -1) => {
    setDir(d === 1 ? "next" : "prev");
    setI((v) => v + d);
  };
  const person = at(i);

  return (
    <div className="flex items-stretch gap-3">
      <button
        type="button"
        aria-label="Previous person"
        onClick={() => move(-1)}
        className="grid w-8 shrink-0 place-items-center rounded-xl text-faint transition hover:bg-hover hover:text-ink"
      >
        <ChevronLeft size={18} />
      </button>

      {/* focus */}
      <article
        key={person.id}
        className={cx(
          "min-w-0 flex-1 rounded-2xl border border-line bg-panel p-5",
          dir === "next" ? "anim-next" : "anim-prev",
        )}
      >
        <div className="flex items-start gap-4">
          <button type="button" onClick={() => onOpen(person.id)} className="shrink-0 transition hover:scale-[1.04]">
            <Avatar name={person.name} size={52} />
          </button>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onOpen(person.id)}
              className="block max-w-full truncate text-[18px] font-semibold tracking-tight transition hover:text-accent"
            >
              {person.name}
            </button>
            <p className="truncate text-[13px] text-ink-2">{person.role}</p>
            {person.company ? <p className="truncate text-[12.5px] text-muted">{person.company}</p> : null}
            {(person.isTarget || person.isAlumni || person.history?.theyReplied) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {person.isTarget ? <Pill tone="teal">Target company</Pill> : null}
                {person.isAlumni ? <Pill tone="violet">Alumni</Pill> : null}
                {person.history?.theyReplied ? <Pill tone="green">Replied before</Pill> : null}
              </div>
            )}
          </div>
        </div>

        {person.priorityReasons.length ? (
          <p className="mt-4 max-w-[54ch] border-t border-line pt-3 text-[13px] leading-relaxed text-ink-2">
            {person.priorityReasons[0]}
            {person.priorityReasons[1] ? <span className="text-muted"> · {person.priorityReasons[1]}</span> : null}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          <Button variant="primary" icon={Send} onClick={() => onStart(person.id)}>Start a conversation</Button>
          <Button variant="ghost" onClick={() => onOpen(person.id)}>See profile</Button>
          <span className="tabular ml-auto text-[11.5px] text-faint">
            {(((i % people.length) + people.length) % people.length) + 1} of {people.length}
          </span>
        </div>
      </article>

      {/* the next two, just visible enough to show there is more */}
      <div className="hidden w-[150px] shrink-0 flex-col gap-2 lg:flex">
        {[1, 2].map((offset) => {
          const p = at(i + offset);
          return (
            <button
              key={`${p.id}-${offset}`}
              type="button"
              onClick={() => move(1)}
              className={cx(
                "min-w-0 flex-1 rounded-xl border border-line bg-panel/60 p-2.5 text-left transition hover:border-line-strong hover:bg-panel",
                offset === 2 && "opacity-55",
              )}
            >
              <Avatar name={p.name} size={22} />
              <span className="mt-1.5 block truncate text-[12px] font-medium">{p.name}</span>
              <span className="block truncate text-[11px] text-muted">{p.role}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Next person"
        onClick={() => move(1)}
        className="grid w-8 shrink-0 place-items-center rounded-xl text-faint transition hover:bg-hover hover:text-ink"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
