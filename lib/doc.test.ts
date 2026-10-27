import { describe, it, expect } from "vitest";
import {
  countWords,
  extractTitleAndPreview,
  isDocEmpty,
  normalizeDoc,
  type DocNode,
} from "./doc";

const text = (t: string): DocNode => ({ type: "text", text: t });
const para = (t: string): DocNode => ({ type: "paragraph", content: [text(t)] });
const title = (t: string): DocNode => ({ type: "diaryTitle", content: [text(t)] });
const doc = (...content: DocNode[]): DocNode => ({ type: "doc", content });

describe("normalizeDoc", () => {
  it("turns null / empty objects into a doc with an empty title", () => {
    expect(normalizeDoc(null)).toEqual({ type: "doc", content: [{ type: "diaryTitle" }] });
    expect(normalizeDoc({})).toEqual({ type: "doc", content: [{ type: "diaryTitle" }] });
    expect(normalizeDoc({ type: "doc" })).toEqual({ type: "doc", content: [{ type: "diaryTitle" }] });
  });

  it("leaves a doc that already starts with a title untouched", () => {
    const d = doc(title("Hi"), para("body"));
    expect(normalizeDoc(d)).toEqual(d);
  });

  it("converts a leading paragraph into the title, keeping its text", () => {
    expect(normalizeDoc(doc(para("Dòng đầu"), para("body")))).toEqual(
      doc(title("Dòng đầu"), para("body"))
    );
  });

  it("converts a leading heading into the title", () => {
    const d = doc({ type: "heading", attrs: { level: 2 }, content: [text("H")] }, para("b"));
    expect(normalizeDoc(d)).toEqual(doc(title("H"), para("b")));
  });

  it("inserts an empty title before a leading non-text block (e.g. an image)", () => {
    const img: DocNode = { type: "image", attrs: { src: "x" } };
    expect(normalizeDoc(doc(img))).toEqual(doc({ type: "diaryTitle" }, img));
  });
});

describe("extractTitleAndPreview", () => {
  it("uses the first line as title and the rest as preview", () => {
    expect(extractTitleAndPreview(doc(title("Tiêu đề"), para("Dòng một"), para("Dòng hai")))).toEqual({
      title: "Tiêu đề",
      preview: "Dòng một Dòng hai",
    });
  });

  it("returns empty strings for an empty doc", () => {
    expect(extractTitleAndPreview(normalizeDoc(null))).toEqual({ title: "", preview: "" });
  });

  it("collapses whitespace and truncates long previews", () => {
    const long = "a ".repeat(400);
    const { preview } = extractTitleAndPreview(doc(title("t"), para(long)));
    expect(preview.length).toBeLessThanOrEqual(300);
    expect(preview.startsWith("a a a")).toBe(true);
  });

  it("treats a legacy doc (first node a paragraph) as if it had been normalized", () => {
    expect(extractTitleAndPreview(doc(para("Cũ"), para("nội dung")))).toEqual({
      title: "Cũ",
      preview: "nội dung",
    });
  });
});

describe("countWords", () => {
  it("counts whitespace-separated words across the whole doc", () => {
    expect(countWords(doc(title("Một hai"), para("ba bốn năm")))).toBe(5);
  });
  it("is 0 for an empty doc", () => {
    expect(countWords(normalizeDoc(null))).toBe(0);
  });
});

describe("isDocEmpty", () => {
  it("is true with no text and no images", () => {
    expect(isDocEmpty(normalizeDoc(null))).toBe(true);
    expect(isDocEmpty(doc(title("  "), para("")))).toBe(true);
  });
  it("is false with text or an image", () => {
    expect(isDocEmpty(doc(title("x")))).toBe(false);
    expect(isDocEmpty(doc({ type: "diaryTitle" }, { type: "image", attrs: { src: "x" } }))).toBe(false);
  });
});
