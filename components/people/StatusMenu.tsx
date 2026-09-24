"use client";

import { Check, ChevronDown } from "lucide-react";
import type { Person } from "@/lib/workspace/types";
import { Dot, Menu, MenuItem, MenuLabel, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";
import { statusDef } from "./common";

/**
 * The status pill, but clickable: change where someone sits in the pipeline from
 * any list, without opening their profile.
 */
export function StatusMenu({ person, size = "md", align = "left" }: { person: Person; size?: "sm" | "md"; align?: "left" | "right" }) {
  const { settings, setStatus } = useWorkspace();
  const { toast } = useUI();
  const def = statusDef(settings, person.status);
  const previous = person.status;

  return (
    <Menu
      align={align}
      width={210}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          title="Change status"
          className={cx(
            "inline-flex items-center gap-1 rounded-md font-medium transition",
            `tone-${def.tone}`,
            size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-[11.5px]",
            open ? "ring-1 ring-[var(--ring)]" : "hover:brightness-95",
          )}
        >
          <Dot tone={def.tone} />
          <span className="truncate">{def.label}</span>
          <ChevronDown size={11} className="opacity-60" />
        </button>
      )}
    >
      {(close) => (
        <>
          <MenuLabel>Move to</MenuLabel>
          {settings.statuses.map((s) => (
            <MenuItem
              key={s.id}
              selected={s.id === person.status}
              icon={s.id === person.status ? Check : undefined}
              onClick={() => {
                close();
                if (s.id === person.status) return;
                setStatus([person.id], s.id);
                toast(`${person.name} → ${s.label}`, { label: "Undo", run: () => setStatus([person.id], previous) });
              }}
            >
              <span className="flex items-center gap-1.5">
                <Dot tone={s.tone} />
                {s.label}
              </span>
            </MenuItem>
          ))}
        </>
      )}
    </Menu>
  );
}
