import { describe, it, expect } from "vitest";
import {
  dailyMoods,
  dailyValence,
  groupDistribution,
  moodDistribution,
  onThisDay,
  summarize,
  weekdayBreakdown,
  writingTime,
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

describe("writingTime", () => {
  const VN = -420; // getTimezoneOffset() in Vietnam (UTC+7)

  it("picks the slot most entries were started in, in the user's local time", () => {
    // 16:00Z = 23:00 and 17:30Z = 00:30 in Vietnam -> night; 02:00Z = 09:00 -> morning.
    const entries = [e("2026-10-01", null, 10, "16:00"), e("2026-10-02", null, 10, "17:30"), e("2026-10-03", null, 10, "02:00")];
    expect(writingTime(entries, VN)).toEqual({ slot: "night", share: 67, peakHour: 23 });
  });

  it("ignores empty entries and returns null when nothing was written", () => {
    expect(writingTime([e("2026-10-01", null, 0, "16:00")], VN)).toBeNull();
    expect(writingTime([], VN)).toBeNull();
  });

  it("buckets hours at the slot edges", () => {
    const at = (h: number) => writingTime([e("2026-10-01", null, 10, `${String(h).padStart(2, "0")}:00`)], 0)?.slot;
    expect([4, 5, 11, 14, 18, 22].map(at)).toEqual(["night", "morning", "noon", "afternoon", "evening", "night"]);
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
