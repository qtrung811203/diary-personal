import { describe, it, expect } from "vitest";
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
  type StatMood,
} from "./stats";

const moods: StatMood[] = [
  { id: "happy", name: "Hạnh phúc", icon: "🥰", group: "positive" },
  { id: "ok", name: "Bình thường", icon: "🙂", group: "neutral" },
  { id: "stress", name: "Căng thẳng", icon: "🤯", group: "anxious" },
  { id: "sad", name: "Buồn bã", icon: "😢", group: "sad" },
];

const e = (date: string, moodId: string | null, words = 10, hhmm = "10:00"): StatEntry => ({
  date,
  createdAt: `${date}T${hhmm}:00.000Z`,
  moodId,
  words,
});

describe("computeStreaks", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreaks(["2026-10-25", "2026-10-26", "2026-10-27"], "2026-10-27")).toEqual({
      current: 3,
      longest: 3,
    });
  });

  it("keeps the streak alive when today isn't written yet but yesterday was", () => {
    expect(computeStreaks(["2026-10-25", "2026-10-26"], "2026-10-27").current).toBe(2);
  });

  it("resets the current streak after a gap, and tracks the longest separately", () => {
    const dates = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-26"];
    expect(computeStreaks(dates, "2026-10-27")).toEqual({ current: 1, longest: 3 });
  });

  it("ignores duplicate dates (several entries in one day) and handles none", () => {
    expect(computeStreaks(["2026-10-27", "2026-10-27"], "2026-10-27")).toEqual({ current: 1, longest: 1 });
    expect(computeStreaks([], "2026-10-27")).toEqual({ current: 0, longest: 0 });
  });
});

describe("dailyMoods", () => {
  it("uses the latest entry that has a mood for each day", () => {
    const result = dailyMoods(
      [e("2026-10-27", "sad", 1, "08:00"), e("2026-10-27", "happy", 1, "20:00"), e("2026-10-27", null, 1, "23:00")],
      moods
    );
    expect(result["2026-10-27"].id).toBe("happy");
  });

  it("omits days without any mood", () => {
    expect(dailyMoods([e("2026-10-27", null)], moods)).toEqual({});
  });
});

describe("moodDistribution", () => {
  it("counts entries per mood, most frequent first, skipping unknown/no mood", () => {
    const dist = moodDistribution(
      [e("2026-10-26", "ok"), e("2026-10-27", "happy"), e("2026-10-28", "happy"), e("2026-10-29", null), e("2026-10-30", "gone")],
      moods
    );
    expect(dist.map((d) => [d.mood.id, d.count])).toEqual([
      ["happy", 2],
      ["ok", 1],
    ]);
  });
});

describe("groupDistribution", () => {
  it("counts entries per mood group, with zeros for absent groups", () => {
    expect(groupDistribution([e("2026-10-26", "happy"), e("2026-10-27", "ok")], moods)).toEqual({
      positive: 1,
      neutral: 1,
      anxious: 0,
      sad: 0,
      angry: 0,
    });
  });
});

describe("dailyValence", () => {
  it("averages valence per day and returns null for days with no mood", () => {
    const out = dailyValence(
      [e("2026-10-26", "happy"), e("2026-10-26", "stress"), e("2026-10-27", "ok")],
      moods,
      ["2026-10-26", "2026-10-27", "2026-10-28"]
    );
    // positive = +2, anxious = -1 -> avg 0.5; neutral = 0
    expect(out).toEqual([
      { date: "2026-10-26", value: 0.5 },
      { date: "2026-10-27", value: 0 },
      { date: "2026-10-28", value: null },
    ]);
  });
});

describe("weekdayBreakdown", () => {
  it("buckets by weekday (T2 first) and reports the top group", () => {
    // 2026-10-26 is a Monday, 2026-10-27 a Tuesday
    const out = weekdayBreakdown(
      [e("2026-10-26", "stress"), e("2026-11-02", "stress"), e("2026-11-09", "happy"), e("2026-10-27", "happy")],
      moods
    );
    expect(out).toHaveLength(7);
    expect(out[0].total).toBe(3);
    expect(out[0].topGroup).toBe("anxious");
    expect(out[1].topGroup).toBe("positive");
    expect(out[2].total).toBe(0);
    expect(out[2].topGroup).toBeNull();
  });
});

describe("summarize", () => {
  it("totals entries, distinct days, words and the top mood", () => {
    const s = summarize(
      [e("2026-10-26", "happy", 5), e("2026-10-26", "happy", 7), e("2026-10-27", "ok", 3)],
      moods
    );
    expect(s.entriesCount).toBe(3);
    expect(s.daysWritten).toBe(2);
    expect(s.words).toBe(15);
    expect(s.topMood?.id).toBe("happy");
  });

  it("has no top mood when nothing has a mood", () => {
    expect(summarize([e("2026-10-26", null)], moods).topMood).toBeNull();
  });
});

describe("onThisDay", () => {
  it("returns earlier years' entries from the same month and day, newest year first", () => {
    const out = onThisDay(
      [
        { id: "a", date: "2025-10-27", title: "Năm ngoái" },
        { id: "b", date: "2024-10-27", title: "Hai năm trước" },
        { id: "c", date: "2026-10-27", title: "Hôm nay" },
        { id: "d", date: "2025-10-28", title: "Ngày khác" },
      ],
      "2026-10-27"
    );
    expect(out.map((x) => x.id)).toEqual(["a", "b"]);
    expect(out[0].yearsAgo).toBe(1);
    expect(out[1].yearsAgo).toBe(2);
  });
});
