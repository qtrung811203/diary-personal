"use client";

import type { ReactNode } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { Placeholder } from "@tiptap/extensions";
import { diaryExtensions } from "@/lib/editor-extensions";
import { shouldPasteAsImage } from "@/lib/clipboard";
import { editorFontScale, editorFontStack, type EditorFontKey } from "@/lib/fonts";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import EditorToolbar from "./EditorToolbar";

export default function DiaryEditor({
  initialContent,
  onChange,
  onLiveChange,
  onAddPhotos,
  autofocus,
  fontKey,
  header,
}: {
  initialContent: JSONContent | null;
  // Debounced — this is what gets saved.
  onChange: (json: JSONContent) => void;
  // Fires on every edit, immediately (used to keep the sidebar in sync).
  onLiveChange?: (json: JSONContent) => void;
  // Photos (toolbar button, paste, drop) go to the entry's photo list, never
  // into the text.
  onAddPhotos: (files: File[]) => void;
  autofocus: "start" | "end";
  // Font of the text (title + body) only; the toolbar and app UI keep theirs.
  fontKey: EditorFontKey;
  // Shown at the top of the writing card (the phone's photo strip).
  header?: ReactNode;
}) {
  const debouncedOnChange = useDebouncedCallback(
    (json: unknown) => onChange(json as JSONContent),
    800
  );

  const editor = useEditor({
    extensions: [
      ...diaryExtensions(),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "diaryTitle" ? "Tiêu đề" : "Viết điều gì đó…",
      }),
    ],
    content: initialContent ?? "",
    immediatelyRender: false,
    autofocus,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onLiveChange?.(json);
      debouncedOnChange(json);
    },
    editorProps: {
      // The browser's spellchecker doesn't know Vietnamese, so it red-
      // underlines nearly everything (and every name / handwriting-font word).
      attributes: { spellcheck: "false" },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        const imageItem = Array.from(items).find((item) =>
          item.type.startsWith("image/")
        );
        // A clipboard carrying both text and an image (common when copying
        // a cell from Excel/Word/OneNote, or an image off a web page) should
        // paste as text — see lib/clipboard.ts.
        const hasText = (event.clipboardData?.getData("text/plain") ?? "") !== "";
        if (!shouldPasteAsImage({ hasImage: !!imageItem, hasText })) return false;

        const file = imageItem!.getAsFile();
        if (!file) return false;

        event.preventDefault();
        onAddPhotos([file]);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        onAddPhotos(files);
        return true;
      },
    },
  });

  return (
    <div className="flex flex-col gap-3 sm:gap-3.5 h-full min-h-0">
      {/* Mobile: docked under the writing area (just above the keyboard);
          desktop: above it. */}
      <div className="shrink-0 order-2 md:order-1">
        <EditorToolbar editor={editor} onPickImages={onAddPhotos} />
      </div>
      <div className="order-1 md:order-2 flex-1 min-h-0 bg-white/90 text-[#3a332c] border border-[#e7ddd0] rounded-[18px] px-5 py-6 sm:px-11 sm:py-9 overflow-y-auto">
        {header && <div className="max-w-[680px] mx-auto">{header}</div>}
        <EditorContent
          editor={editor}
          style={{ fontFamily: editorFontStack(fontKey), ["--font-scale" as string]: editorFontScale(fontKey) }}
          className="diary-editor max-w-[680px] mx-auto text-[15.5px] sm:text-[17px] leading-[1.75] sm:leading-[1.8] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-3.5"
        />
      </div>
    </div>
  );
}
