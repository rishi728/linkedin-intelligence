"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Compass, Filter, Search, Target, X } from "lucide-react";
import { SECTORS } from "@/lib/knowledge/sectors";
import { applyFilters, buildIntents, parseQuery } from "@/lib/workspace/filters";
import { groupCompanies } from "@/lib/workspace/insights";
import type { Filters } from "@/lib/workspace/types";
import { PageBody } from "@/components/shell/AppShell";
import { Button, Card, CardTitle, Input, Pill, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

const EXAMPLES = [
  "senior people in supply chain",
  "product managers at google I haven't contacted",
  "founders I've spoken to",
  "people who could refer me",
  "alumni in finance",
];

function RoleTile({ label, hint, count, selected, onToggle }: {
  label: string; hint: string; count: number; selected: boolean; onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cx(
        "selectable-card group relative cursor-pointer rounded-xl border p-2.5 text-left shadow-xs select-none transition-all duration-150",
        selected
          ? "border-emerald-600 bg-[#EAF5EE]"
          : "border-[#EAE6DF] bg-white hover:border-emerald-300 hover:bg-emerald-50/50",
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cx(
              "truncate text-xs font-semibold transition-colors",
              selected ? "text-emerald-950" : "text-stone-900 group-hover:text-emerald-950",
            )}>{label}</span>
            {selected && <Check size={13} className="shrink-0 text-emerald-700" />}
          </div>
          <p className={cx(
            "mt-0.5 line-clamp-1 text-[11px] transition-colors",
            selected ? "text-stone-600" : "text-stone-500 group-hover:text-stone-600",
          )}>{hint}</p>
        </div>
        <span className={cx(
          "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium transition-colors",
          selected
            ? "bg-emerald-200/90 text-emerald-900"
            : "bg-stone-100 text-stone-600 group-hover:bg-emerald-100/70 group-hover:text-emerald-800",
        )}>{count.toLocaleString()}</span>
      </div>
    </button>
  );
}

function SectorTile({ label, count, maxCount, selected, onToggle }: {
  label: string; count: number; maxCount: number; selected: boolean; onToggle: () => void;
}) {
  const pct = maxCount > 0 ? Math.max(4, Math.round((count / maxCount) * 100)) : 0;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cx(
        "selectable-card group relative cursor-pointer rounded-xl border p-2.5 text-left shadow-xs select-none transition-all duration-150",
        selected
          ? "border-emerald-600 bg-[#EAF5EE]"
          : "border-[#EAE6DF] bg-white hover:border-emerald-300 hover:bg-emerald-50/50",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cx(
            "truncate text-xs font-semibold transition-colors",
            selected ? "text-emerald-950" : "text-stone-900 group-hover:text-emerald-950",
          )}>{label}</span>
          {selected && <Check size={13} className="shrink-0 text-emerald-700" />}
        </div>
        <span className={cx(
          "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium transition-colors",
          selected
            ? "bg-emerald-200/90 text-emerald-900"
            : "bg-stone-100 text-stone-600 group-hover:bg-emerald-100/70 group-hover:text-emerald-800",
        )}>{count.toLocaleString()}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-stone-100">
        <div className="h-1 rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
      </div>
    </button>
  );
}

