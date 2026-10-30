import { describe, expect, it } from "vitest";
import { MAX_EDGE, fitWithin, needsCompression } from "./image-upload";

describe("fitWithin", () => {
  it("keeps images already within the limit", () => {
    expect(fitWithin(800, 600, MAX_EDGE)).toEqual({ width: 800, height: 600 });
  });
  it("scales landscape by width and portrait by height, keeping the ratio", () => {
    expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(3000, 4000, 2000)).toEqual({ width: 1500, height: 2000 });
  });
  it("never returns a zero side", () => {
    expect(fitWithin(10000, 1, 2000)).toEqual({ width: 2000, height: 1 });
  });
});

describe("needsCompression", () => {
  const MB = 1024 * 1024;
  it("leaves GIFs alone (keeps animation)", () => {
    expect(needsCompression({ type: "image/gif", size: 9 * MB, width: 4000, height: 3000 })).toBe(false);
  });
  it("leaves small, modest-sized images alone", () => {
    expect(needsCompression({ type: "image/png", size: 200_000, width: 800, height: 600 })).toBe(false);
  });
  it("compresses big files or oversized dimensions", () => {
    expect(needsCompression({ type: "image/jpeg", size: 6 * MB, width: 1000, height: 800 })).toBe(true);
    expect(needsCompression({ type: "image/jpeg", size: 500_000, width: 4000, height: 3000 })).toBe(true);
  });
});
