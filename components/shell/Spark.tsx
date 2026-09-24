"use client";

import { useMemo, useState } from "react";
import { RotateCw } from "lucide-react";
import { CATEGORY_LABEL, principlesFor, type KnowledgeCategory } from "@/lib/knowledge";
import { cx } from "@/components/ui";

/**
 * One principle, set like a margin note. It holds no data about the user and makes
 * no claim about anyone — it is craft, not output. Which one you get is random per
 * mount, and the shuffle button never gives you the same line twice in a row.
 */
export function Spark({
  categories,
  className,
  compact = false,
}: {
  categories: KnowledgeCategory[];
  className?: string;
  compact?: boolean;
}) {
  const pool = useMemo(() => principlesFor(categories), [categories]);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * pool.length));

  const shuffle = () => {
    if (pool.length < 2) return;
    let next = index;
    while (next === index) next = Math.floor(Math.random() * pool.length);
    setIndex(next);
  };

  const principle = pool[index % pool.length];

  if (compact) {
    return (
      <p className={cx("text-[12.5px] leading-relaxed text-muted", className)}>
        <span className="text-ink-2">{principle.quote}</span>{" "}
        <span className="whitespace-nowrap text-[11px] uppercase tracking-wide text-faint">
          {CATEGORY_LABEL[principle.category]}
        </span>
      </p>
    );
  }

  return (
    <section aria-label="Networking principle" className={cx("group border-l-2 border-accent/40 pl-4", className)}>
      <p key={index} className="anim-fade max-w-[50ch] text-[16px] font-medium leading-snug tracking-tight text-ink">
        {principle.quote}
      </p>
      <p key={`i-${index}`} className="anim-fade mt-1.5 max-w-[56ch] text-[12.5px] leading-relaxed text-muted">
        {principle.insight}
      </p>
      <p className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-faint">
        {CATEGORY_LABEL[principle.category]}
        <button
          type="button"
          aria-label="Show another principle"
          onClick={shuffle}
          className="opacity-0 transition hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
        >
          <RotateCw size={12} />
        </button>
      </p>
    </section>
  );
}
