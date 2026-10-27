import { describe, it, expect } from "vitest";
import { DEFAULT_EDITOR_FONT, EDITOR_FONTS, editorFontScale, editorFontStack, isEditorFont } from "./fonts";

describe("EDITOR_FONTS", () => {
  it("offers Lora (default), Open Sans, Ms Madi and Bad Script", () => {
    expect(EDITOR_FONTS.map((f) => f.label)).toEqual(["Lora", "Open Sans", "Ms Madi", "Bad Script"]);
    expect(DEFAULT_EDITOR_FONT).toBe("lora");
    expect(EDITOR_FONTS[0].key).toBe(DEFAULT_EDITOR_FONT);
  });

  it("has unique keys", () => {
    expect(new Set(EDITOR_FONTS.map((f) => f.key)).size).toBe(EDITOR_FONTS.length);
  });
});

describe("isEditorFont", () => {
  it("accepts known keys and rejects everything else", () => {
    expect(isEditorFont("bad-script")).toBe(true);
    expect(isEditorFont("comic-sans")).toBe(false);
    expect(isEditorFont(undefined)).toBe(false);
    expect(isEditorFont(42)).toBe(false);
  });
});

describe("editorFontStack", () => {
  it("puts the chosen font first and falls back to Lora for missing glyphs", () => {
    expect(editorFontStack("ms-madi")).toBe("var(--font-ms-madi), var(--font-lora), serif");
  });

  it("is just Lora for the default and for unknown keys", () => {
    expect(editorFontStack("lora")).toBe("var(--font-lora), serif");
    expect(editorFontStack("nope")).toBe("var(--font-lora), serif");
    expect(editorFontStack(null)).toBe("var(--font-lora), serif");
  });
});

describe("editorFontScale", () => {
  it("is 1 for the default and unknown fonts, bigger for the small script fonts", () => {
    expect(editorFontScale("lora")).toBe(1);
    expect(editorFontScale("nope")).toBe(1);
    expect(editorFontScale("ms-madi")).toBeGreaterThan(1.2);
    expect(editorFontScale("open-sans")).toBeLessThan(1);
  });
});
