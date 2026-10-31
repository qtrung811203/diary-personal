import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextCase } from "./tiptap-text-case";
import { DiaryDocument, DiaryTitle } from "./tiptap-diary-title";

// The document schema shared by the writing page and the read-only view.
// Full StarterKit (marks, headings, lists, quote, code, rule, undo/redo,
// markdown shortcuts) — only the document is swapped, so the first line is
// always the entry's title. Body headings start at H2 so they never compete
// with the title. Photos are not part of the text (see EntryPhoto).
export const diaryExtensions = () => [
  StarterKit.configure({ document: false, heading: { levels: [2, 3] } }),
  DiaryDocument,
  DiaryTitle,
  TextAlign.configure({ types: ["paragraph", "heading", "diaryTitle"] }),
  TextCase,
  Highlight.configure({ multicolor: true }),
];
