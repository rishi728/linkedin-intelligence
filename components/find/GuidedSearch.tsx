"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronLeft } from "lucide-react";
import { functionLabel } from "@/lib/intelligence";
import { applyFilters, buildIntents } from "@/lib/workspace/filters";
import type { AudienceId, Filters, Person, Settings } from "@/lib/workspace/types";
import { Button, cx } from "@/components/ui";

/**
 * Four questions — area, who, where, relationship — each showing how many people
 * are left. Everything it produces is an ordinary Filters object, so the results,
 * the chips and a saved list behave exactly as if the search had been typed.
 */

type Who = "anyone" | AudienceId | "senior";
type Where = "all" | "target";
type Rel = "any" | "spoken" | "replied" | "never";

const WHO_OPTIONS: Array<{ id: Who; label: string; hint: string }> = [
  { id: "anyone", label: "Anyone", hint: "Every level" },
  { id: "peers", label: "Peers", hint: "Students and early career" },
  { id: "senior", label: "Experienced professionals", hint: "Senior and above" },
  { id: "managers", label: "Managers", hint: "Managers and leads" },
  { id: "directors", label: "Directors & Heads", hint: "Directors, heads, VPs" },
  { id: "founders", label: "Founders", hint: "Founders and co-founders" },
  { id: "recruiters", label: "Recruiters", hint: "Talent acquisition" },
];

const REL_OPTIONS: Array<{ id: Rel; label: string; hint: string }> = [
  { id: "any", label: "Anyone", hint: "However we're connected" },
  { id: "spoken", label: "I've spoken to them", hint: "There's a conversation already" },
  { id: "replied", label: "Warm — they replied", hint: "They wrote back before" },
  { id: "never", label: "Never contacted", hint: "Fresh outreach" },
];

const SENIOR_LEVELS = ["Senior", "Manager / Lead", "Director / Head", "VP", "C-Level", "Founder"];

function whoFilters(who: Who): Filters {
  if (who === "anyone") return {};
  if (who === "senior") return { seniorities: SENIOR_LEVELS };
  return { audiences: [who] };
}

function relFilters(rel: Rel): Filters {
  switch (rel) {
    case "spoken": return { history: "messaged" };
    case "replied": return { history: "replied" };
    case "never": return { statuses: ["not_contacted"], history: "never" };
    default: return {};
  }
}

function Option({ label, hint, n, active, onClick }: { label: string; hint?: string; n?: number; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-xl border px-3 py-2.5 text-left transition",
        active ? "border-accent bg-accent-soft/40" : "border-line bg-panel hover:border-line-strong hover:shadow-pop",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] font-medium">{label}</span>
        {active ? (
          <Check size={13} className="shrink-0 text-accent" />
        ) : n !== undefined ? (
          <span className="tabular shrink-0 text-[12px] text-muted">{n.toLocaleString()}</span>
        ) : null}
      </span>
      {hint ? <span className="mt-0.5 block truncate text-[11.5px] text-muted">{hint}</span> : null}
    </button>
  );
}

function StepHeading({ title, soFar }: { title: string; soFar: number }) {
  return (
    <div className="mb-2 mt-5 flex items-baseline justify-between gap-3">
      <p className="text-[13px] font-semibold">{title}</p>
      <span className="tabular text-[12px] text-muted">{soFar.toLocaleString()} people so far</span>
    </div>
  );
}

