"use client";

import { useRef, useState } from "react";

const SWATCHES = ["#fbe9d6", "#d9ecdd", "#d9e4f0", "#f0d9e8", "#3a332c", "#fffaf0"];

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
                      ? "0 0 0 2px #c76f4b"
                      : "0 0 0 1px #e7ddd0",
                }}
              />
            ))}
          </div>
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
