"use client";

import { useState } from "react";
import { EDITOR_FONTS, editorFontStack, type EditorFontKey } from "@/lib/fonts";

// Font of the entry's text only (title + body). The app UI is unaffected.
export default function FontPicker({
  value,
  onChange,
}: {
  value: EditorFontKey;
  onChange: (key: EditorFontKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = EDITOR_FONTS.find((f) => f.key === value) ?? EDITOR_FONTS[0];

  return (
    <div className="relative">
      <button
        type="button"
        title="Phông chữ của nhật ký"
        onClick={() => setOpen((v) => !v)}
        className="h-10 rounded-xl border border-white/60 bg-white shadow-sm px-3 flex items-center gap-1.5 text-[#3a332c]"
      >
        <span className="text-lg font-bold leading-none">Aa</span>
        <span className="hidden sm:inline text-sm font-semibold">{current.label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 sm:left-0 sm:right-auto top-12 z-30 w-56 rounded-2xl border border-[#e7ddd0] bg-white p-2 shadow-xl">
            <div className="px-2 pt-1 pb-2 text-xs font-bold text-[#7a6f62] tracking-wide">PHÔNG CHỮ NHẬT KÝ</div>
            {EDITOR_FONTS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  onChange(f.key);
                  setOpen(false);
                }}
                className={`w-full text-left rounded-xl px-3 py-2 flex items-center justify-between ${
                  f.key === value ? "bg-[#ffd1de]" : "hover:bg-[#fff0f4]"
                }`}
              >
                <span className="text-[19px] leading-tight text-[#3a332c]" style={{ fontFamily: editorFontStack(f.key) }}>
                  {f.label}
                </span>
                {f.key === value && <span className="text-[#e8829e] text-sm">✓</span>}
              </button>
            ))}
            <p className="px-2 pt-1.5 text-[11px] text-[#a1968a] leading-snug">
              Chỉ đổi chữ trong nhật ký này (cả tiêu đề), không đổi giao diện app.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
