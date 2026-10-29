import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";
import { ensureMoods } from "@/lib/mood-store";
import { isValidDateParam } from "@/lib/validation";
import { addDays, eachDay, monthRange, weekRange } from "@/lib/dates";
import {
  computeStreaks,
  dailyMoods,
  dailyValence,
  groupDistribution,
  moodDistribution,
  onThisDay,
  summarize,
  weekdayBreakdown,
  type StatEntry,
} from "@/lib/stats";

const TRAILING_DAYS = 90;

// ?view=week|month&date=YYYY-MM-DD (any day inside the period shown)
// &today=YYYY-MM-DD (the user's own local today — streaks / "on this day").
export async function GET(request: Request) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;
  const userId = guard.userId;

  const url = new URL(request.url);
  const view = url.searchParams.get("view") === "week" ? "week" : "month";
  const today = url.searchParams.get("today") ?? "";
  const date = url.searchParams.get("date") ?? today;
  if (!isValidDateParam(today) || !isValidDateParam(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const range = view === "week" ? weekRange(date) : monthRange(date);
  const days = eachDay(range.start, range.end);
  const trailingStart = addDays(today, -(TRAILING_DAYS - 1));

  const select = { date: true, createdAt: true, moodId: true, words: true } as const;
  const toStat = (rows: { date: string; createdAt: Date; moodId: string | null; words: number }[]): StatEntry[] =>
    rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));

  const [moodRows, periodRows, trailingRows, dateRows, sameDayRows] = await Promise.all([
    ensureMoods(userId),
    prisma.diaryEntry.findMany({
      where: { userId, date: { gte: range.start, lte: range.end } },
      select,
    }),
    prisma.diaryEntry.findMany({
      where: { userId, date: { gte: trailingStart, lte: today } },
      select,
    }),
    prisma.diaryEntry.findMany({ where: { userId }, select: { date: true } }),
    prisma.diaryEntry.findMany({
      where: { userId, date: { endsWith: today.slice(4) } },
      select: { id: true, date: true, title: true, preview: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const moods = moodRows.map((m) => ({
    id: m.id,
    name: m.name,
    icon: m.icon,
    group: m.group as "positive" | "neutral" | "anxious" | "sad" | "angry",
  }));
  const period = toStat(periodRows);

  return NextResponse.json({
    view,
    range,
    days,
    today,
    summary: summarize(period, moods),
    streaks: computeStreaks(dateRows.map((r) => r.date), today),
    dailyMoods: dailyMoods(period, moods),
    moodDistribution: moodDistribution(period, moods),
    groupDistribution: groupDistribution(period, moods),
    valence: dailyValence(period, moods, days),
    weekday: weekdayBreakdown(toStat(trailingRows), moods),
    onThisDay: onThisDay(sameDayRows, today).slice(0, 5),
  });
}
