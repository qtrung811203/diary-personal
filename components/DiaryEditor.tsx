"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { TextCase } from "@/lib/tiptap-text-case";
import { shouldPasteAsImage } from "@/lib/clipboard";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import EditorToolbar from "./EditorToolbar";

export default function DiaryEditor({
  initialContent,
  onChange,
}: {
  initialContent: JSONContent | null;
  onChange: (json: JSONContent) => void;
}) {
  const debouncedOnChange = useDebouncedCallback(
    (json: unknown) => onChange(json as JSONContent),
    800
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["paragraph", "heading"] }),
      TextCase,
      Image,
    ],
    content: initialContent ?? "",
    immediatelyRender: false,
    autofocus: "end",
    onUpdate: ({ editor }) => {
      debouncedOnChange(editor.getJSON());
    },
    editorProps: {
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

        const formData = new FormData();
        formData.append("file", file);

        fetch("/api/upload", { method: "POST", body: formData })
          .then((res) => {
            if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
            return res.json();
          })
          .then((data: { url?: string }) => {
            if (!data.url) return;
            view.dispatch(
              view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.image.create({ src: data.url })
              )
            );
          })
          .catch(() => {
            // Pasted image failed to upload (e.g. over the 5MB limit) — the
            // selection is left untouched rather than inserting a broken
            // image; the user can see nothing was added and retry.
          });

        return true;
      },
    },
  });

  return (
    <div className="flex flex-col gap-3 sm:gap-3.5 h-full">
      <div className="overflow-x-auto">
        <EditorToolbar editor={editor} />
      </div>
      <div className="flex-1 bg-white/80 border border-[#e7ddd0] rounded-[18px] px-5 py-6 sm:px-11 sm:py-9 overflow-y-auto backdrop-blur">
        <EditorContent
          editor={editor}
          className="max-w-[640px] mx-auto font-[family-name:var(--font-lora)] text-[15.5px] sm:text-[17px] leading-[1.75] sm:leading-[1.8] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-3.5 [&_.ProseMirror_img]:rounded-[10px] [&_.ProseMirror_img]:max-w-full"
        />
      </div>
    </div>
  );
}
