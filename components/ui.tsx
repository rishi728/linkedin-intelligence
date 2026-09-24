"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";
import type { Tone } from "@/lib/workspace/types";

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

type IconType = React.ComponentType<{ size?: number | string; className?: string }>;

// ---------------------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover border-transparent",
  secondary: "bg-panel text-ink border-line hover:bg-hover",
  ghost: "bg-transparent text-ink-2 border-transparent hover:bg-hover hover:text-ink",
  subtle: "bg-subtle text-ink border-transparent hover:bg-hover",
  danger: "bg-transparent text-[var(--t-red)] border-line hover:bg-[var(--t-red-bg)]",
};

export function Button({
  variant = "secondary", size = "md", icon: Icon, className, children, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md"; icon?: IconType }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border font-medium transition disabled:pointer-events-none disabled:opacity-45",
        size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[13px]",
        BUTTON_STYLES[variant],
        className,
      )}
      {...props}
    >
      {Icon ? <Icon size={size === "sm" ? 13 : 14} /> : null}
      {children}
    </button>
  );
}

export function IconButton({ label, icon: Icon, className, size = 14, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: IconType; size?: number }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cx("inline-flex size-7 items-center justify-center rounded-lg text-muted transition hover:bg-hover hover:text-ink disabled:opacity-40", className)}
      {...props}
    >
      <Icon size={size} />
    </button>
  );
}

export function Pill({ tone = "gray", children, className, title }: { tone?: Tone; children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cx("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4", `tone-${tone}`, className)}>
      {children}
    </span>
  );
}

export function Dot({ tone = "gray", className }: { tone?: Tone; className?: string }) {
  return <span className={cx("inline-block size-1.5 shrink-0 rounded-full", `dot-${tone}`, className)} />;
}

const AVATAR_TONES: Tone[] = ["blue", "violet", "teal", "green", "amber", "slate", "orange", "gray"];

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return (
    <span
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", `tone-${AVATAR_TONES[hash % AVATAR_TONES.length]}`)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

// ---------------------------------------------------------------------------

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

const CONTROL = "w-full rounded-lg border border-line bg-panel px-2.5 text-[13px] text-ink outline-none transition placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-[var(--ring)]";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(CONTROL, "h-8", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(CONTROL, "min-h-16 resize-y py-1.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cx(CONTROL, "h-8 appearance-none pr-7", className)} {...props}>
        {children}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function Checkbox({ checked, onChange, label, indeterminate }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; indeterminate?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[13px]">
      <input ref={ref} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-3.5 accent-[var(--accent)]" />
      {label}
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: ReactNode; title?: string }> }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-panel p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cx(
            "inline-flex h-6 items-center gap-1 rounded-md px-2 text-[12px] font-medium transition",
            value === o.value ? "bg-accent-soft text-accent" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx("inline-flex h-[18px] w-8 shrink-0 items-center rounded-full border transition", checked ? "border-accent bg-accent" : "border-line bg-subtle")}
    >
      <span className={cx("size-3.5 rounded-full bg-panel shadow-pop transition", checked ? "translate-x-[15px]" : "translate-x-0.5")} />
    </button>
  );
}

// ---------------------------------------------------------------------------

/**
 * The panel is rendered into <body> and positioned against the trigger, so a menu
 * inside a scrolling table or a virtualised row is never clipped by its parent.
 */
export function Menu({ trigger, children, align = "left", width = 220 }: { trigger: (props: { open: boolean; toggle: () => void }) => ReactNode; children: (close: () => void) => ReactNode; align?: "left" | "right"; width?: number }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    const below = window.innerHeight - r.bottom - margin;
    const above = r.top - margin;
    const dropUp = below < 200 && above > below;
    const left = align === "right" ? r.right - width : r.left;
    setPos({
      top: dropUp ? Math.max(margin, r.top - Math.min(above, 320) - 4) : r.bottom + 4,
      left: Math.max(margin, Math.min(left, window.innerWidth - width - margin)),
      maxHeight: Math.max(160, Math.min(dropUp ? above : below, 320)),
    });
  }, [align, width]);

  // Measured after opening, before paint, so the panel never flashes in the wrong place.
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!anchorRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const reposition = () => place();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, place]);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <div ref={anchorRef} className="relative">
      {trigger({ open, toggle })}
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="anim-pop scroll-thin fixed z-[60] overflow-auto rounded-xl border border-line bg-panel p-1 shadow-float"
              style={{ top: pos.top, left: pos.left, width, maxHeight: pos.maxHeight }}
            >
              {children(() => setOpen(false))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function MenuItem({ children, onClick, icon: Icon, danger, selected, disabled }: { children: ReactNode; onClick?: () => void; icon?: IconType; danger?: boolean; selected?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition disabled:opacity-40",
        danger ? "text-[var(--t-red)] hover:bg-[var(--t-red-bg)]" : "text-ink hover:bg-hover",
      )}
    >
      {Icon ? <Icon size={14} /> : null}
      <span className="flex-1 truncate">{children}</span>
      {selected ? <Check size={13} className="text-accent" /> : null}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted">{children}</p>;
}

// ---------------------------------------------------------------------------

export function Dialog({ open, onClose, title, subtitle, children, footer, width = 720 }: { open: boolean; onClose: () => void; title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-4 py-[6vh] backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="anim-pop w-full rounded-2xl border border-line bg-panel shadow-float" style={{ maxWidth: width }}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p> : null}
          </div>
          <IconButton label="Close" icon={X} onClick={onClose} />
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Sheet({ open, onClose, children, width = 560 }: { open: boolean; onClose: () => void; children: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="anim-sheet flex h-full w-full flex-col border-l border-line bg-panel shadow-float" style={{ maxWidth: width }}>
        {children}
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function EmptyState({ icon: Icon, title, body, action }: { icon?: IconType; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-12 text-center">
      {Icon ? <Icon size={20} className="mb-3 text-faint" /> : null}
      <p className="text-[14px] font-medium">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-[12.5px] text-muted">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-xl border border-line bg-panel", className)}>{children}</div>;
}

export function CardTitle({ children, hint, action }: { children: ReactNode; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-3.5">
      <div>
        <h3 className="text-[13.5px] font-semibold tracking-tight">{children}</h3>
        {hint ? <p className="mt-0.5 text-[12px] text-muted">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Meter({ value, tone = "teal" }: { value: number; tone?: Tone }) {
  return (
    <span className="inline-flex h-1.5 w-full overflow-hidden rounded-full bg-subtle">
      <span className={cx("h-full rounded-full", `dot-${tone}`)} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </span>
  );
}

export function BarRow({ label, value, max, onClick, suffix }: { label: string; value: number; max: number; onClick?: () => void; suffix?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="group grid w-full grid-cols-[minmax(0,1fr)_64px] items-center gap-3 rounded-lg px-2 py-1 text-left transition enabled:hover:bg-hover"
    >
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] text-ink-2 group-hover:text-ink">{label}</span>
        <span className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full bg-subtle">
          <span className="h-full rounded-full" style={{ width: `${Math.max(1.5, (value / Math.max(1, max)) * 100)}%`, background: "var(--bar)" }} />
        </span>
      </span>
      <span className="tabular text-right text-[12px] text-muted">{suffix ?? value.toLocaleString()}</span>
    </button>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-muted">
      <span className="size-3.5 animate-spin rounded-full border-2 border-line border-t-accent" />
      {label}
    </div>
  );
}
