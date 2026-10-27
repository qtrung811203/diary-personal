export const MOOD_GROUPS = ["positive", "neutral", "anxious", "sad", "angry"] as const;
export type MoodGroup = (typeof MOOD_GROUPS)[number];

// valence feeds the dashboard's trend line: higher = better day.
export const MOOD_GROUP_META: Record<
  MoodGroup,
  { label: string; short: string; valence: number; color: string }
> = {
  positive: { label: "Tích cực", short: "Vui", valence: 2, color: "#ff9fbd" },
  neutral: { label: "Bình thường", short: "Ổn", valence: 0, color: "#ffd38a" },
  anxious: { label: "Lo âu & áp lực", short: "Lo âu", valence: -1, color: "#b8a1e3" },
  sad: { label: "Buồn bã", short: "Buồn", valence: -1, color: "#8fb8de" },
  angry: { label: "Tức giận", short: "Giận", valence: -1, color: "#ef8a80" },
};

export type MoodInput = { name: string; icon: string; group: MoodGroup };

// Only the first name of each requested pair ("Căng thẳng / Quá tải" -> "Căng thẳng").
export const DEFAULT_MOODS: MoodInput[] = [
  { name: "Hạnh phúc", icon: "🥰", group: "positive" },
  { name: "Vui vẻ", icon: "😊", group: "positive" },
  { name: "Bình yên", icon: "😌", group: "positive" },
  { name: "Hào hứng", icon: "🤩", group: "positive" },
  { name: "Tràn đầy năng lượng", icon: "💪", group: "positive" },
  { name: "Biết ơn", icon: "✨", group: "positive" },

  { name: "Bình thường", icon: "🙂", group: "neutral" },
  { name: "Mệt mỏi", icon: "🥱", group: "neutral" },
  { name: "Trầm tư", icon: "🤔", group: "neutral" },
  { name: "Chán nản", icon: "😐", group: "neutral" },
  { name: "Thư giãn", icon: "🛋️", group: "neutral" },

  { name: "Lo lắng", icon: "😰", group: "anxious" },
  { name: "Căng thẳng", icon: "🤯", group: "anxious" },
  { name: "Kiệt sức", icon: "🫠", group: "anxious" },
  { name: "Hoang mang", icon: "🫨", group: "anxious" },

  { name: "Buồn bã", icon: "😢", group: "sad" },
  { name: "Tổn thương", icon: "🥺", group: "sad" },
  { name: "Cô đơn", icon: "🌧️", group: "sad" },
  { name: "Hoài niệm", icon: "🥀", group: "sad" },

  { name: "Tức giận", icon: "😡", group: "angry" },
  { name: "Khó chịu", icon: "🙄", group: "angry" },
  { name: "Mất kiên nhẫn", icon: "😒", group: "angry" },
];

export function isMoodGroup(v: unknown): v is MoodGroup {
  return typeof v === "string" && (MOOD_GROUPS as readonly string[]).includes(v);
}

function graphemeCount(s: string): number {
  return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)].length;
}

export function validateMoodInput(
  input: unknown
): { ok: true; value: MoodInput } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Dữ liệu không hợp lệ." };
  const { name, icon, group } = input as Record<string, unknown>;

  const n = typeof name === "string" ? name.trim() : "";
  if (!n || n.length > 30) return { ok: false, error: "Tên mood phải từ 1 đến 30 ký tự." };

  const i = typeof icon === "string" ? icon.trim() : "";
  // An "icon" is one emoji: a single grapheme that isn't plain letters/digits.
  if (!i || graphemeCount(i) !== 1 || /^[\p{L}\p{N}]+$/u.test(i)) {
    return { ok: false, error: "Icon phải là một emoji." };
  }

  if (!isMoodGroup(group)) return { ok: false, error: "Nhóm cảm xúc không hợp lệ." };

  return { ok: true, value: { name: n, icon: i, group } };
}
