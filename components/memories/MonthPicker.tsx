"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

// Year stepper + 12 months; months after `max` are disabled.
export default function MonthPicker({
  value,
  max,
  onPick,
  onClose,
}: {
  value: string;
  max: string;
  onPick: (month: string) => void;
  onClose: () => void;
}) {
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const maxYear = Number(max.slice(0, 4));
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 top-full left-0 mt-2 w-[260px] rounded-2xl border border-[#e7ddd0] bg-white p-3 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <button type="button" aria-label="Năm trước" onClick={() => setYear(year - 1)} className="w-8 h-8 rounded-lg hover:bg-[#fff0f4] flex items-center justify-center">
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="font-bold text-[#3a332c]">{year}</span>
          <button
            type="button"
            aria-label="Năm sau"
            disabled={year >= maxYear}
            onClick={() => setYear(year + 1)}
            className="w-8 h-8 rounded-lg hover:bg-[#fff0f4] flex items-center justify-center disabled:opacity-30"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => {
            const m = `${year}-${String(i + 1).padStart(2, "0")}`;
            return (
              <button
                key={m}
                type="button"
                disabled={m > max}
                onClick={() => onPick(m)}
                className={`rounded-lg py-2 text-[13px] font-semibold disabled:opacity-30 ${
                  m === value ? "bg-[#e8829e] text-white" : "text-[#3a332c] hover:bg-[#fff0f4]"
                }`}
              >
                Th{i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
