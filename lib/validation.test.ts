import { describe, it, expect } from "vitest";
import { isValidDateParam } from "./validation";

describe("isValidDateParam", () => {
  it("accepts a real calendar date", () => {
    expect(isValidDateParam("2026-10-26")).toBe(true);
  });
  it("rejects an out-of-range month", () => {
    expect(isValidDateParam("2026-13-01")).toBe(false);
  });
  it("rejects an out-of-range day", () => {
    expect(isValidDateParam("2026-02-30")).toBe(false);
  });
  it("rejects a non-date string", () => {
    expect(isValidDateParam("not-a-date")).toBe(false);
  });
  it("rejects wrong format", () => {
    expect(isValidDateParam("26-10-2026")).toBe(false);
  });
});
