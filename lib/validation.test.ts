import { describe, it, expect } from "vitest";
import {
  isValidDateParam,
  isValidMonthParam,
  isAllowedImageType,
} from "./validation";

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

describe("isValidMonthParam", () => {
  it("accepts YYYY-MM", () => {
    expect(isValidMonthParam("2026-10")).toBe(true);
  });
  it("rejects an invalid month number", () => {
    expect(isValidMonthParam("2026-13")).toBe(false);
  });
  it("rejects wrong format", () => {
    expect(isValidMonthParam("2026/10")).toBe(false);
  });
});

describe("isAllowedImageType", () => {
  it("accepts png", () => {
    expect(isAllowedImageType("image/png")).toBe(true);
  });
  it("accepts jpeg", () => {
    expect(isAllowedImageType("image/jpeg")).toBe(true);
  });
  it("accepts gif", () => {
    expect(isAllowedImageType("image/gif")).toBe(true);
  });
  it("accepts webp", () => {
    expect(isAllowedImageType("image/webp")).toBe(true);
  });
  it("rejects svg (script-capable, XSS risk when served same-origin)", () => {
    expect(isAllowedImageType("image/svg+xml")).toBe(false);
  });
  it("rejects a non-image type", () => {
    expect(isAllowedImageType("text/html")).toBe(false);
  });
});
