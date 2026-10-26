import { describe, it, expect } from "vitest";
import { shouldPasteAsImage } from "./clipboard";

describe("shouldPasteAsImage", () => {
  it("pastes as image when clipboard has only an image", () => {
    expect(shouldPasteAsImage({ hasImage: true, hasText: false })).toBe(true);
  });
  it("pastes as text when clipboard has only text", () => {
    expect(shouldPasteAsImage({ hasImage: false, hasText: true })).toBe(false);
  });
  it("prefers text when clipboard has both (e.g. copying a cell from Excel)", () => {
    expect(shouldPasteAsImage({ hasImage: true, hasText: true })).toBe(false);
  });
  it("pastes as text when clipboard has neither", () => {
    expect(shouldPasteAsImage({ hasImage: false, hasText: false })).toBe(false);
  });
});
