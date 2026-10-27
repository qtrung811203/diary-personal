// Pure helpers over TipTap/ProseMirror JSON. A diary's first block is always
// the "diaryTitle" node (rendered bold) — it is the entry's title in the
// sidebar; everything after it is the body / description.

export type DocNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: unknown[];
};

const TITLE_MAX = 200;
const PREVIEW_MAX = 300;

export function normalizeDoc(input: unknown): DocNode {
  const doc = (input && typeof input === "object" ? input : {}) as DocNode;
  const content = Array.isArray(doc.content) ? doc.content : [];
  const first = content[0];

  if (!first) return { type: "doc", content: [{ type: "diaryTitle" }] };
  if (first.type === "diaryTitle") return { ...doc, type: "doc", content };

  if (first.type === "paragraph" || first.type === "heading") {
    const titleNode: DocNode = { type: "diaryTitle" };
    if (first.content) titleNode.content = first.content;
    return { ...doc, type: "doc", content: [titleNode, ...content.slice(1)] };
  }

  return { ...doc, type: "doc", content: [{ type: "diaryTitle" }, ...content] };
}

function inlineText(node: DocNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return " ";
  return (node.content ?? []).map(inlineText).join("");
}

// Text of a block, joining nested blocks (list items, table cells…) with spaces.
function blockText(node: DocNode): string {
  if (!node.content) return inlineText(node);
  const hasBlockChildren = node.content.some((c) => c.type !== "text" && c.type !== "hardBreak");
  if (!hasBlockChildren) return inlineText(node);
  return node.content.map(blockText).join(" ");
}

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

export function extractTitleAndPreview(input: unknown): { title: string; preview: string } {
  const [titleNode, ...rest] = normalizeDoc(input).content ?? [];
  const title = squash(blockText(titleNode ?? {})).slice(0, TITLE_MAX);
  const preview = squash(rest.map(blockText).join(" ")).slice(0, PREVIEW_MAX);
  return { title, preview };
}

function fullText(input: unknown): string {
  return squash((normalizeDoc(input).content ?? []).map(blockText).join(" "));
}

export function countWords(input: unknown): number {
  const t = fullText(input);
  return t ? t.split(" ").length : 0;
}

function hasImage(node: DocNode): boolean {
  return node.type === "image" || (node.content ?? []).some(hasImage);
}

export function isDocEmpty(input: unknown): boolean {
  const doc = normalizeDoc(input);
  return fullText(doc) === "" && !hasImage(doc);
}
