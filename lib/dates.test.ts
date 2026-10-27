import { describe, it, expect } from "vitest";
import {
  addDays,
  eachDay,
  monthRange,
  toDateString,
  weekdayIndex,
  weekdayShort,
  weekRange,
} from "./dates";

describe("toDateString", () => {
  it("formats a local date as YYYY-MM-DD with zero padding", () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("weekdayShort", () => {
  it("uses Vietnamese short names, CN for Sunday", () => {
    expect(weekdayShort("2026-10-25")).toBe("CN");
    expect(weekdayShort("2026-10-26")).toBe("T2");
    expect(weekdayShort("2026-10-27")).toBe("T3");
    expect(weekdayShort("2026-10-31")).toBe("T7");
  });
});

describe("weekdayIndex", () => {
  it("is 0 for Monday and 6 for Sunday", () => {
    expect(weekdayIndex("2026-10-26")).toBe(0);
    expect(weekdayIndex("2026-10-25")).toBe(6);
  });
});

describe("weekRange", () => {
  it("returns Monday through Sunday containing the anchor", () => {
    expect(weekRange("2026-10-27")).toEqual({ start: "2026-10-26", end: "2026-11-01" });
  });
  it("treats Sunday as the last day of its week", () => {
    expect(weekRange("2026-10-25")).toEqual({ start: "2026-10-19", end: "2026-10-25" });
  });
});

describe("monthRange", () => {
  it("returns first and last day of the anchor's month", () => {
    expect(monthRange("2026-02-10")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(monthRange("2028-02-10")).toEqual({ start: "2028-02-01", end: "2028-02-29" });
  });
});

describe("eachDay", () => {
  it("lists every day inclusive", () => {
    expect(eachDay("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });
});
