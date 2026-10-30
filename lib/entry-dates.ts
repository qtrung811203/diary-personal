import { isValidDateParam } from "./validation";

const DAY_MS = 24 * 60 * 60 * 1000;
// Furthest-ahead timezone (UTC+14): a "today" anywhere on Earth is at most
// this far past the server's UTC date.
const MAX_AHEAD_MS = 14 * 60 * 60 * 1000;

function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

// Not a day in the future for any timezone (the server can't know the
// client's, so it only blocks days that are future everywhere).
export function isNotFutureDate(date: string, nowMs: number): boolean {
  return isValidDateParam(date) && date <= utcDay(nowMs + MAX_AHEAD_MS);
}

// A client-supplied creation instant for a backdated entry: parseable, not in
// the future, and within a day of the chosen date (timezones shift the UTC
// date by up to ±1 day).
export function isPlausibleCreatedAt(iso: string, date: string, nowMs: number): boolean {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms) || ms > nowMs + 60_000) return false;
  const dayStart = Date.parse(`${date}T00:00:00Z`);
  return ms >= dayStart - DAY_MS && ms < dayStart + 2 * DAY_MS;
}

export function monthLabel(date: string): string {
  const [y, m] = date.split("-");
  return `Tháng ${Number(m)}, ${y}`;
}

// Entries are already sorted newest first, so same-month runs are adjacent.
export function groupByMonth<T extends { date: string }>(entries: T[]) {
  const groups: { label: string; items: T[] }[] = [];
  for (const e of entries) {
    const label = monthLabel(e.date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(e);
    else groups.push({ label, items: [e] });
  }
  return groups;
}
