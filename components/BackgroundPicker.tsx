"use client";

import { useRef, useState } from "react";
import { PASTEL_PALETTE, DEFAULT_BACKGROUND_VALUE } from "@/lib/background";

// App's brand palette first, then a couple of extra pastel options for
// variety. No dark/black swatch by design — a brand-new day should never
// default to (or make it one click away to pick) a black page background.
const SWATCHES = [...PASTEL_PALETTE, "#d9e4f0", "#d9ecdd", "#fffaf0"];

export default function BackgroundPicker({
  backgroundType,
  backgroundValue,
  onChange,
}: {
  backgroundType: "color" | "image";
  backgroundValue: string;
  onChange: (type: "color" | "image", value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) return;
    const data: { url: string } = await res.json();
    onChange("image", data.url);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        title="Chọn nền"
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-xl border border-[#e7ddd0] bg-white/80 flex items-center justify-center text-lg"
      >
        🎨
      </button>

      {open && (
        <div className="absolute top-12 right-0 bg-white border border-[#e7ddd0] rounded-2xl p-3.5 shadow-xl w-56 z-10">
          <div className="text-xs font-bold text-[#7a6f62] mb-2.5">
            NỀN CHO NGÀY NÀY
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {SWATCHES.map((hex) => (
              <button
                key={hex}
                type="button"
                title={hex}
                onClick={() => {
                  onChange("color", hex);
                  setOpen(false);
                }}
                className="w-7 h-7 rounded-full"
                style={{
                  background: hex,
                  boxShadow:
                    backgroundType === "color" && backgroundValue === hex
                      ? "0 0 0 2px #e8829e"
                      : "0 0 0 1px #e7ddd0",
                }}
              />
            ))}
          </div>

          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <span
              className="w-7 h-7 rounded-full border border-[#e7ddd0] overflow-hidden relative shrink-0"
              style={{
                background:
                  backgroundType === "color" ? backgroundValue : "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
              }}
            >
              <input
                type="color"
                value={backgroundType === "color" ? backgroundValue : DEFAULT_BACKGROUND_VALUE}
                onChange={(e) => onChange("color", e.target.value)}
                className="absolute -top-1 -left-1 w-10 h-10 cursor-pointer opacity-0"
              />
            </span>
            <span className="text-xs text-[#7a6f62]">Tự chọn màu khác…</span>
          </label>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border border-dashed border-[#e7ddd0] rounded-lg bg-[#faf6ef] py-2.5 text-xs text-[#7a6f62]"
          >
            🖼️ Tải ảnh nền lên
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
}
