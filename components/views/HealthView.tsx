"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { HEALTH_LABELS } from "@/lib/workspace/filters";
import { HEALTH_ORDER, healthCounts } from "@/lib/workspace/insights";
import { formatDate } from "@/lib/workspace/dates";
import type { HealthIssue } from "@/lib/workspace/types";
import { PageBody, PageHeader } from "@/components/shell/AppShell";
import { Button, Card, CardTitle, Meter, Pill } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

const DESCRIPTIONS: Record<HealthIssue, string> = {
  unclassified: "No job title and no recognisable employer — nothing to classify. Open them to set a role yourself.",
  "low-confidence": "Classified from weak evidence, like a generic title or the employer alone.",
  "missing-position": "LinkedIn's export has no job title for these people.",
  "missing-company": "No employer in the export, so industry and target matching can't work.",
  "missing-email": "LinkedIn only shares emails for people who allow it — reach these people on LinkedIn.",
  "missing-linkedin": "No profile URL in the export.",
  duplicates: "The same profile appears more than once in your file.",
  manual: "Classified by you or by one of your rules.",
};

export function HealthView() {
  const { people, settings, dataset } = useWorkspace();
  const { setPeopleFilters } = useUI();
  const router = useRouter();

  const counts = useMemo(() => healthCounts(people), [people]);
  const go = (issue: HealthIssue) => {
    setPeopleFilters({ health: issue });
    router.push("/people");
  };

  const classified = people.filter((p) => p.domain !== "unclassified").length;
  const specific = people.filter((p) => p.confidence >= 80 || p.classSource !== "auto").length;

  return (
    <>
      <PageHeader title="Data health" subtitle={`${dataset?.fileName} · imported ${dataset ? formatDate(new Date(dataset.importedAt), true) : ""}`} actions={<Button onClick={() => router.push("/settings")}>Import a new file</Button>} />
      <PageBody>
        <Card className="mb-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[13.5px] font-semibold"><ShieldCheck size={15} className="text-accent" />Classification quality</p>
              <p className="mt-1 text-[12.5px] text-muted">
                {classified.toLocaleString()} of {people.length.toLocaleString()} connections have a role ({Math.round((classified / Math.max(1, people.length)) * 100)}%), and {specific.toLocaleString()} are high-confidence or set by you.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="green">{people.filter((p) => p.classSource === "auto" && p.confidence >= 80).length.toLocaleString()} confident</Pill>
              <Pill tone="blue">{people.filter((p) => p.classSource === "auto" && p.confidence >= 60 && p.confidence < 80).length.toLocaleString()} likely</Pill>
              <Pill tone="amber">{people.filter((p) => p.needsReview).length.toLocaleString()} job titles unclear</Pill>
              <Pill tone="teal">{people.filter((p) => p.classSource !== "auto").length.toLocaleString()} yours</Pill>
            </div>
          </div>
          <div className="mt-3">
            <Meter value={(specific / Math.max(1, people.length)) * 100} tone="teal" />
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HEALTH_ORDER.map((issue) => (
            <button
              key={issue}
              type="button"
              onClick={() => counts[issue] && go(issue)}
              disabled={!counts[issue]}
              className="group rounded-xl border border-line bg-panel p-4 text-left transition enabled:hover:border-line-strong enabled:hover:shadow-pop disabled:opacity-60"
            >
              <span className="flex items-center justify-between">
                <span className="text-[13px] font-medium">{HEALTH_LABELS[issue]}</span>
                {counts[issue] ? <ArrowRight size={14} className="text-faint transition group-hover:translate-x-0.5 group-hover:text-accent" /> : null}
              </span>
              <span className="tabular mt-2 block text-[22px] font-semibold leading-none">{counts[issue].toLocaleString()}</span>
              <span className="mt-1.5 block text-[11.5px] text-muted">{DESCRIPTIONS[issue]}</span>
            </button>
          ))}
        </div>

        <Card className="mt-4">
          <CardTitle hint="Rules you taught it by correcting a classification" action={<Button size="sm" onClick={() => router.push("/settings")}>Manage rules</Button>}>
            Learned rules ({settings.rules.length})
          </CardTitle>
          <div className="p-4 pt-2 text-[12.5px] text-muted">
            {settings.rules.length
              ? `Applied automatically to every connection with a matching title, including after you import a new file.`
              : "When you correct someone's role, you are offered to remember it for everyone with the same job title."}
          </div>
        </Card>
      </PageBody>
    </>
  );
}
