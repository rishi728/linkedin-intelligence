// Dates are stored as local "YYYY-MM-DD" strings so "today" never shifts with time zones.

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayISO(now = new Date()): string {
  return toISODate(now);
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseISODate(toIso).getTime() - parseISODate(fromIso).getTime()) / 86_400_000);
}

export type DueBucket = "overdue" | "today" | "tomorrow" | "week" | "later";

export function dueBucket(iso: string, today = todayISO()): DueBucket {
  const diff = daysBetween(today, iso);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff <= 7) return "week";
  return "later";
}

const short = new Intl.DateTimeFormat("en", { day: "numeric", month: "short" });
const long = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

export function formatDate(value: string | Date | null | undefined, withYear = false): string {
  if (!value) return "";
  const d = typeof value === "string" ? parseISODate(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return (withYear || d.getFullYear() !== new Date().getFullYear() ? long : short).format(d);
}

export function relativeDue(iso: string, today = todayISO()): string {
  const diff = daysBetween(today, iso);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${-diff} days overdue`;
  if (diff <= 7) return `In ${diff} days`;
  return formatDate(iso);
}
