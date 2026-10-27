"use client";

import { useRef, useState } from "react";
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
      // Keep the editor focused: without this, tapping a button blurs it and
      // the phone keyboard closes on every format change.
      onMouseDown={(e) => e.preventDefault()}
      disabled={disabled}
      className={`shrink-0 min-w-10 h-10 md:min-w-8 md:h-8 px-1 rounded-lg text-sm hover:bg-[#ffd1de] disabled:opacity-30 disabled:hover:bg-transparent ${
        active ? "bg-[#ffd1de]" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

const HIGHLIGHT_COLORS = ["#fff3a3", "#ffd1de", "#cdeccf", "#cfe3f7", "#ffe0b8"];

// The color picker is position:fixed (placed from the button's rect) because
// the mobile toolbar scrolls horizontally, and an absolutely-positioned
// popover inside it would be clipped.
function HighlightMenu({ editor }: { editor: Editor }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const active = editor.isActive("highlight");

  function toggle() {
    if (pos) return setPos(null);
    const r = btnRef.current!.getBoundingClientRect();
    const left = Math.min(Math.max(r.left, 8), window.innerWidth - 236);
    // Docked at the bottom on mobile -> open upward; otherwise downward.
    setPos(r.top > window.innerHeight / 2 ? { left, bottom: window.innerHeight - r.top + 8 } : { left, top: r.bottom + 8 });
  }

  function pick(color: string | null) {
    const chain = editor.chain().focus();
    if (color === null || editor.isActive("highlight", { color })) chain.unsetHighlight().run();
    else chain.setHighlight({ color }).run();
    setPos(null);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        title="Highlight (tô nền chữ)"
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
        className={`shrink-0 min-w-10 h-10 md:min-w-8 md:h-8 px-1 rounded-lg hover:bg-[#ffd1de] ${active ? "bg-[#ffd1de]" : ""}`}
      >
        <span className="px-1.5 rounded bg-[#fff3a3] text-sm font-bold text-[#3a332c]">A</span>
      </button>
      {pos && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={(e) => e.preventDefault()} onClick={() => setPos(null)} />
          <div
            className="fixed z-50 flex items-center gap-2 rounded-2xl border border-[#e7ddd0] bg-white p-2.5 shadow-xl"
            style={pos}
            onMouseDown={(e) => e.preventDefault()}
          >
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => pick(c)}
                className="w-8 h-8 rounded-full border border-black/10"
                style={{ background: c, boxShadow: editor.isActive("highlight", { color: c }) ? "0 0 0 2px #e8829e" : undefined }}
              />
            ))}
            <button type="button" title="Bỏ highlight" onClick={() => pick(null)} className="w-8 h-8 rounded-full border border-[#e7ddd0] text-[#7a6f62] text-sm">
              ✕
            </button>
          </div>
        </>
      )}
    </>
  );
}

const Divider = () => <div className="shrink-0 w-px h-5 bg-[#e7ddd0] mx-1.5" />;

// Everything StarterKit offers (marks, headings, lists, quote, code, rule,
// undo/redo) plus this app's extras (UPPER/lower, alignment).
export default function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  const run = () => editor.chain().focus();

  return (
    <div className="flex items-center gap-0.5 flex-nowrap overflow-x-auto md:flex-wrap md:overflow-visible bg-white/90 border border-[#e7ddd0] rounded-2xl p-1.5 md:p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      <HighlightMenu editor={editor} />
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