export function FindView() {
  const { people, settings } = useWorkspace();
  const { setPeopleFilters } = useUI();
  const router = useRouter();
  const [mode, setMode] = useState<"guided" | "natural">("guided");
  const [text, setText] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [selectedSectors, setSelectedSectors] = useState<Set<string>>(new Set());


  const companies = useMemo(() => groupCompanies(people, settings).map((c) => ({ key: c.key, name: c.name, count: c.count })), [people, settings]);

  const go = useCallback((filters: Filters) => {
    setPeopleFilters(filters);
    router.push("/people");
  }, [setPeopleFilters, router]);

  const preview = useMemo(
    () => (text.trim() ? parseQuery(text, companies, { schools: settings.profile.schools }) : null),
    [text, companies, settings.profile.schools],
  );
  const previewCount = useMemo(() => (preview ? applyFilters(people, preview.filters, settings).length : 0), [preview, people, settings]);

  const intents = useMemo(() => buildIntents(people, settings), [people, settings]);

  const sectors = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of people) if (p.sector) m.set(p.sector, (m.get(p.sector) ?? 0) + 1);
    return SECTORS.map((x) => ({ ...x, count: m.get(x.id) ?? 0 })).filter((x) => x.count > 0).sort((a, b) => b.count - a.count);
  }, [people]);

  const maxSectorCount = sectors.length > 0 ? sectors[0].count : 0;

  const targetPeople = useMemo(() => applyFilters(people, { targetOnly: true }, settings).length, [people, settings]);

  const toggleRole = useCallback((id: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSector = useCallback((id: string) => {
    setSelectedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectedLabels = useMemo(() => {
    const labels: Array<{ key: string; label: string }> = [];
    for (const id of selectedRoles) {
      const intent = intents.find((i) => i.id === id);
      if (intent) labels.push({ key: id, label: intent.label });
    }
    for (const id of selectedSectors) {
      const sec = sectors.find((s) => s.id === id);
      if (sec) labels.push({ key: `s:${id}`, label: sec.label });
    }
    return labels;
  }, [selectedRoles, selectedSectors, intents, sectors]);

  const matchCount = useMemo(() => {
    if (selectedRoles.size === 0 && selectedSectors.size === 0) return people.length;
    let total = 0;
    for (const id of selectedRoles) {
      const intent = intents.find((i) => i.id === id);
      if (intent) total += intent.count;
    }
    for (const id of selectedSectors) {
      const sec = sectors.find((s) => s.id === id);
      if (sec) total += sec.count;
    }
    return Math.min(total, people.length);
  }, [selectedRoles, selectedSectors, intents, sectors, people.length]);

  const clearAll = useCallback(() => {
    setSelectedRoles(new Set());
    setSelectedSectors(new Set());
  }, []);

  const removeBadge = useCallback((key: string) => {
    if (key.startsWith("s:")) {
      const sId = key.slice(2);
      setSelectedSectors((prev) => { const next = new Set(prev); next.delete(sId); return next; });
    } else {
      setSelectedRoles((prev) => { const next = new Set(prev); next.delete(key); return next; });
    }
  }, []);

  const showResults = useCallback(() => {
    const filters: Filters = {};
    const sectorIds: string[] = [];
    for (const id of selectedRoles) {
      const intent = intents.find((i) => i.id === id);
      if (intent) Object.assign(filters, intent.filters);
    }
    for (const id of selectedSectors) {
      sectorIds.push(id);
    }
    if (sectorIds.length > 0) filters.sectors = sectorIds;
    go(filters);
  }, [selectedRoles, selectedSectors, intents, go]);

  return (
    <PageBody className="px-6 py-7 lg:px-10">
      <div className="mx-auto w-full max-w-[1440px]">
        {/* Page Header */}
        <div className="mb-6 max-w-4xl">
          <div className="mb-2 flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-100/90 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
              Interactive Discovery
            </span>
            <span className="font-mono text-[11px] tracking-wider text-stone-400">STEP 1 OF 3</span>
          </div>
          <h1 className="mb-2 text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">
            Who do you want to talk to?
          </h1>
          <p className="mb-4 text-sm leading-relaxed text-stone-600 md:text-base">
            You already have <span className="font-semibold text-stone-900">{people.length.toLocaleString()} connections</span>. Answer a few quick questions, or describe exactly who you need.
          </p>

          {/* Mode Selector */}
          <div className="inline-flex space-x-1 rounded-xl bg-stone-200/70 p-1">
            <button
              type="button"
              onClick={() => setMode("guided")}
              className={cx(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all",
                mode === "guided"
                  ? "bg-[#0F2D24] font-semibold text-white shadow-xs"
                  : "text-stone-600 hover:bg-white/60 hover:text-stone-900",
              )}
            >
              Guided
              {mode === "guided" && (
                <span className="ml-1 rounded-md bg-emerald-900/90 px-1.5 py-0.5 font-mono text-[10px] text-emerald-200">Recommended</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMode("natural")}
              className={cx(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all",
                mode === "natural"
                  ? "bg-[#0F2D24] font-semibold text-white shadow-xs"
                  : "text-stone-600 hover:bg-white/60 hover:text-stone-900",
              )}
            >
              Describe it
            </button>
          </div>
        </div>

        {mode === "natural" ? (
          <>
            <div className="relative mt-5 max-w-3xl">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && preview) go(preview.filters); }}
                placeholder="e.g. senior supply chain people at target companies I haven't contacted"
                className="h-11 rounded-xl pl-10 pr-28 text-[14px]"
              />
              <Button
                variant="primary"
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
                disabled={!preview}
                onClick={() => preview && go(preview.filters)}
              >
                Search
              </Button>
            </div>

            {preview ? (
              <div className="mt-3 max-w-3xl rounded-xl border border-line bg-panel px-3 py-2.5">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">You&apos;re looking for</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12.5px]">
                  {preview.understood.length ? (
                    preview.understood.map((u) => <Pill key={u} tone="teal">{u}</Pill>)
                  ) : (
                    <Pill tone="gray">Anything matching these words</Pill>
                  )}
                  {preview.filters.q ? <Pill tone="gray">text: &quot;{preview.filters.q}&quot;</Pill> : null}
                  <span className="ml-auto tabular font-medium">{previewCount.toLocaleString()} people</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex max-w-3xl flex-wrap gap-1.5">
                {EXAMPLES.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setText(e)}
                    className="rounded-md border border-line px-2 py-1 text-[12px] text-muted transition hover:border-line-strong hover:text-ink"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Filtered Pipeline Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EAE6DF] bg-white/80 px-4 py-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-50 text-emerald-700">
                  <Filter size={14} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Filtered Pipeline</div>
                  <span className="text-stone-300">.</span>
                  <div className="text-xs font-semibold text-stone-900">
                    <span className="font-bold text-emerald-700">{matchCount.toLocaleString()}</span> matches available
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedLabels.map((s) => (
                  <span key={s.key} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-900 px-2.5 py-1 text-xs font-medium text-emerald-100 shadow-xs">
                    <span>{s.label}</span>
                    <button type="button" className="transition-colors hover:text-white" onClick={() => removeBadge(s.key)}>
                      <X size={13} />
                    </button>
                  </span>
                ))}
                {selectedLabels.length > 0 && (
                  <button
                    type="button"
                    className="ml-auto text-xs font-medium text-stone-500 underline underline-offset-2 transition-colors hover:text-stone-800"
                    onClick={clearAll}
                  >
                    Reset selections
                  </button>
                )}
              </div>
              {(selectedRoles.size > 0 || selectedSectors.size > 0) && (
                <Button variant="primary" size="sm" className="ml-auto" onClick={showResults}>
                  Show {matchCount.toLocaleString()} people
                </Button>
              )}
            </div>

            {/* Two-column main grid */}
            <div className="grid grid-cols-1 items-start gap-7 xl:grid-cols-2">
              {/* LEFT: What are you looking for? */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200/70 pb-1.5">
                  <div className="flex items-center gap-2">
                    <Search size={16} className="text-stone-500" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">What are you looking for?</h2>
                  </div>
                  <span className="font-mono text-[11px] text-stone-500">{intents.length} ROLES &amp; FUNCTIONS</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {intents.map((intent) => (
                    <RoleTile
                      key={intent.id}
                      label={intent.label}
                      hint={intent.hint}
                      count={intent.count}
                      selected={selectedRoles.has(intent.id)}
                      onToggle={() => toggleRole(intent.id)}
                    />
                  ))}
                </div>
              </div>

              {/* RIGHT: Or by where they work */}
              {sectors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200/70 pb-1.5">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-stone-500" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">Or by where they work</h2>
                    </div>
                    <span className="font-mono text-[11px] text-stone-500">{sectors.length} SECTORS</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {sectors.map((sec) => (
                      <SectorTile
                        key={sec.id}
                        label={sec.label}
                        count={sec.count}
                        maxCount={maxSectorCount}
                        selected={selectedSectors.has(sec.id)}
                        onToggle={() => toggleSector(sec.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Target companies card */}
        <Card className="mt-6 max-w-3xl p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg tone-blue"><Target size={15} /></span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold">Target companies</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {settings.targetCompanies.length
                  ? `${targetPeople.toLocaleString()} connections across your ${settings.targetCompanies.length} target companies.`
                  : "Pick the companies you're aiming for and every search can narrow to people you already know there."}
              </p>
              <div className="mt-2.5 flex gap-2">
                {settings.targetCompanies.length ? <Button size="sm" icon={Building2} onClick={() => go({ targetOnly: true })}>View people</Button> : null}
                <Button size="sm" variant={settings.targetCompanies.length ? "ghost" : "secondary"} onClick={() => router.push("/companies")}>
                  {settings.targetCompanies.length ? "Manage" : "Choose companies"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Saved lists */}
        {settings.segments.length ? (
          <Card className="mt-3 max-w-3xl">
            <CardTitle hint="Saved searches that stay up to date">Your lists</CardTitle>
            <div className="p-2">
              {settings.segments.map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => go(seg.filters)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-hover"
                >
                  <span className="flex items-center gap-2 truncate text-[12.5px]"><Compass size={13} className="text-muted" />{seg.name}</span>
                  <span className="tabular text-[12px] text-muted">{applyFilters(people, seg.filters, settings).length.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

    </PageBody>
  );
}
