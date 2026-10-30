"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { CheckIcon, CloseIcon, PencilIcon, TrashIcon } from "./icons";

type Dims = { width: number | null; height: number | null };
type Box = { top: number; left: number };

// Image editing in two steps, so nothing changes by accident:
//  1. Tapping an image selects it and shows a small "Chỉnh sửa | Xoá" pill on it
//     (on a phone the keyboard is dropped so the image is easy to work with).
//  2. "Chỉnh sửa" turns on resizing: the corner handles appear and a bar with
//     three icon buttons stays on screen — cancel (restore the size from when
//     resizing started), delete (asks first) and accept.
// `resizing` lives in DiaryEditor because a freshly inserted photo starts out
// in resize mode.
export default function ImageTools({
  editor,
  resizing,
  setResizing,
}: {
  editor: Editor | null;
  resizing: boolean;
  setResizing: (v: boolean) => void;
}) {
  const [sel, setSel] = useState<{ pos: number; changed: boolean; box: Box | null } | null>(null);
  const original = useRef<{ pos: number } & Dims>({ pos: -1, width: null, height: null });
  const lastPos = useRef(-1);

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const s = editor.state.selection;
      if (!editor.isEditable || !(s instanceof NodeSelection) || s.node.type.name !== "image") {
        lastPos.current = -1;
        setSel(null);
        setResizing(false);
        return;
      }
      // Newly selected image on a touch screen: close the keyboard.
      if (lastPos.current !== s.from) {
        lastPos.current = s.from;
        if (window.matchMedia("(pointer: coarse)").matches) editor.view.dom.blur();
      }
      const { width, height } = s.node.attrs as Dims;
      const o = original.current;
      const dom = editor.view.nodeDOM(s.from) as HTMLElement | null;
      const r = dom?.getBoundingClientRect();
      const visible = r && r.bottom > 0 && r.top < window.innerHeight;
      setSel({
        pos: s.from,
        changed: o.pos === s.from && (o.width !== width || o.height !== height),
        box: visible
          ? {
              top: Math.min(Math.max(r.top + 8, 8), window.innerHeight - 56),
              left: Math.max(Math.min(r.right - 8, window.innerWidth - 8), 8),
            }
          : null,
      });
    };
    editor.on("transaction", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      editor.off("transaction", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [editor, setResizing]);

  // Remember the size resizing started from, whichever way it was entered.
  useEffect(() => {
    if (!editor || !resizing) return;
    const s = editor.state.selection;
    if (s instanceof NodeSelection && s.node.type.name === "image") {
      const { width, height } = s.node.attrs as Dims;
      original.current = { pos: s.from, width, height };
    }
  }, [editor, resizing]);

  if (!editor || !sel) return null;

  function leave(restore: boolean) {
    const { pos } = sel!;
    const { width, height } = original.current;
    editor!
      .chain()
      .focus()
      .command(({ tr }) => {
        if (restore) {
          tr.setNodeAttribute(pos, "width", width);
          tr.setNodeAttribute(pos, "height", height);
        }
        const node = tr.doc.nodeAt(pos);
        if (node) tr.setSelection(TextSelection.near(tr.doc.resolve(pos + node.nodeSize), 1));
        return true;
      })
      .run();
    setResizing(false);
  }

  function remove() {
    if (!window.confirm("Xoá ảnh này khỏi nhật ký?")) return;
    const { pos } = sel!;
    editor!
      .chain()
      .focus()
      .command(({ tr }) => {
        const node = tr.doc.nodeAt(pos);
        if (node) tr.delete(pos, pos + node.nodeSize);
        return true;
      })
      .run();
    setResizing(false);
  }

  const keepFocus = (e: React.MouseEvent) => e.preventDefault();
  const iconBtn = "w-11 h-11 rounded-xl flex items-center justify-center";

  if (!resizing) {
    if (!sel.box) return null;
    return (
      <div
        className="fixed z-30 flex items-center gap-1 rounded-2xl border border-[#e7ddd0] bg-white p-1 shadow-lg"
        style={{ top: sel.box.top, left: sel.box.left, transform: "translateX(-100%)" }}
      >
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={() => setResizing(true)}
          className="h-10 px-3 rounded-xl text-sm font-semibold text-[#3a332c] hover:bg-[#fff0f4] flex items-center gap-1.5"
        >
          <PencilIcon className="w-4 h-4" />
          Chỉnh sửa
        </button>
        <button
          type="button"
          title="Xoá ảnh"
          aria-label="Xoá ảnh"
          onMouseDown={keepFocus}
          onClick={remove}
          className="w-10 h-10 rounded-xl text-[#c0392b] hover:bg-[#fdecea] flex items-center justify-center"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[#e7ddd0] bg-white/95 px-2.5 py-2 text-[#3a332c]">
      <span className="flex-1 text-xs text-[#7a6f62] leading-tight">Kéo góc ảnh để đổi cỡ</span>
      <button
        type="button"
        title="Huỷ thay đổi kích thước"
        aria-label="Huỷ thay đổi kích thước"
        onMouseDown={keepFocus}
        onClick={() => leave(true)}
        disabled={!sel.changed}
        className={`${iconBtn} border border-[#e7ddd0] text-[#7a6f62] disabled:opacity-35`}
      >
        <CloseIcon className="w-5 h-5" />
      </button>
      <button
        type="button"
        title="Xoá ảnh"
        aria-label="Xoá ảnh"
        onMouseDown={keepFocus}
        onClick={remove}
        className={`${iconBtn} border border-[#f3c6c0] text-[#c0392b]`}
      >
        <TrashIcon className="w-5 h-5" />
      </button>
      <button
        type="button"
        title="Chấp nhận"
        aria-label="Chấp nhận"
        onMouseDown={keepFocus}
        onClick={() => leave(false)}
        className={`${iconBtn} bg-[#e8829e] text-white`}
      >
        <CheckIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
