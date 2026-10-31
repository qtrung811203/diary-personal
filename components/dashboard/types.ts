import type { MoodGroup } from "@/lib/moods";
import type { WritingSlot } from "@/lib/stats";

export type DMood = { id: string; name: string; icon: string; group: MoodGroup };

export type DashboardData = {
  view: "week" | "month";
  range: { start: string; end: string };
  days: string[];
  today: string;
  summary: { entriesCount: number; daysWritten: number; words: number; topMood: DMood | null };
  writingTime: { slot: WritingSlot; share: number; peakHour: number } | null;
  dailyMoods: Record<string, DMood>;
  moodDistribution: { mood: DMood; count: number }[];
  groupDistribution: Record<MoodGroup, number>;
  valence: { date: string; value: number | null }[];
  weekday: { total: number; counts: Record<MoodGroup, number>; topGroup: MoodGroup | null }[];
  onThisDay: { id: string; date: string; title: string; preview: string; yearsAgo: number }[];
};
