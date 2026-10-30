"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extensions";
import { TextSelection } from "@tiptap/pm/state";
import { TextCase } from "@/lib/tiptap-text-case";
import { DiaryDocument, DiaryTitle } from "@/lib/tiptap-diary-title";
import { shouldPasteAsImage } from "@/lib/clipboard";
import { editorFontScale, editorFontStack, type EditorFontKey } from "@/lib/fonts";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import EditorToolbar from "./EditorToolbar";
import { uploadImageFile } from "@/lib/image-upload";

export default function DiaryEditor({
  initialContent,
  onChange,
  onLiveChange,
  autofocus,
  fontKey,
}: {
  initialContent: JSONContent | null;
  // Debounced — this is what gets saved.
  onChange: (json: JSONContent) => void;
  // Fires on every edit, immediately (used to keep the sidebar in sync).
  onLiveChange?: (json: JSONContent) => void;
  autofocus: "start" | "end";
  // Font of the text (title + body) only; the toolbar and app UI keep theirs.
  fontKey: EditorFontKey;
}) {
  const debouncedOnChange = useDebouncedCallback(
    (json: unknown) => onChange(json as JSONContent),
    800
  );

  // Paste/drop handlers live in editorProps (created before `editor` exists),
  // so they reach the inserter through a ref.
  const insertRef = useRef<(files: File[]) => void>(() => {});
  const [uploading, setUploading] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      // Full StarterKit (marks, headings, lists, quote, code, rule, undo/redo,
      // markdown shortcuts) — only the document schema is swapped, so the
      // first line is always the entry's title. Body headings start at H2
      // so they never compete with the title.
      StarterKit.configure({ document: false, heading: { levels: [2, 3] } }),
      DiaryDocument,
      DiaryTitle,
      TextAlign.configure({ types: ["paragraph", "heading", "diaryTitle"] }),
      TextCase,
      Highlight.configure({ multicolor: true }),
      // Built-in resizing: drag a corner handle (mouse or touch) to resize.
      Image.configure({
        resize: {
          enabled: true,
          directions: ["bottom-right", "bottom-left", "top-right", "top-left"],
          minWidth: 60,
          minHeight: 60,
          alwaysPreserveAspectRatio: true,
        },
      }),
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
      handlePaste: (view, event) => {
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
        insertRef.current([file]);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        insertRef.current(files);
        return true;
      },
    },
  });

  useEffect(() => {
    insertRef.current = async (files) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (!editor || images.length === 0) return;
      setUploading((n) => n + images.length);
      setNotice(null);
      // One at a time, in the order picked, each at the cursor.
      for (const file of images) {
        try {
          const src = await uploadImageFile(file);
          if (editor.isDestroyed) return;
          // Image + an empty paragraph after it: the cursor lands in that
          // paragraph (not on the image, which would leave it selected /
          // highlighted), so typing can continue right away.
          const content = [{ type: "image", attrs: { src } }, { type: "paragraph" }];
          const { $from } = editor.state.selection;
          const chain = editor.chain().focus();
          // The title can't hold an image: put it just below the title.
          if ($from.parent.type.name === "diaryTitle") chain.insertContentAt($from.after(), content);
          else chain.insertContent(content);
          chain
            .command(({ tr }) => {
              let end = -1;
              tr.doc.descendants((node, pos) => {
                if (node.type.name === "image" && node.attrs.src === src) end = pos + node.nodeSize;
              });
              if (end >= 0) tr.setSelection(TextSelection.near(tr.doc.resolve(end), 1));
              return true;
            })
            .scrollIntoView()
            .run();
        } catch (e) {
          setNotice(e instanceof Error ? e.message : "Không thêm được ảnh.");
        } finally {
          setUploading((n) => n - 1);
        }
      }
    };
  }, [editor]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(t);
  }, [notice]);

  return (
    <div className="flex flex-col gap-3 sm:gap-3.5 h-full min-h-0">
      {/* Mobile: docked under the writing area (just above the keyboard);
          desktop: above it. */}
      <div className="shrink-0 order-2 md:order-1 flex flex-col gap-2">
        {(uploading > 0 || notice) && (
          <div
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
              notice ? "bg-[#fdecea] text-[#c0392b]" : "bg-white/90 text-[#6f655a]"
            }`}
          >
            {notice ?? `Đang tải ảnh (${uploading})…`}
          </div>
        )}
        <EditorToolbar editor={editor} onPickImages={(files) => insertRef.current(files)} />
      </div>
      <div className="order-1 md:order-2 flex-1 min-h-0 bg-white/90 text-[#3a332c] border border-[#e7ddd0] rounded-[18px] px-5 py-6 sm:px-11 sm:py-9 overflow-y-auto">
        <EditorContent
          editor={editor}
          style={{ fontFamily: editorFontStack(fontKey), ["--font-scale" as string]: editorFontScale(fontKey) }}
          className="diary-editor max-w-[680px] mx-auto text-[15.5px] sm:text-[17px] leading-[1.75] sm:leading-[1.8] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-3.5 [&_.ProseMirror_img]:rounded-[10px] [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto"
        />
      </div>
    </div>
  );
}
