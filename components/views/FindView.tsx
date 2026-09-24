"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Compass, Search, Target } from "lucide-react";
import { applyFilters, buildIntents, parseQuery } from "@/lib/workspace/filters";
import { groupCompanies } from "@/lib/workspace/insights";
import type { Filters } from "@/lib/workspace/types";
import { PageBody } from "@/components/shell/AppShell";
import { GuidedSearch } from "@/components/find/GuidedSearch";
import { Button, Card, CardTitle, Input, Pill, Segmented } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

/** Every one of these is understood by parseQuery - nothing here is aspirational. */
const EXAMPLES = [
  "senior people in supply chain",
  "product managers at google I haven't contacted",
  "founders I've spoken to",
  "people who could refer me",
  "alumni in finance",
];

export function FindView() {
  const { people, settings } = useWorkspace();
  const { setPeopleFilters } = useUI();
  const router = useRouter();
  const [mode, setMode] = useState<"guided" | "natural">("guided");
  const [text, setText] = useState("");

  const companies = useMemo(() => groupCompanies(people, settings).map((c) => ({ key: c.key, name: c.name, count: c.count })), [people, settings]);

  const go = (filters: Filters) => {
    setPeopleFilters(filters);
    router.push("/people");
  };

  const preview = useMemo(
    () => (text.trim() ? parseQuery(text, companies, { schools: settings.profile.schools }) : null),
    [text, companies, settings.profile.schools],
  );
  const previewCount = useMemo(() => (preview ? applyFilters(people, preview.filters, settings).length : 0), [preview, people, settings]);

  const intents = useMemo(() => buildIntents(people, settings), [people, settings]);

  const targetPeople = useMemo(() => applyFilters(people, { targetOnly: true }, settings).length, [people, settings]);

  return (
    <PageBody className="px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight">Who do you want to talk to?</h1>
          <p className="mt-1.5 max-w-[50ch] text-[14px] leading-relaxed text-muted">
            You already have {people.length.toLocaleString()} connections. Answer a few questions, or just describe who
            you need.
          </p>
        </header>

        <div className="mt-5 flex">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "guided", label: "Guided" },
              { value: "natural", label: "Describe it" },
            ]}
          />
        </div>

        {mode === "natural" ? (
          <>
            <div className="relative mt-5">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && preview) go(preview.filters);
                }}
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
              <div className="mt-3 rounded-xl border border-line bg-panel px-3 py-2.5">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">You&apos;re looking for</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12.5px]">
                  {preview.understood.length ? (
                    preview.understood.map((u) => <Pill key={u} tone="teal">{u}</Pill>)
                  ) : (
                    <Pill tone="gray">Anything matching these words</Pill>
                  )}
                  {preview.filters.q ? <Pill tone="gray">text: “{preview.filters.q}”</Pill> : null}
                  <span className="ml-auto tabular font-medium">{previewCount.toLocaleString()} people</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-1.5">
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

            <p className="mb-3 mt-9 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">Or jump straight to an area</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {intents.map((intent) => (
                <button
                  key={intent.id}
                  type="button"
                  onClick={() => go(intent.filters)}
                  className="rounded-xl border border-line bg-panel p-3 text-left transition hover:border-line-strong hover:shadow-pop"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium">{intent.label}</span>
                    <span className="tabular shrink-0 text-[12px] text-muted">{intent.count.toLocaleString()}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-muted">{intent.hint}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-5">
            <GuidedSearch people={people} settings={settings} onShow={go} />
          </div>
        )}

        <Card className="mt-6 p-4">
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

        {settings.segments.length ? (
          <Card className="mt-3">
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
