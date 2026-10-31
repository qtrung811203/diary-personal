import { describe, expect, it } from "vitest";
import { longDateLabel, monthDays, monthLabelOf, monthRange, onThisDayDates, shiftMonth, shortDayLabel } from "./memories";

describe("shiftMonth", () => {
  it("moves across year boundaries", () => {
    expect(shiftMonth("2026-10", 1)).toBe("2026-11");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-03", -14)).toBe("2025-01");
  });
});

describe("monthRange", () => {
  it("gives the first and last day as YYYY-MM-DD", () => {
    expect(monthRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(monthRange("2024-02")).toEqual({ from: "2024-02-01", to: "2024-02-29" });
    expect(monthRange("2026-10")).toEqual({ from: "2026-10-01", to: "2026-10-31" });
  });
});

describe("monthDays", () => {
  it("pads the grid so weeks start on Monday", () => {
    // 1 Oct 2026 is a Thursday -> three blanks (Mon, Tue, Wed).
    const cells = monthDays("2026-10");
    expect(cells.slice(0, 4)).toEqual([null, null, null, "2026-10-01"]);
    expect(cells.filter(Boolean)).toHaveLength(31);
  });
});

describe("onThisDayDates", () => {
  it("lists the same day in earlier years", () => {
    expect(onThisDayDates("2026-10-31", 3)).toEqual(["2025-10-31", "2024-10-31", "2023-10-31"]);
  });
  it("skips 29 Feb in years that don't have it", () => {
    expect(onThisDayDates("2028-02-29", 4)).toEqual(["2024-02-29"]);
  });
});

describe("monthLabelOf", () => {
  it("formats in Vietnamese", () => {
    expect(monthLabelOf("2026-10")).toBe("Tháng 10, 2026");
  });
});

describe("day labels", () => {
  it("long and short Vietnamese labels", () => {
    expect(longDateLabel("2026-10-30")).toBe("Thứ sáu, 30 tháng 10, 2026");
    expect(longDateLabel("2026-11-01")).toBe("Chủ nhật, 1 tháng 11, 2026");
    expect(shortDayLabel("2026-10-09")).toBe("9 tháng 10");
  });
});
