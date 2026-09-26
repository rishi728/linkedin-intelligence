"use client";

import { useMemo, useState } from "react";
import { bucketLabel } from "@/lib/knowledge/roles";
import { SECTOR_LABEL, type SectorId } from "@/lib/knowledge/sectors";
import type { Filters, Person } from "@/lib/workspace/types";
import { cx } from "@/components/ui";

/**
 * What the network is made of, drawn from the connections themselves.
 *
 * Every slice and every bar is a real count and opens exactly those people, so
 * nothing here is decoration: it is the same numbers the People page will show.
 */

/** Enough hues to tell slices apart, taken from the palette the app already uses. */
const HUES = [
  "var(--t-teal)", "var(--t-blue)", "var(--t-violet)", "var(--t-green)",
  "var(--t-amber)", "var(--t-orange)", "var(--t-slate)", "var(--t-red)",
];

interface Slice {
  key: string;
  label: string;
  count: number;
  filters: Filters;
}

/** One arc of the donut, as an SVG path. */
function arc(cx0: number, cy: number, r: number, thickness: number, from: number, to: number): string {
  const p = (angle: number, radius: number) => {
    const a = (angle - 90) * (Math.PI / 180);
    return [cx0 + radius * Math.cos(a), cy + radius * Math.sin(a)];
  };
  const inner = r - thickness;
  const [x1, y1] = p(from, r);
  const [x2, y2] = p(to, r);
  const [x3, y3] = p(to, inner);
  const [x4, y4] = p(from, inner);
  const big = to - from > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${big} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${big} 0 ${x4} ${y4} Z`;
}

function Donut({ slices, total, onPick }: { slices: Slice[]; total: number; onPick: (s: Slice) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const active = slices.find((s) => s.key === hover) ?? null;

  const arcs = useMemo(() => {
    const out: Array<{ s: Slice; path: string; hue: string }> = [];
    let angle = 0;
    for (const [i, s] of slices.entries()) {
      const sweep = (s.count / total) * 360;
      out.push({ s, path: arc(80, 80, 76, 26, angle + 0.6, angle + sweep - 0.6), hue: HUES[i % HUES.length] });
      angle += sweep;
    }
    return out;
  }, [slices, total]);

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 160 160" className="size-[160px] shrink-0" role="img" aria-label="Your network by role area">
        {arcs.map(({ s, path, hue }) => (
          <path
            key={s.key}
            d={path}
            fill={hue}
            opacity={hover && hover !== s.key ? 0.3 : 1}
            className="cursor-pointer transition-opacity duration-200"
            onMouseEnter={() => setHover(s.key)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onPick(s)}
          >
            <title>{`${s.label}: ${s.count.toLocaleString()}`}</title>
          </path>
        ))}
        <text x="80" y="76" textAnchor="middle" className="tabular fill-[var(--ink)] text-[21px] font-semibold">
          {(active ? active.count : total).toLocaleString()}
        </text>
        <text x="80" y="93" textAnchor="middle" className="fill-[var(--muted)] text-[9px] uppercase tracking-[0.1em]">
          {active ? "in this area" : "classified"}
        </text>
      </svg>

      <ul className="min-w-0 flex-1 space-y-1">
        {arcs.map(({ s, hue }) => (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => onPick(s)}
              onMouseEnter={() => setHover(s.key)}
              onMouseLeave={() => setHover(null)}
              className={cx(
                "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition duration-200 hover:bg-hover",
                hover === s.key && "bg-hover",
              )}
            >
              <span aria-hidden className="size-2 shrink-0 rounded-[3px]" style={{ background: hue }} />
              <span className="min-w-0 flex-1 truncate text-[12.5px]">{s.label}</span>
              <span className="tabular shrink-0 text-[12px] text-muted">{s.count.toLocaleString()}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bars({ rows, max, onPick }: { rows: Slice[]; max: number; onPick: (s: Slice) => void }) {
  return (
    <ul className="space-y-1.5">
      {rows.map((s) => (
        <li key={s.key}>
          <button
            type="button"
            onClick={() => onPick(s)}
            className="group block w-full rounded-md px-1.5 py-1 text-left transition duration-200 hover:bg-hover"
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[12.5px] group-hover:text-accent">{s.label}</span>
              <span className="tabular shrink-0 text-[12px] text-muted">{s.count.toLocaleString()}</span>
            </span>
            <span aria-hidden className="mt-1 block h-1.5 rounded-full bg-line">
              <span
                className="anim-bar block h-full rounded-full bg-accent"
                style={{ width: `${Math.max(3, (s.count / max) * 100)}%` }}
              />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function NetworkShape({ people, onExplore }: { people: Person[]; onExplore: (f: Filters) => void }) {
  const areas = useMemo<Slice[]>(() => {
    const m = new Map<string, number>();
    for (const p of people) if (p.bucket) m.set(p.bucket, (m.get(p.bucket) ?? 0) + 1);
    const sorted = [...m.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 7).map(([id, count]) => ({
      key: id,
      label: bucketLabel(id),
      count,
      filters: { buckets: [id] } as Filters,
    }));
    const rest = sorted.slice(7).reduce((n, [, c]) => n + c, 0);
    if (rest > 0) {
      top.push({
        key: "rest",
        label: "Everything else",
        count: rest,
        filters: { buckets: sorted.slice(7).map(([id]) => id) } as Filters,
      });
    }
    return top;
  }, [people]);

  const sectors = useMemo<Slice[]>(() => {
    const m = new Map<string, number>();
    for (const p of people) if (p.sector) m.set(p.sector, (m.get(p.sector) ?? 0) + 1);
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, count]) => ({
        key: id,
        label: SECTOR_LABEL[id as SectorId] ?? id,
        count,
        filters: { sectors: [id] } as Filters,
      }));
  }, [people]);

  const classified = areas.reduce((n, a) => n + a.count, 0);
  if (!classified) return null;

  const pick = (s: Slice) => onExplore(s.filters);

  return (
    <section className="anim-rise mt-12 grid gap-8 border-t border-line pt-8 lg:grid-cols-[1.15fr_1fr]">
      <div>
        <h2 className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">What they do</h2>
        <p className="mb-4 mt-1 text-[12.5px] text-muted">
          Click any area to open those people. {(people.length - classified).toLocaleString()} more have a job title
          that names no occupation.
        </p>
        <Donut slices={areas} total={classified} onPick={pick} />
      </div>

      {sectors.length ? (
        <div>
          <h2 className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">Where they work</h2>
          <p className="mb-4 mt-1 text-[12.5px] text-muted">
            Read from the employer on each connection, never guessed.
          </p>
          <Bars rows={sectors} max={sectors[0].count} onPick={pick} />
        </div>
      ) : null}
    </section>
  );
}
