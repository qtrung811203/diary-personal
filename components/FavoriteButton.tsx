"use client";

import { HeartIcon } from "./icons";

// Sits next to the mood picker: filled pink heart = favorite, faint outline = not.
export default function FavoriteButton({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      title={value ? "Bỏ yêu thích" : "Yêu thích"}
      aria-pressed={value}
      onClick={() => onChange(!value)}
      className={`w-10 h-10 rounded-xl border border-white/60 shadow-sm flex items-center justify-center transition-colors ${
        value ? "bg-[#ffd1de] text-[#e8829e]" : "bg-white text-[#d9cfc3] hover:text-[#e8829e]"
      }`}
    >
      <HeartIcon filled={value} className="w-5 h-5" />
    </button>
  );
}