export function GuidedSearch({
  people, settings, onShow,
}: {
  people: Person[];
  settings: Settings;
  onShow: (f: Filters) => void;
}) {
  const [intentId, setIntentId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [who, setWho] = useState<Who | null>(null);
  const [where, setWhere] = useState<Where | null>(null);
  const [rel, setRel] = useState<Rel | null>(null);

  const hasTargets = settings.targetCompanies.length > 0;

  // One pass computes every number on screen, so changing an answer stays instant
  // even with thousands of connections.
  const view = useMemo(() => {
    const n = (f: Filters) => applyFilters(people, f, settings).length;
    const intents = buildIntents(people, settings);
    const intent = intents.find((i) => i.id === intentId) ?? null;

    const afterArea: Filters = { ...(intent?.filters ?? {}), ...(role ? { roles: [role] } : {}) };
    const afterWho: Filters = { ...afterArea, ...(who ? whoFilters(who) : {}) };
    const afterWhere: Filters = { ...afterWho, ...(where === "target" ? { targetOnly: true } : {}) };
    const final: Filters = { ...afterWhere, ...(rel ? relFilters(rel) : {}) };

    const inArea = intent ? applyFilters(people, intent.filters, settings) : [];
    const byRole = new Map<string, { fn: string; count: number }>();
    for (const p of inArea) {
      if (p.domain === "unclassified") continue;
      const e = byRole.get(p.role) ?? { fn: p.fn, count: 0 };
      e.count++;
      byRole.set(p.role, e);
    }

    return {
      intent,
      final,
      finalCount: n(final),
      intents,
      roles: [...byRole.entries()].map(([r, e]) => ({ role: r, ...e })).sort((a, b) => b.count - a.count).slice(0, 10),
      soFar: { area: n(afterArea), who: n(afterWho), where: n(afterWhere), rel: n(final) },
      whoCounts: Object.fromEntries(WHO_OPTIONS.map((o) => [o.id, n({ ...afterArea, ...whoFilters(o.id) })])),
      whereCounts: { all: n(afterWho), target: hasTargets ? n({ ...afterWho, targetOnly: true }) : undefined },
      relCounts: Object.fromEntries(REL_OPTIONS.map((o) => [o.id, n({ ...afterWhere, ...relFilters(o.id) })])),
    };
  }, [people, settings, intentId, role, who, where, rel, hasTargets]);

  const { intent } = view;
  const ready = !!intent && !!who && !!where && !!rel;

  if (!intent) {
    return (
      <div>
        <p className="mb-2 text-[13px] font-semibold">What are you looking for?</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {view.intents.map((i) => (
            <Option key={i.id} label={i.label} hint={i.hint} n={i.count} onClick={() => setIntentId(i.id)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => { setIntentId(null); setRole(null); setWho(null); setWhere(null); setRel(null); }}
        className="mb-1 inline-flex items-center gap-1 text-[12px] text-muted transition hover:text-ink"
      >
        <ChevronLeft size={13} /> Start over
      </button>

      <StepHeading title={`Looking for: ${intent.label}`} soFar={view.soFar.area} />
      {view.roles.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setRole(null)}
            className={cx("rounded-md border px-2 py-1 text-[12px] transition", !role ? "border-accent bg-accent-soft/40" : "border-line text-muted hover:text-ink")}
          >
            All roles
          </button>
          {view.roles.map((r) => (
            <button
              key={r.role}
              type="button"
              onClick={() => setRole(role === r.role ? null : r.role)}
              title={functionLabel(r.fn)}
              className={cx(
                "rounded-md border px-2 py-1 text-[12px] transition",
                role === r.role ? "border-accent bg-accent-soft/40" : "border-line text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {r.role} <span className="tabular text-muted">{r.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <StepHeading title="Who do you want to reach?" soFar={view.soFar.who} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {WHO_OPTIONS.map((o) => (
          <Option key={o.id} label={o.label} hint={o.hint} active={who === o.id} n={view.whoCounts[o.id]} onClick={() => setWho(o.id)} />
        ))}
      </div>

      {who ? (
        <>
          <StepHeading title="Which companies?" soFar={view.soFar.where} />
          <div className="grid grid-cols-2 gap-2">
            <Option label="All companies" active={where === "all"} n={view.whereCounts.all} onClick={() => setWhere("all")} />
            <Option
              label="Target companies only"
              hint={hasTargets ? `${settings.targetCompanies.length} targets set` : "Set targets in Companies first"}
              active={where === "target"}
              n={view.whereCounts.target}
              onClick={() => setWhere(hasTargets ? "target" : "all")}
            />
          </div>
        </>
      ) : null}

      {who && where ? (
        <>
          <StepHeading title="What's your relationship?" soFar={view.soFar.rel} />
          <div className="grid grid-cols-2 gap-2">
            {REL_OPTIONS.map((o) => (
              <Option key={o.id} label={o.label} hint={o.hint} active={rel === o.id} n={view.relCounts[o.id]} onClick={() => setRel(o.id)} />
            ))}
          </div>
        </>
      ) : null}

      {ready ? (
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-subtle px-3 py-2.5">
          <span className="text-[13px]">
            <strong className="tabular">{view.finalCount.toLocaleString()}</strong>{" "}
            {view.finalCount === 1 ? "person matches" : "people match"} what you&apos;re looking for.
          </span>
          <Button variant="primary" icon={ArrowRight} className="ml-auto" onClick={() => onShow(view.final)}>
            Show {view.finalCount === 1 ? "the person" : `${view.finalCount.toLocaleString()} people`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
