"use client";

import { useEffect } from "react";
import { weekdayShort } from "@/lib/dates";

// "Create a diary for this past day?" confirmation.
export default function CreatePastEntryDialog({
  date,
  busy,
  onConfirm,
  onClose,
}: {
  date: string;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [y, m, d] = date.split("-");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[360px] rounded-3xl bg-white shadow-xl px-6 py-7 text-center text-[#3a332c]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-3xl mb-2">📝</div>
        <h2 className="text-lg font-bold font-[family-name:var(--font-lora)]">
          Tạo nhật ký cho ngày {weekdayShort(date)}, {d}/{m}/{y}?
        </h2>
        <p className="text-sm text-[#7a6f62] mt-1.5">Ngày này chưa có nhật ký. Bạn muốn tạo chứ?</p>
        <div className="flex gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#e7ddd0] py-2.5 text-sm font-semibold text-[#7a6f62] hover:bg-[#faf6ef]"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            className="flex-1 rounded-xl bg-[#e8829e] hover:bg-[#d96b89] text-white py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {busy ? "Đang tạo…" : "Tạo nhật ký"}
          </button>
        </div>
      </div>
    </div>
  );
}
