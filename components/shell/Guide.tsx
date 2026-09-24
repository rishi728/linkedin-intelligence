"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { TOUR_MAP } from "@/lib/guide";
import { Button, cx } from "@/components/ui";
import { Mascot } from "@/components/shell/Mascot";
import { useWorkspace } from "@/components/workspace/store";

/**
 * Pip appears once per page, the first time you open it, and then never again
 * unless you ask. Deliberately a corner card rather than a modal: the page stays
 * usable and readable behind it while you read what it does.
 */
export function Guide() {
  const { settings, updateSettings } = useWorkspace();
  // Routes are exported with a trailing slash, so /home arrives as "/home/".
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const [step, setStep] = useState(0);
  const [pageKey, setPageKey] = useState(pathname);
  const [dismissed, setDismissed] = useState(false);

  // Restart at the first step whenever the page changes.
  if (pageKey !== pathname) {
    setPageKey(pathname);
    setStep(0);
    setDismissed(false);
  }

  const tour = TOUR_MAP.get(pathname);
  const seen = settings.toursSeen ?? [];
  if (!tour || dismissed || seen.includes(tour.key)) return null;

  const current = tour.steps[step];
  const last = step === tour.steps.length - 1;

  const finish = () => {
    setDismissed(true);
    updateSettings((s) => ({ ...s, toursSeen: [...(s.toursSeen ?? []), tour.key] }));
  };

  return (
    <aside
      role="dialog"
      aria-label="Guide"
      className="anim-rise fixed bottom-4 left-4 z-40 w-[330px] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-panel p-4 shadow-float"
    >
      <button
        type="button"
        aria-label="Close the guide"
        onClick={finish}
        className="absolute right-2.5 top-2.5 text-faint transition hover:text-ink"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3">
        <Mascot size={40} className="shrink-0 text-accent" />
        <div className="min-w-0 pr-4">
          <p className="text-[13.5px] font-semibold tracking-tight">{current.title}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{current.body}</p>
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-2">
        {tour.steps.length > 1 ? (
          <span className="flex items-center gap-1" aria-label={`Step ${step + 1} of ${tour.steps.length}`}>
            {tour.steps.map((s, i) => (
              <span
                key={s.title}
                className={cx("h-1.5 rounded-full transition-all", i === step ? "w-4 bg-accent" : "w-1.5 bg-line-strong")}
              />
            ))}
          </span>
        ) : null}

        <span className="ml-auto flex items-center gap-1.5">
          {step > 0 ? (
            <Button size="sm" variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={finish}>Skip</Button>
          )}
          <Button size="sm" variant="primary" onClick={() => (last ? finish() : setStep((s) => s + 1))}>
            {last ? "Got it" : "Next"}
          </Button>
        </span>
      </div>
    </aside>
  );
}
