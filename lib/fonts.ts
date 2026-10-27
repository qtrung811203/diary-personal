// Fonts a diary entry's *text* (title + body) can be set in. This never
// touches the app UI, which keeps its own fonts. Each key maps to a CSS
// variable declared by next/font in app/layout.tsx.
// `scale` evens out optical size: the handwriting fonts run much smaller
// than Lora at the same font-size, Open Sans a bit larger.
export const EDITOR_FONTS = [
  { key: "lora", label: "Lora", cssVar: "--font-lora", scale: 1 },
  { key: "open-sans", label: "Open Sans", cssVar: "--font-open-sans", scale: 0.95 },
  { key: "ms-madi", label: "Ms Madi", cssVar: "--font-ms-madi", scale: 1.45 },
  { key: "bad-script", label: "Bad Script", cssVar: "--font-bad-script", scale: 1.15 },
] as const;

export type EditorFontKey = (typeof EDITOR_FONTS)[number]["key"];

export const DEFAULT_EDITOR_FONT: EditorFontKey = "lora";

export function isEditorFont(v: unknown): v is EditorFontKey {
  return EDITOR_FONTS.some((f) => f.key === v);
}

// Lora stays in the stack as the fallback so any glyph the chosen font lacks
// still renders in a matching serif instead of the browser's default.
export function editorFontStack(key: unknown): string {
  const font = EDITOR_FONTS.find((f) => f.key === key);
  if (!font || font.key === DEFAULT_EDITOR_FONT) return "var(--font-lora), serif";
  return `var(${font.cssVar}), var(--font-lora), serif`;
}

export function editorFontScale(key: unknown): number {
  return EDITOR_FONTS.find((f) => f.key === key)?.scale ?? 1;
}
