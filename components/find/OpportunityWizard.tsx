"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { DOMAINS } from "@/lib/roles";
import { functionLabel } from "@/lib/intelligence";
import { OPPORTUNITY_TYPES } from "@/lib/workspace/defaults";
import { applyFilters, AUDIENCES } from "@/lib/workspace/filters";
import type { AudienceId, Filters } from "@/lib/workspace/types";
import { Button, Checkbox, Dialog, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

const KEY_FUNCTIONS = [
  "supply-chain", "procurement", "logistics", "product-management", "management-consulting", "corporate-strategy",
  "business-operations", "software-engineering", "machine-learning", "data-science", "analytics", "investment-banking",
  "quant", "investing", "growth", "brand-marketing", "sales", "business-development", "talent-acquisition", "hr",
  "project-program", "category-marketplace", "academic-research", "clinical", "faculty",
];

function Chip({ active, onClick, children, hint }: { active: boolean; onClick: () => void; children: React.ReactNode; hint?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={cx(
        "rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition",
        active ? "border-accent bg-accent-soft text-accent" : "border-line bg-panel text-ink-2 hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function OpportunityWizard() {
  const { people, settings, updateSettings, saveSegment } = useWorkspace();
  const { wizardOpen, openWizard, setPeopleFilters, toast } = useUI();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [types, setTypes] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [functions, setFunctions] = useState<string[]>([]);
  const [audiences, setAudiences] = useState<AudienceId[]>([]);
  const [targetOnly, setTargetOnly] = useState(false);
  const [excludeContacted, setExcludeContacted] = useState(true);
  const [saveAsSegment, setSaveAsSegment] = useState(true);

  const toggle = <T extends string>(list: T[], set: (v: T[]) => void, value: T) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const filters = useMemo<Filters>(() => {
    const f: Filters = {};
    if (domains.length) f.buckets = domains;
    if (functions.length) f.sections = functions;
    if (audiences.length) f.audiences = audiences;
    if (targetOnly) f.targetOnly = true;
    if (excludeContacted) f.statuses = ["not_contacted"];
    return f;
  }, [domains, functions, audiences, targetOnly, excludeContacted]);

  const matches = useMemo(() => applyFilters(people, filters, settings).length, [people, filters, settings]);
  const segmentName = [types[0] ?? "Outreach", domains.length ? DOMAINS.find((d) => d.id === domains[0])?.label : functions.length ? functionLabel(functions[0]) : null].filter(Boolean).join(" · ");

  const finish = () => {
    updateSettings((s) => ({
      ...s,
      goals: {
        opportunityTypes: types,
        buckets: domains,
        sections: functions,
        audiences,
      },
    }));
    setPeopleFilters(filters);
    if (saveAsSegment && matches > 0) saveSegment(segmentName || "Shortlist", filters);
    openWizard(false);
    setStep(0);
    toast(`${matches.toLocaleString()} people match. Priorities updated from your goals.`);
    router.push("/people");
  };

  const steps = [
    {
      title: "What are you looking for?",
      hint: "This sets your goals, which drive priority across the app.",
      body: (
        <div className="flex flex-wrap gap-2">
          {OPPORTUNITY_TYPES.map((t) => (
            <Chip key={t} active={types.includes(t)} onClick={() => toggle(types, setTypes, t)}>{t}</Chip>
          ))}
        </div>
      ),
    },
    {
      title: "Which area?",
      hint: "Pick the domains, and optionally narrow to specific functions.",
      body: (
        <>
          <div className="flex flex-wrap gap-2">
            {DOMAINS.filter((d) => d.id !== "unclassified").map((d) => (
              <Chip key={d.id} active={domains.includes(d.id)} onClick={() => toggle(domains, setDomains, d.id)}>{d.label}</Chip>
            ))}
          </div>
          <p className="mb-2 mt-4 text-[11px] font-medium uppercase tracking-wide text-muted">Specific functions (optional)</p>
          <div className="flex flex-wrap gap-2">
            {KEY_FUNCTIONS.map((f) => (
              <Chip key={f} active={functions.includes(f)} onClick={() => toggle(functions, setFunctions, f)}>{functionLabel(f)}</Chip>
            ))}
          </div>
        </>
      ),
    },
    {
      title: "Who do you want to reach?",
      hint: "Leave empty to include everyone at any level.",
      body: (
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((a) => (
            <Chip key={a.id} active={audiences.includes(a.id)} onClick={() => toggle(audiences, setAudiences, a.id)} hint={a.hint}>
              {a.label}
            </Chip>
          ))}
        </div>
      ),
    },
    {
      title: "Anything else?",
      hint: "Final touches before we build the shortlist.",
      body: (
        <div className="space-y-2.5">
          <Checkbox
            checked={targetOnly}
            onChange={setTargetOnly}
            label={settings.targetCompanies.length ? `Only my ${settings.targetCompanies.length} target companies` : "Only target companies (add some in Settings first)"}
          />
          <Checkbox checked={excludeContacted} onChange={setExcludeContacted} label="Only people I haven't contacted yet" />
          <Checkbox checked={saveAsSegment} onChange={setSaveAsSegment} label={`Save this as a segment: “${segmentName || "Shortlist"}”`} />
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <Dialog
      open={wizardOpen}
      onClose={() => openWizard(false)}
      title={current.title}
      subtitle={current.hint}
      width={720}
      footer={
        <>
          <span className="mr-auto text-[12.5px] text-muted">
            <Sparkles size={12} className="mr-1 inline text-accent" />
            {matches.toLocaleString()} connections match so far
          </span>
          {step > 0 ? <Button icon={ArrowLeft} onClick={() => setStep(step - 1)}>Back</Button> : null}
          {step < steps.length - 1 ? (
            <Button variant="primary" icon={ArrowRight} onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button variant="primary" onClick={finish} disabled={matches === 0}>Show {matches.toLocaleString()} people</Button>
          )}
        </>
      }
    >
      <div className="min-h-[180px]">
        <div className="mb-4 flex gap-1.5">
          {steps.map((s, i) => (
            <span key={s.title} className={cx("h-1 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-subtle")} />
          ))}
        </div>
        {current.body}
      </div>
    </Dialog>
  );
}
