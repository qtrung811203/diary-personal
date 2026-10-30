"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { CheckIcon, CloseIcon, TrashIcon } from "./icons";

type Dims = { width: number | null; height: number | null };

// Touch screens have no way to click away from a selected image after
// dragging its handles, so while an image is selected this bar offers three
// icon buttons: accept (keep the size, cursor below the image), cancel
// (restore the size it had when selected) and delete (asks first).
export default function ImageResizeBar({ editor }: { editor: Editor | null }) {
  const [sel, setSel] = useState<{ pos: number; changed: boolean } | null>(null);
  const original = useRef<{ pos: number } & Dims>({ pos: -1, width: null, height: null });

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const s = editor.state.selection;
      if (!(s instanceof NodeSelection) || s.node.type.name !== "image") {
        original.current = { pos: -1, width: null, height: null };
        setSel(null);
        return;
      }
      const { width, height } = s.node.attrs as Dims;
      // First time this image is selected: remember its size for "Huỷ".
      if (original.current.pos !== s.from) original.current = { pos: s.from, width, height };
      const o = original.current;
      setSel({ pos: s.from, changed: o.width !== width || o.height !== height });
    };
    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!editor || !sel) return null;

  function leaveImage(restore: boolean) {
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
  }

  function deleteImage() {
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
  }

  const btn = "w-11 h-11 rounded-xl flex items-center justify-center";

  return (
    <div className="hidden pointer-coarse:flex items-center gap-2 rounded-2xl border border-[#e7ddd0] bg-white/95 px-2.5 py-2 text-[#3a332c]">
      <span className="flex-1 text-xs text-[#7a6f62] leading-tight">Kéo góc ảnh để đổi cỡ</span>
      <button
        type="button"
        title="Huỷ thay đổi kích thước"
        aria-label="Huỷ thay đổi kích thước"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => leaveImage(true)}
        disabled={!sel.changed}
        className={`${btn} border border-[#e7ddd0] text-[#7a6f62] disabled:opacity-35`}
      >
        <CloseIcon className="w-5 h-5" />
      </button>
      <button
        type="button"
        title="Xoá ảnh"
        aria-label="Xoá ảnh"
        onMouseDown={(e) => e.preventDefault()}
        onClick={deleteImage}
        className={`${btn} border border-[#f3c6c0] text-[#c0392b]`}
      >
        <TrashIcon className="w-5 h-5" />
      </button>
      <button
        type="button"
        title="Chấp nhận"
        aria-label="Chấp nhận"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => leaveImage(false)}
        className={`${btn} bg-[#e8829e] text-white`}
      >
        <CheckIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
