"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORY_LABEL, principlesFor, startIndex, type KnowledgeCategory } from "@/lib/knowledge";
import { cx } from "@/components/ui";

/**
 * One principle at a time, set like a margin note rather than a banner. It holds
 * no data about the user and makes no claim about anyone — it is craft, not output.
 */
export function Spark({
  categories,
  seed,
  title,
  className,
  compact = false,
}: {
  categories: KnowledgeCategory[];
  /** Keeps two Sparks on different pages from showing the same line. */
  seed: string;
  title?: string;
  className?: string;
  compact?: boolean;
}) {
  const pool = useMemo(() => principlesFor(categories), [categories]);
  const [offset, setOffset] = useState(0);
  const first = useMemo(() => startIndex(seed, pool.length), [seed, pool.length]);
  const index = ((first + offset) % pool.length + pool.length) % pool.length;
  const principle = pool[index];

  if (compact) {
    return (
      <p className={cx("text-[12.5px] leading-relaxed text-muted", className)}>
        <span className="text-ink-2">“{principle.quote}”</span>{" "}
        <span className="whitespace-nowrap text-[11px] uppercase tracking-wide text-faint">
          {CATEGORY_LABEL[principle.category]}
        </span>
      </p>
    );
  }

  return (
    <section
      aria-label={title ?? "Principle"}
      className={cx("anim-rise border-l-2 border-accent/50 pl-4", className)}
    >
      {title ? (
        <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">{title}</p>
      ) : null}

      <blockquote key={index} className="anim-fade">
        <p className="max-w-[46ch] text-[19px] font-medium leading-snug tracking-tight text-ink">
          “{principle.quote}”
        </p>
        <p className="mt-2 max-w-[54ch] text-[13px] leading-relaxed text-muted">{principle.insight}</p>
      </blockquote>

      <div className="mt-3 flex items-center gap-3">
        <p className="text-[11px] uppercase tracking-wide text-faint">
          {CATEGORY_LABEL[principle.category]} · {String(index + 1).padStart(2, "0")}
        </p>
        <span className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Previous principle"
            onClick={() => setOffset((o) => o - 1)}
            className="grid size-6 place-items-center rounded-md text-faint transition hover:bg-hover hover:text-ink"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            aria-label="Next principle"
            onClick={() => setOffset((o) => o + 1)}
            className="grid size-6 place-items-center rounded-md text-faint transition hover:bg-hover hover:text-ink"
          >
            <ChevronRight size={14} />
          </button>
        </span>
      </div>
    </section>
  );
}
