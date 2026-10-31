import { describe, expect, it } from "vitest";
import { coverFields, extractImages, isPhotoLayout, stripImages } from "./photos";

const doc = {
  type: "doc",
  content: [
    { type: "diaryTitle", content: [{ type: "text", text: "Hồ Tây" }] },
    { type: "image", attrs: { src: "https://m/a.jpg", width: 300, height: 200 } },
    { type: "paragraph", content: [{ type: "text", text: "Chiều nay" }] },
    { type: "paragraph" },
    { type: "image", attrs: { src: "https://m/b.jpg" } },
    { type: "paragraph" },
  ],
};

describe("extractImages", () => {
  it("returns image sources in document order", () => {
    expect(extractImages(doc)).toEqual(["https://m/a.jpg", "https://m/b.jpg"]);
  });
  it("finds nested images and skips ones without a source", () => {
    const nested = {
      type: "doc",
      content: [{ type: "blockquote", content: [{ type: "image", attrs: { src: "x" } }, { type: "image" }] }],
    };
    expect(extractImages(nested)).toEqual(["x"]);
  });
});

describe("stripImages", () => {
  it("removes images and the empty paragraph each one left behind", () => {
    expect(stripImages(doc)).toEqual({
      type: "doc",
      content: [
        { type: "diaryTitle", content: [{ type: "text", text: "Hồ Tây" }] },
        { type: "paragraph", content: [{ type: "text", text: "Chiều nay" }] },
        { type: "paragraph" },
      ],
    });
  });
  it("leaves a document without images untouched", () => {
    const plain = { type: "doc", content: [{ type: "diaryTitle" }, { type: "paragraph" }] };
    expect(stripImages(plain)).toEqual(plain);
  });
});

describe("coverFields", () => {
  const photos = [
    { id: "p1", url: "u1", thumbUrl: "t1", color: "#111111" },
    { id: "p2", url: "u2", thumbUrl: null, color: null },
  ];
  it("uses the chosen cover", () => {
    expect(coverFields(photos, "p2")).toEqual({
      photoCount: 2,
      coverPhotoId: "p2",
      coverThumbUrl: "u2",
      coverColor: null,
    });
  });
  it("falls back to the first photo when the cover is gone", () => {
    expect(coverFields(photos, "gone")).toMatchObject({ coverPhotoId: "p1", coverThumbUrl: "t1", coverColor: "#111111" });
  });
  it("clears the cover when there are no photos", () => {
    expect(coverFields([], "p1")).toEqual({ photoCount: 0, coverPhotoId: null, coverThumbUrl: null, coverColor: null });
  });
});

describe("isPhotoLayout", () => {
  it("accepts the three layouts only", () => {
    expect(["cover", "grid", "polaroid"].every(isPhotoLayout)).toBe(true);
    expect(isPhotoLayout("masonry")).toBe(false);
  });
});
