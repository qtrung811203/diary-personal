import { describe, expect, it } from "vitest";
import { MAX_EDGE, THUMB_EDGE, fitWithin, needsCompression, toHex } from "./image-upload";

describe("thumbnails", () => {
  it("shrink phone photos to the thumbnail edge", () => {
    expect(fitWithin(4032, 3024, THUMB_EDGE)).toEqual({ width: 480, height: 360 });
  });
  it("toHex formats an RGB colour", () => {
    expect(toHex(232, 130, 158)).toBe("#e8829e");
    expect(toHex(0, 5.4, 255)).toBe("#0005ff");
  });
});

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
