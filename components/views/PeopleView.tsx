"use client";

import { useMemo, useState } from "react";
import { BookmarkPlus, Download, ExternalLink, LayoutGrid, List, Rows3, Sparkles, UserPlus, X } from "lucide-react";
import { applyFilters, broaden, PRIORITY_ORDER, SENIORITY_ORDER } from "@/lib/workspace/filters";
import { groupCompanies } from "@/lib/workspace/insights";
import type { Person } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { FilterBar } from "@/components/people/FilterBar";
import { PeopleList, type ViewMode } from "@/components/people/PeopleList";
import { openProfiles } from "@/components/people/common";
import { Button, Menu, MenuItem, MenuLabel, Segmented, Select, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

type SortKey = "relevance" | "name" | "company" | "recent" | "followup" | "seniority" | "confidence";

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "relevance", label: "Best match" },
  { value: "recent", label: "Recently connected" },
  { value: "name", label: "Name (A–Z)" },
  { value: "company", label: "Company" },
  { value: "seniority", label: "Seniority" },
  { value: "followup", label: "Follow-up date" },
  { value: "confidence", label: "Lowest confidence" },
];

function sortPeople(people: Person[], key: SortKey): Person[] {
  const copy = [...people];
  switch (key) {
    case "name": return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "company": return copy.sort((a, b) => (a.company || "zzz").localeCompare(b.company || "zzz") || a.name.localeCompare(b.name));
    case "recent": return copy.sort((a, b) => (b.connectedOn?.getTime() ?? 0) - (a.connectedOn?.getTime() ?? 0));
    case "seniority": return copy.sort((a, b) => (SENIORITY_ORDER.get(a.seniority) ?? 99) - (SENIORITY_ORDER.get(b.seniority) ?? 99) || b.priorityScore - a.priorityScore);
    case "followup": return copy.sort((a, b) => (a.followUpAt || "9999").localeCompare(b.followUpAt || "9999"));
    case "confidence": return copy.sort((a, b) => a.confidence - b.confidence);
    default:
      return copy.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.priorityScore - a.priorityScore || a.name.localeCompare(b.name));
  }
}

export function PeopleView() {
  const { people, settings, setStatus, updateRecord, saveSegment } = useWorkspace();
  const { peopleFilters, setPeopleFilters, openPerson, personId, openExport, toast, openWizard } = useUI();
  const [mode, setMode] = useState<ViewMode>("table");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const companies = useMemo(() => groupCompanies(people, settings).map((c) => ({ key: c.key, name: c.name, count: c.count })), [people, settings]);
  const filtered = useMemo(() => applyFilters(people, peopleFilters, settings), [people, peopleFilters, settings]);
  const sorted = useMemo(() => sortPeople(filtered, sort), [filtered, sort]);
  const wider = useMemo(() => (filtered.length ? null : broaden(peopleFilters, settings)), [filtered.length, peopleFilters, settings]);

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const selectedPeople = useMemo(() => sorted.filter((p) => selected.has(p.id)), [sorted, selected]);
  const clearSelection = () => setSelected(new Set());

  return (
    <>
      <PageHeader
        title="People"
        subtitle={`${sorted.length.toLocaleString()} of ${people.length.toLocaleString()} connections`}
        actions={
          <>
            <Button
              icon={BookmarkPlus}
              onClick={() => {
                const name = window.prompt("Name this segment", "My segment");
                if (!name) return;
                saveSegment(name, peopleFilters);
                toast(`Saved “${name}” — it's in the sidebar.`);
              }}
            >
              Save segment
            </Button>
            <Button icon={Download} onClick={() => openExport({ filters: peopleFilters, title: "People export" })}>
              Export
            </Button>
          </>
        }
      />

      <FilterBar
        filters={peopleFilters}
        onChange={setPeopleFilters}
        people={people}
        settings={settings}
        companies={companies}
        right={
          <>
            <div className="w-[168px]">
              <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "table", label: <List size={13} />, title: "Table" },
                { value: "cards", label: <LayoutGrid size={13} />, title: "Cards" },
                { value: "compact", label: <Rows3 size={13} />, title: "Compact" },
              ]}
            />
          </>
        }
      />

      <PeopleList
        people={sorted}
        mode={mode}
        selected={selected}
        onSelect={toggle}
        onOpen={openPerson}
        openId={personId}
        emptyBody={wider ? `Nothing matches this combination. Dropping “${wider.removed}” usually brings results back.` : undefined}
        emptyAction={
          wider ? (
            <Button variant="primary" onClick={() => setPeopleFilters(wider.filters)}>Broaden: drop “{wider.removed}”</Button>
          ) : (
            <Button icon={Sparkles} onClick={() => openWizard(true)}>Use guided search</Button>
          )
        }
      />

      {selected.size > 0 ? (
        <div className="anim-pop pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 shadow-float">
            <span className="tabular px-1 text-[12.5px] font-medium">{selected.size} selected</span>
            <Button
              size="sm"
              icon={UserPlus}
              onClick={() => {
                setStatus([...selected], "to_contact");
                toast(`${selected.size} added to outreach as “To contact”.`);
                clearSelection();
              }}
            >
              Add to outreach
            </Button>
            <Menu
              width={200}
              trigger={({ toggle: t }) => <Button size="sm" onClick={t}>Set status</Button>}
            >
              {(close) => (
                <>
                  <MenuLabel>Move to</MenuLabel>
                  {settings.statuses.map((s) => (
                    <MenuItem key={s.id} onClick={() => { setStatus([...selected], s.id); toast(`Moved ${selected.size} to ${s.label}.`); clearSelection(); close(); }}>
                      {s.label}
                    </MenuItem>
                  ))}
                </>
              )}
            </Menu>
            <Menu width={180} trigger={({ toggle: t }) => <Button size="sm" onClick={t}>Set priority</Button>}>
              {(close) => (
                <>
                  {(["high", "medium", "low"] as const).map((p) => (
                    <MenuItem key={p} onClick={() => { selected.forEach((id) => updateRecord(id, { priority: p })); toast(`Priority set for ${selected.size}.`); clearSelection(); close(); }}>
                      {p[0].toUpperCase() + p.slice(1)}
                    </MenuItem>
                  ))}
                  <MenuItem onClick={() => { selected.forEach((id) => updateRecord(id, { priority: undefined })); toast("Priority back to automatic."); clearSelection(); close(); }}>
                    Automatic
                  </MenuItem>
                </>
              )}
            </Menu>
            <Button
              size="sm"
              icon={ExternalLink}
              onClick={() => {
                const withUrl = selectedPeople.filter((p) => p.url);
                if (withUrl.length > 8 && !window.confirm(`Open ${withUrl.length} LinkedIn tabs? Your browser may block some of them.`)) return;
                const opened = openProfiles(withUrl);
                toast(opened < withUrl.length ? `Opened ${opened} of ${withUrl.length}. Allow pop-ups for this site to open the rest.` : `Opened ${opened} profiles.`);
              }}
            >
              Open LinkedIn
            </Button>
            <Button size="sm" icon={Download} onClick={() => openExport({ filters: peopleFilters, ids: [...selected], title: "Selected people" })}>
              Export
            </Button>
            <button type="button" onClick={clearSelection} className={cx("ml-1 text-muted hover:text-ink")} aria-label="Clear selection">
              <X size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export { PageBody };
