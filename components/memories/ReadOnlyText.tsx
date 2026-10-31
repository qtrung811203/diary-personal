"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { diaryExtensions } from "@/lib/editor-extensions";
import { editorFontScale, editorFontStack, type EditorFontKey } from "@/lib/fonts";

// The entry's body (without its title line, which the page shows as the
// heading), rendered with the same schema and styles as the editor.
export default function ReadOnlyText({ doc, fontKey }: { doc: JSONContent; fontKey: EditorFontKey }) {
  const body: JSONContent = { type: "doc", content: [{ type: "diaryTitle" }, ...(doc.content ?? []).slice(1)] };
  const editor = useEditor({
    extensions: diaryExtensions(),
    content: body,
    editable: false,
    immediatelyRender: false,
  });
  return (
    <EditorContent
      editor={editor}
      style={{ fontFamily: editorFontStack(fontKey), ["--font-scale" as string]: editorFontScale(fontKey) }}
      className="diary-editor diary-reader text-[15.5px] sm:text-[17px] leading-[1.75] sm:leading-[1.85] text-[#3a332c] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-3"
    />
  );
}
