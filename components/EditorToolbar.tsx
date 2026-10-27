"use client";

import type { Editor } from "@tiptap/react";

function ToolbarButton({
  active,
  onClick,
  title,
  children,
  className = "",
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-8 h-8 rounded-lg text-sm hover:bg-[#ffd1de] ${
        active ? "bg-[#ffd1de]" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 flex-wrap bg-white/90 border border-[#e7ddd0] rounded-2xl p-2">
      <ToolbarButton
        title="Đậm (Ctrl+B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className="font-extrabold"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        title="Nghiêng (Ctrl+I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className="italic"
      >
        I
      </ToolbarButton>
      <ToolbarButton
        title="Gạch chân (Ctrl+U)"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className="underline"
      >
        U
      </ToolbarButton>

      <div className="w-px h-5 bg-[#e7ddd0] mx-1.5" />

      <ToolbarButton
        title="Viết HOA"
        active={editor.isActive("textCase", { case: "upper" })}
        onClick={() => editor.chain().focus().toggleUpperCase().run()}
      >
        AA
      </ToolbarButton>
      <ToolbarButton
        title="Viết thường"
        active={editor.isActive("textCase", { case: "lower" })}
        onClick={() => editor.chain().focus().toggleLowerCase().run()}
      >
        aa
      </ToolbarButton>

      <div className="w-px h-5 bg-[#e7ddd0] mx-1.5" />

      <ToolbarButton
        title="Căn trái"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        ⇤
      </ToolbarButton>
      <ToolbarButton
        title="Căn giữa"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        ≡
      </ToolbarButton>
      <ToolbarButton
        title="Căn phải"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        ⇥
      </ToolbarButton>
    </div>
  );
}
