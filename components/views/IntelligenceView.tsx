"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import { bucketLabel } from "@/lib/knowledge/roles";
import { sectorLabel } from "@/lib/knowledge/sectors";
import { rankByRelevance } from "@/lib/workspace/relevance";
import { formatDate } from "@/lib/workspace/dates";
import { MAX_OPENROUTER_REQUESTS_PER_RUN } from "@/lib/ai/types";
import type { Filters } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { Avatar, Button, Card, CardTitle, Meter, Pill, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="tabular text-[22px] font-semibold leading-none tracking-tight">{value}</p>
      <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">{label}</p>
      {hint ? <p className="mt-0.5 text-[11.5px] text-muted">{hint}</p> : null}
    </div>
  );
}

function Distribution({
  title, hint, rows, total, onPick,
}: {
  title: string;
  hint: string;
  rows: Array<{ key: string; label: string; count: number; filters: Filters }>;
  total: number;
  onPick: (f: Filters) => void;
}) {
  return (
    <Card>
      <CardTitle hint={hint}>{title}</CardTitle>
      <div className="space-y-1.5 p-3 pt-1">
        {rows.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => onPick(r.filters)}
            className="group block w-full rounded-md px-1.5 py-1 text-left transition duration-200 hover:bg-hover"
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[12.5px] group-hover:text-accent">{r.label}</span>
              <span className="tabular shrink-0 text-[12px] text-muted">
                {Math.round((r.count / Math.max(1, total)) * 100)}%
              </span>
            </span>
            <span aria-hidden className="mt-1 block h-1.5 rounded-full bg-line">
              <span
                className="anim-bar block h-full rounded-full bg-accent"
                style={{ width: `${Math.max(3, (r.count / Math.max(1, total)) * 100)}%` }}
              />
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

/**
 * What the network contains and who in it matters to this user.
 *
 * Everything on this page is computed on the device except the written insights,
 * which come from one request at the end of a run. The request counter is shown
 * because a budget the user cannot see is a budget they cannot trust.
 */
export function IntelligenceView() {
  const { people, settings, aiSettings, lastRun, intelligence, running, runIntelligence, clearIntelligence } =
    useWorkspace();
  const { setPeopleFilters, openPerson, toast } = useUI();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const go = (f: Filters) => {
    setPeopleFilters(f);
    router.push("/people");
  };

  const roles = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of people) if (p.bucket) m.set(p.bucket, (m.get(p.bucket) ?? 0) + 1);
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, count]) => ({ key, label: bucketLabel(key), count, filters: { buckets: [key] } as Filters }));
  }, [people]);

  const sectors = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of people) if (p.sector) m.set(p.sector, (m.get(p.sector) ?? 0) + 1);
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, count]) => ({ key, label: sectorLabel(key), count, filters: { sectors: [key] } as Filters }));
  }, [people]);

  const classified = roles.reduce((n, r) => n + r.count, 0);
  const sectorTotal = sectors.reduce((n, r) => n + r.count, 0);

  const shortlist = useMemo(() => rankByRelevance(people, settings, 8), [people, settings]);
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const start = async (mode: "full" | "incremental") => {
    setBusy(true);
    try {
      const stats = await runIntelligence(mode);
      if (!stats) {
        toast("Add an OpenRouter key in Settings to run this.");
        return;
      }
      toast(
        stats.stoppedBecause
          ? `${stats.requestsUsed} of ${MAX_OPENROUTER_REQUESTS_PER_RUN} requests used. ${stats.stoppedBecause}`
          : `Done. ${stats.requestsUsed} of ${MAX_OPENROUTER_REQUESTS_PER_RUN} requests used.`,
      );
    } finally {
      setBusy(false);
    }
  };

  const working = busy || running;

  return (
    <>
      <PageHeader
        title="Network intelligence"
        subtitle={`${people.length.toLocaleString()} connections · ${roles.length} role areas · ${sectors.length} sectors`}
        actions={
          <>
            {lastRun ? (
              <Button icon={RotateCcw} disabled={working} onClick={() => start("incremental")}>
                Update
              </Button>
            ) : null}
            <Button variant="primary" icon={Play} disabled={working} onClick={() => start("full")}>
              {working ? "Working…" : lastRun ? "Run again" : "Run"}
            </Button>
          </>
        }
      />

      <PageBody className="p-6">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          {/* ---- the run itself, stated plainly -------------------------- */}
          <Card className="p-4">
            {lastRun ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-6">
                  <Figure
                    label="Requests used"
                    value={`${lastRun.requestsUsed} / ${MAX_OPENROUTER_REQUESTS_PER_RUN}`}
                    hint={`${lastRun.batchCount} classification ${lastRun.batchCount === 1 ? "batch" : "batches"}`}
                  />
                  <Figure
                    label="Placed on this device"
                    value={lastRun.deterministicClassifications.toLocaleString()}
                    hint="Never sent anywhere"
                  />
                  <Figure label="Placed by the model" value={lastRun.aiClassifications.toLocaleString()} />
                  <Figure label="Reused from cache" value={lastRun.cacheHits.toLocaleString()} />
                  <Figure
                    label="Still unresolved"
                    value={lastRun.unresolvedCount.toLocaleString()}
                    hint={lastRun.lowConfidenceCount ? `${lastRun.lowConfidenceCount.toLocaleString()} low confidence` : undefined}
                  />
                </div>
                <div className="mt-3">
                  <Meter value={(lastRun.requestsUsed / MAX_OPENROUTER_REQUESTS_PER_RUN) * 100} tone="teal" />
                </div>
                <p className="mt-2 text-[11.5px] text-muted">
                  Last run {formatDate(new Date(lastRun.completedAt), true)}
                  {lastRun.requestsFailed ? ` · ${lastRun.requestsFailed} request failed and was retried` : ""}
                  {lastRun.averageConfidence ? ` · average confidence ${lastRun.averageConfidence}` : ""}
                </p>
                {lastRun.stoppedBecause ? (
                  <p className="mt-1.5 text-[12px] text-[var(--t-amber)]">{lastRun.stoppedBecause}</p>
                ) : null}
              </>
            ) : (
              <div className="max-w-[62ch]">
                <p className="text-[13.5px] font-semibold">Nothing has been run yet</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                  Everything below is already worked out on this device. A run adds one thing: titles the repository
                  could not place get read by a language model, at most nine requests for the whole network, and every
                  answer is checked against the repository before it is stored.
                </p>
                {!aiSettings.apiKey ? (
                  <Button className="mt-3" onClick={() => router.push("/settings")}>
                    Add an OpenRouter key
                  </Button>
                ) : null}
              </div>
            )}
          </Card>

          {/* ---- what the network contains -------------------------------- */}
          <div className="grid gap-4 md:grid-cols-2">
            <Distribution
              title="Role distribution"
              hint="Click any row to open those people"
              rows={roles}
              total={classified}
              onPick={go}
            />
            <Distribution
              title="Sector distribution"
              hint="Read from each connection's employer"
              rows={sectors}
              total={sectorTotal}
              onPick={go}
            />
          </div>

          {/* ---- what the run made of it ---------------------------------- */}
          {intelligence?.insights.length ? (
            <Card>
              <CardTitle hint="Written from the counts above, for your stated focus">Insights</CardTitle>
              <ul className="divide-y divide-line">
                {intelligence.insights.map((i) => (
                  <li key={i.headline} className="px-4 py-3">
                    <p className="text-[13.5px] font-medium">{i.headline}</p>
                    {i.detail ? <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{i.detail}</p> : null}
                    {i.bucket || i.sector ? (
                      <button
                        type="button"
                        onClick={() => go(i.bucket ? { buckets: [i.bucket] } : { sectors: [i.sector!] })}
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-muted transition duration-200 hover:text-accent"
                      >
                        See these people
                        <ArrowRight size={12} />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              {intelligence.gaps.length ? (
                <div className="border-t border-line px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Thin on</p>
                  <p className="mt-1 text-[12.5px] text-ink-2">{intelligence.gaps.join(" · ")}</p>
                </div>
              ) : null}
            </Card>
          ) : null}

          {/* ---- who matters to this user, worked out here ---------------- */}
          <Card>
            <CardTitle hint="Ranked against your focus, on this device">Worth your time</CardTitle>
            {shortlist.length ? (
              <ul className="divide-y divide-line">
                {shortlist.map((x) => {
                  const p = byId.get(x.connectionId);
                  if (!p) return null;
                  return (
                    <li key={x.connectionId} className="flex items-start gap-3 px-4 py-3">
                      <Avatar name={p.name} size={30} />
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => openPerson(p.id)}
                          className="block truncate text-[13.5px] font-medium transition duration-200 hover:text-accent"
                        >
                          {p.name}
                        </button>
                        <p className="truncate text-[12px] text-muted">
                          {p.roleLabel || p.position}
                          {p.company ? ` · ${p.company}` : ""}
                        </p>
                        {x.relevanceReasons.length ? (
                          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                            {x.relevanceReasons.join(" · ")}
                          </p>
                        ) : null}
                        {x.relationshipContext.length || x.potentialUseCases.length ? (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {x.relationshipContext.slice(0, 2).map((r) => (
                              <Pill key={r} tone="gray">{r}</Pill>
                            ))}
                            {x.potentialUseCases.slice(0, 1).map((u) => (
                              <Pill key={u} tone="teal">{u}</Pill>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <span className={cx("tabular shrink-0 text-[12px]", x.relevance >= 0.5 ? "text-accent" : "text-muted")}>
                        {Math.round(x.relevance * 100)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-[12.5px] text-muted">
                Tell it what you are looking for in Settings and this fills with the people who match.
              </p>
            )}
          </Card>

          {lastRun ? (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  if (!window.confirm("Forget every classification the model made? Your own corrections are kept.")) return;
                  await clearIntelligence();
                  toast("Cleared. Everything falls back to the repository.");
                }}
              >
                Clear what the model added
              </Button>
            </div>
          ) : null}
        </div>
      </PageBody>
    </>
  );
}
