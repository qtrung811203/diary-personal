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
