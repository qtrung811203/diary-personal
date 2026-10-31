// Month arithmetic for the Kỷ niệm page. Months are "YYYY-MM", days "YYYY-MM-DD".

const pad = (n: number) => String(n).padStart(2, "0");
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  return { from: `${month}-01`, to: `${month}-${pad(daysIn(y, m))}` };
}

// Calendar cells for a month, weeks starting Monday; null = padding.
export function monthDays(month: string): (string | null)[] {
  const [y, m] = month.split("-").map(Number);
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= daysIn(y, m); d++) cells.push(`${month}-${pad(d)}`);
  return cells;
}

// The same calendar day in each of the previous `years` years (29 Feb only
// in leap years).
export function onThisDayDates(today: string, years: number): string[] {
  const [y, m, d] = today.split("-").map(Number);
  const out: string[] = [];
  for (let i = 1; i <= years; i++) {
    if (d <= daysIn(y - i, m)) out.push(`${y - i}-${pad(m)}-${pad(d)}`);
  }
  return out;
}

export function monthLabelOf(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `Tháng ${m}, ${y}`;
}

export const currentMonth = (now = new Date()) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

const WEEKDAYS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

// "Thứ sáu, 30 tháng 10, 2026"
export function longDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${d} tháng ${m}, ${y}`;
}

// "30 tháng 10"
export const shortDayLabel = (date: string) => {
  const [, m, d] = date.split("-").map(Number);
  return `${d} tháng ${m}`;
};
