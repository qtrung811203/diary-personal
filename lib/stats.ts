import { addDays, weekdayIndex } from "./dates";
import { MOOD_GROUPS, MOOD_GROUP_META, type MoodGroup } from "./moods";

export type StatMood = { id: string; name: string; icon: string; group: MoodGroup };
export type StatEntry = { date: string; createdAt: string; moodId: string | null; words: number };

const byId = (moods: StatMood[]) => new Map(moods.map((m) => [m.id, m]));

export function computeStreaks(dates: string[], today: string): { current: number; longest: number } {
  const days = [...new Set(dates)].sort();
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === addDays(days[i - 1], 1) ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  // The streak is still "current" if the last write was today or yesterday.
  const set = new Set(days);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

// One representative mood per day: the latest-created entry that has a mood.
export function dailyMoods(entries: StatEntry[], moods: StatMood[]): Record<string, StatMood> {
  const lookup = byId(moods);
  const latest: Record<string, { at: string; mood: StatMood }> = {};
  for (const en of entries) {
    const mood = en.moodId ? lookup.get(en.moodId) : undefined;
    if (!mood) continue;
    const prev = latest[en.date];
    if (!prev || en.createdAt > prev.at) latest[en.date] = { at: en.createdAt, mood };
  }
  return Object.fromEntries(Object.entries(latest).map(([d, v]) => [d, v.mood]));
}

export function moodDistribution(
  entries: StatEntry[],
  moods: StatMood[]
): { mood: StatMood; count: number }[] {
  const lookup = byId(moods);
  const counts = new Map<string, number>();
  for (const en of entries) {
    if (en.moodId && lookup.has(en.moodId)) counts.set(en.moodId, (counts.get(en.moodId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ mood: lookup.get(id)!, count }))
    .sort((a, b) => b.count - a.count);
}

export function groupDistribution(entries: StatEntry[], moods: StatMood[]): Record<MoodGroup, number> {
  const out = Object.fromEntries(MOOD_GROUPS.map((g) => [g, 0])) as Record<MoodGroup, number>;
  const lookup = byId(moods);
  for (const en of entries) {
    const mood = en.moodId ? lookup.get(en.moodId) : undefined;
    if (mood) out[mood.group]++;
  }
  return out;
}

export function dailyValence(
  entries: StatEntry[],
  moods: StatMood[],
  days: string[]
): { date: string; value: number | null }[] {
  const lookup = byId(moods);
  const sums = new Map<string, { total: number; n: number }>();
  for (const en of entries) {
    const mood = en.moodId ? lookup.get(en.moodId) : undefined;
    if (!mood) continue;
    const s = sums.get(en.date) ?? { total: 0, n: 0 };
    s.total += MOOD_GROUP_META[mood.group].valence;
    s.n++;
    sums.set(en.date, s);
  }
  return days.map((date) => {
    const s = sums.get(date);
    return { date, value: s ? s.total / s.n : null };
  });
}

export function weekdayBreakdown(
  entries: StatEntry[],
  moods: StatMood[]
): { total: number; counts: Record<MoodGroup, number>; topGroup: MoodGroup | null }[] {
  const lookup = byId(moods);
  const rows = Array.from({ length: 7 }, () => ({
    total: 0,
    counts: Object.fromEntries(MOOD_GROUPS.map((g) => [g, 0])) as Record<MoodGroup, number>,
    topGroup: null as MoodGroup | null,
  }));
  for (const en of entries) {
    const mood = en.moodId ? lookup.get(en.moodId) : undefined;
    if (!mood) continue;
    const row = rows[weekdayIndex(en.date)];
    row.total++;
    row.counts[mood.group]++;
  }
  for (const row of rows) {
    let best: MoodGroup | null = null;
    for (const g of MOOD_GROUPS) {
      if (row.counts[g] > 0 && (best === null || row.counts[g] > row.counts[best])) best = g;
    }
    row.topGroup = best;
  }
  return rows;
}

export function summarize(entries: StatEntry[], moods: StatMood[]) {
  return {
    entriesCount: entries.length,
    daysWritten: new Set(entries.map((x) => x.date)).size,
    words: entries.reduce((sum, x) => sum + x.words, 0),
    topMood: moodDistribution(entries, moods)[0]?.mood ?? null,
  };
}

export function onThisDay<T extends { date: string }>(
  entries: T[],
  today: string
): (T & { yearsAgo: number })[] {
  const [ty, tm, td] = today.split("-");
  return entries
    .filter((x) => {
      const [y, m, d] = x.date.split("-");
      return m === tm && d === td && y < ty;
    })
    .map((x) => ({ ...x, yearsAgo: Number(ty) - Number(x.date.slice(0, 4)) }))
    .sort((a, b) => a.yearsAgo - b.yearsAgo);
}
