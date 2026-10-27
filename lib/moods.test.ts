import { describe, it, expect } from "vitest";
import {
  DEFAULT_MOODS,
  MOOD_GROUPS,
  MOOD_GROUP_META,
  validateMoodInput,
} from "./moods";

describe("DEFAULT_MOODS", () => {
  it("has 22 moods across all five groups", () => {
    expect(DEFAULT_MOODS).toHaveLength(22);
    for (const g of MOOD_GROUPS) {
      expect(DEFAULT_MOODS.some((m) => m.group === g)).toBe(true);
    }
  });

  it("uses only the first name (no slash / comma alternates)", () => {
    for (const m of DEFAULT_MOODS) {
      expect(m.name).not.toMatch(/[\/,]/);
      expect(m.name.trim()).toBe(m.name);
    }
  });

  it("has unique names and every group has display metadata", () => {
    expect(new Set(DEFAULT_MOODS.map((m) => m.name)).size).toBe(DEFAULT_MOODS.length);
    for (const g of MOOD_GROUPS) expect(MOOD_GROUP_META[g].label).toBeTruthy();
  });

  it("matches the requested examples", () => {
    const find = (n: string) => DEFAULT_MOODS.find((m) => m.name === n);
    expect(find("Hạnh phúc")).toMatchObject({ icon: "🥰", group: "positive" });
    expect(find("Căng thẳng")).toMatchObject({ icon: "🤯", group: "anxious" });
    expect(find("Cô đơn")).toMatchObject({ icon: "🌧️", group: "sad" });
    expect(find("Mất kiên nhẫn")).toMatchObject({ icon: "😒", group: "angry" });
  });
});

describe("validateMoodInput", () => {
  it("accepts and trims a valid mood", () => {
    expect(validateMoodInput({ name: "  Phấn khích ", icon: "🎉", group: "positive" })).toEqual({
      ok: true,
      value: { name: "Phấn khích", icon: "🎉", group: "positive" },
    });
  });

  it("rejects an empty name, empty icon, bad group, and non-object input", () => {
    expect(validateMoodInput({ name: " ", icon: "🎉", group: "positive" }).ok).toBe(false);
    expect(validateMoodInput({ name: "x", icon: "", group: "positive" }).ok).toBe(false);
    expect(validateMoodInput({ name: "x", icon: "🎉", group: "nope" }).ok).toBe(false);
    expect(validateMoodInput(null).ok).toBe(false);
  });

  it("rejects over-long names and icons that are really text", () => {
    expect(validateMoodInput({ name: "x".repeat(31), icon: "🎉", group: "sad" }).ok).toBe(false);
    expect(validateMoodInput({ name: "x", icon: "hello", group: "sad" }).ok).toBe(false);
  });

  it("accepts a multi-codepoint emoji as a single icon", () => {
    expect(validateMoodInput({ name: "Mưa", icon: "🌧️", group: "sad" }).ok).toBe(true);
  });
});
