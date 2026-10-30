import { describe, expect, it } from "vitest";
import { groupByMonth, isNotFutureDate, isPlausibleCreatedAt } from "./entry-dates";

const now = Date.parse("2026-10-30T10:00:00Z");

describe("isNotFutureDate", () => {
  it("accepts today and past days", () => {
    expect(isNotFutureDate("2026-10-30", now)).toBe(true);
    expect(isNotFutureDate("2026-10-29", now)).toBe(true);
    expect(isNotFutureDate("2020-01-01", now)).toBe(true);
  });
  it("accepts the next calendar day only within the +14h timezone window", () => {
    // 10:00 UTC is already 2026-10-31 at UTC+14? No: 00:00 next day for UTC+14 starts at 10:00Z.
    expect(isNotFutureDate("2026-10-31", now)).toBe(true);
    expect(isNotFutureDate("2026-10-31", Date.parse("2026-10-30T09:00:00Z"))).toBe(false);
  });
  it("rejects later days and malformed dates", () => {
    expect(isNotFutureDate("2026-11-02", now)).toBe(false);
    expect(isNotFutureDate("2026-02-31", now)).toBe(false);
    expect(isNotFutureDate("nope", now)).toBe(false);
  });
});

describe("isPlausibleCreatedAt", () => {
  it("accepts an instant near the chosen day", () => {
    expect(isPlausibleCreatedAt("2026-10-27T03:30:00.000Z", "2026-10-27", now)).toBe(true);
    expect(isPlausibleCreatedAt("2026-10-26T22:30:00.000Z", "2026-10-27", now)).toBe(true); // UTC+7 early morning
  });
  it("rejects garbage, other days and the future", () => {
    expect(isPlausibleCreatedAt("garbage", "2026-10-27", now)).toBe(false);
    expect(isPlausibleCreatedAt("2026-10-20T03:30:00.000Z", "2026-10-27", now)).toBe(false);
    expect(isPlausibleCreatedAt("2026-10-30T12:00:00.000Z", "2026-10-30", now)).toBe(false);
  });
});

describe("groupByMonth", () => {
  it("groups consecutive entries by month label", () => {
    const g = groupByMonth([{ date: "2026-10-29" }, { date: "2026-10-02" }, { date: "2026-09-30" }]);
    expect(g.map((x) => [x.label, x.items.length])).toEqual([
      ["Tháng 10, 2026", 2],
      ["Tháng 9, 2026", 1],
    ]);
  });
});
