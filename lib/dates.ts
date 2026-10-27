// All dates are local "YYYY-MM-DD" strings (the user's own calendar day),
// never UTC-converted, so a day never shifts depending on timezone.

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateString(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = parseDateString(s);
  d.setDate(d.getDate() + n);
  return toDateString(d);
}

const SHORT_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function weekdayShort(s: string): string {
  return SHORT_NAMES[parseDateString(s).getDay()];
}

// 0 = Monday … 6 = Sunday (weeks start on T2).
export function weekdayIndex(s: string): number {
  return (parseDateString(s).getDay() + 6) % 7;
}

export function weekRange(anchor: string): { start: string; end: string } {
  const start = addDays(anchor, -weekdayIndex(anchor));
  return { start, end: addDays(start, 6) };
}

export function monthRange(anchor: string): { start: string; end: string } {
  const d = parseDateString(anchor);
  const start = toDateString(new Date(d.getFullYear(), d.getMonth(), 1));
  const end = toDateString(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  return { start, end };
}

export function eachDay(start: string, end: string): string[] {
  const days: string[] = [];
  for (let cur = start; cur <= end; cur = addDays(cur, 1)) days.push(cur);
  return days;
}
