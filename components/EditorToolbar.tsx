"use client";

import type { Editor } from "@tiptap/react";

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
  className = "",
}: {
  active?: boolean;
  disabled?: boolean;
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
      disabled={disabled}
      className={`min-w-8 h-8 px-1 rounded-lg text-sm hover:bg-[#ffd1de] disabled:opacity-30 disabled:hover:bg-transparent ${
        active ? "bg-[#ffd1de]" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

const Divider = () => <div className="w-px h-5 bg-[#e7ddd0] mx-1.5" />;

// Everything StarterKit offers (marks, headings, lists, quote, code, rule,
// undo/redo) plus this app's extras (UPPER/lower, alignment).
export default function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  const run = () => editor.chain().focus();

  return (
    <div className="flex items-center gap-0.5 flex-wrap bg-white/90 border border-[#e7ddd0] rounded-2xl p-2">
      <ToolbarButton title="Hoàn tác (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => run().undo().run()}>
        ↶
      </ToolbarButton>
      <ToolbarButton title="Làm lại (Ctrl+Shift+Z)" disabled={!editor.can().redo()} onClick={() => run().redo().run()}>
        ↷
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Đậm (Ctrl+B)" active={editor.isActive("bold")} onClick={() => run().toggleBold().run()} className="font-extrabold">
        B
      </ToolbarButton>
      <ToolbarButton title="Nghiêng (Ctrl+I)" active={editor.isActive("italic")} onClick={() => run().toggleItalic().run()} className="italic">
        I
      </ToolbarButton>
      <ToolbarButton title="Gạch chân (Ctrl+U)" active={editor.isActive("underline")} onClick={() => run().toggleUnderline().run()} className="underline">
        U
      </ToolbarButton>
      <ToolbarButton title="Gạch ngang (Ctrl+Shift+S)" active={editor.isActive("strike")} onClick={() => run().toggleStrike().run()} className="line-through">
        S
      </ToolbarButton>
      <ToolbarButton title="Code (Ctrl+E)" active={editor.isActive("code")} onClick={() => run().toggleCode().run()} className="font-mono text-xs">
        {"</>"}
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Viết HOA" active={editor.isActive("textCase", { case: "upper" })} onClick={() => run().toggleUpperCase().run()}>
        AA
      </ToolbarButton>
      <ToolbarButton title="Viết thường" active={editor.isActive("textCase", { case: "lower" })} onClick={() => run().toggleLowerCase().run()}>
        aa
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Tiêu đề lớn" active={editor.isActive("heading", { level: 2 })} onClick={() => run().toggleHeading({ level: 2 }).run()} className="font-bold">
        H2
      </ToolbarButton>
      <ToolbarButton title="Tiêu đề nhỏ" active={editor.isActive("heading", { level: 3 })} onClick={() => run().toggleHeading({ level: 3 }).run()} className="font-bold">
        H3
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Danh sách chấm (gõ “- ”)" active={editor.isActive("bulletList")} onClick={() => run().toggleBulletList().run()}>
        •≡
      </ToolbarButton>
      <ToolbarButton title="Danh sách số (gõ “1. ”)" active={editor.isActive("orderedList")} onClick={() => run().toggleOrderedList().run()}>
        1.
      </ToolbarButton>
      <ToolbarButton title="Trích dẫn (gõ “> ”)" active={editor.isActive("blockquote")} onClick={() => run().toggleBlockquote().run()}>
        ❝
      </ToolbarButton>
      <ToolbarButton title="Khối code" active={editor.isActive("codeBlock")} onClick={() => run().toggleCodeBlock().run()} className="font-mono text-xs">
        {"{ }"}
      </ToolbarButton>
      <ToolbarButton title="Đường kẻ ngang (gõ “---”)" onClick={() => run().setHorizontalRule().run()}>
        ―
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Căn trái" active={editor.isActive({ textAlign: "left" })} onClick={() => run().setTextAlign("left").run()}>
        ⇤
      </ToolbarButton>
      <ToolbarButton title="Căn giữa" active={editor.isActive({ textAlign: "center" })} onClick={() => run().setTextAlign("center").run()}>
        ≡
      </ToolbarButton>
      <ToolbarButton title="Căn phải" active={editor.isActive({ textAlign: "right" })} onClick={() => run().setTextAlign("right").run()}>
        ⇥
      </ToolbarButton>
    </div>
  );
}
