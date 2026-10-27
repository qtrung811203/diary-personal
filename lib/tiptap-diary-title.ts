import { Node, mergeAttributes } from "@tiptap/core";
import Document from "@tiptap/extension-document";

// The entry's first line. It is always present (the document schema requires
// it) and always rendered bold; its text is the title shown in the sidebar
// (see lib/doc.ts). Deliberately in no node group, so `block*` can't contain
// a second one.
export const DiaryTitle = Node.create({
  name: "diaryTitle",
  content: "inline*",
  defining: true,

  parseHTML() {
    return [{ tag: "h1[data-diary-title]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["h1", mergeAttributes(HTMLAttributes, { "data-diary-title": "" }), 0];
  },
});

export const DiaryDocument = Document.extend({
  content: "diaryTitle block*",
});
