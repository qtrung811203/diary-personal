import { describe, it, expect } from "vitest";
import { isBlockShortcut } from "./plain-shortcuts";

describe("isBlockShortcut", () => {
  it("catches list markers typed at the start of a line followed by a space", () => {
    for (const before of ["-", "+", "*", "1.", "12.", "3)", "  -"]) {
      expect(isBlockShortcut(before, " ")).toBe(true);
    }
  });

  it("catches quote, heading and code-fence prefixes", () => {
    for (const before of [">", "#", "###", "```", "```js", "~~~"]) {
      expect(isBlockShortcut(before, " ")).toBe(true);
    }
  });

  it("catches the third character of a horizontal rule", () => {
    expect(isBlockShortcut("--", "-")).toBe(true);
    expect(isBlockShortcut("**", "*")).toBe(true);
    expect(isBlockShortcut("__", "_")).toBe(true);
  });

  it("leaves ordinary typing alone", () => {
    expect(isBlockShortcut("xin chào", " ")).toBe(false);
    expect(isBlockShortcut("a -", " ")).toBe(false); // dash mid-line
    expect(isBlockShortcut("-", "a")).toBe(false);
    expect(isBlockShortcut("1", " ")).toBe(false);
    expect(isBlockShortcut("-", "-")).toBe(false); // only two dashes so far
    expect(isBlockShortcut("", " ")).toBe(false);
  });
});
