"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { TextCase } from "@/lib/tiptap-text-case";
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
      Underline,
      TextAlign.configure({ types: ["paragraph", "heading"] }),
      TextCase,
      Image,
    ],
    content: initialContent ?? "",
    immediatelyRender: false,
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
        if (!imageItem) return false;

        const file = imageItem.getAsFile();
        if (!file) return false;

        event.preventDefault();

        const formData = new FormData();
        formData.append("file", file);

        fetch("/api/upload", { method: "POST", body: formData })
          .then((res) => res.json())
          .then((data: { url?: string }) => {
            if (!data.url) return;
            view.dispatch(
              view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.image.create({ src: data.url })
              )
            );
          });

        return true;
      },
    },
  });

  return (
    <div className="flex flex-col gap-3.5">
      <EditorToolbar editor={editor} />
      <div className="flex-1 bg-white/80 border border-[#e7ddd0] rounded-[18px] px-11 py-9 overflow-y-auto backdrop-blur">
        <EditorContent
          editor={editor}
          className="max-w-[640px] mx-auto font-serif text-[17px] leading-[1.8] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-3.5 [&_.ProseMirror_img]:rounded-[10px] [&_.ProseMirror_img]:max-w-full"
        />
      </div>
    </div>
  );
}
