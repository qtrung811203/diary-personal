"use client";

import { useEffect, useState } from "react";

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function buildMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const cells: { date: string; day: number; inMonth: boolean }[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const day = daysInPrevMonth - i;
    cells.push({
      date: `${prevYear}-${pad(prevMonth)}-${pad(day)}`,
      day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: `${year}-${pad(month)}-${pad(day)}`, day, inMonth: true });
  }

  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1];
    const [y, m, d] = last.date.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    cells.push({
      date: `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`,
      day: next.getDate(),
      inMonth: false,
    });
    if (cells.length >= 42) break;
  }

  return cells;
}

export default function Calendar({
  year,
  month,
  writtenDates,
  selectedDate,
  onSelectDate,
  onClose,
  onMonthChange,
}: {
  year: number;
  month: number;
  writtenDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClose: () => void;
  onMonthChange: (year: number, month: number) => void;
}) {
  const [todayStr] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cells = buildMonthGrid(year, month);
  const writtenSet = new Set(writtenDates);

  function prevMonth() {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  }

  function nextMonth() {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  }

  return (
    <div
      className="fixed inset-0 bg-[#3a332c]/35 flex items-end sm:items-center justify-center z-20"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:w-[360px] bg-white rounded-t-[20px] sm:rounded-[20px] p-5 pb-6">
        {/* ‹ / Tháng X, Y / › and ✕ grouped on the right instead of
            absolutely positioned — it used to sit right on top of ›. */}
        <div className="flex items-center justify-between mb-3.5 gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="shrink-0 w-7.5 h-7.5 rounded-lg border border-[#e7ddd0] bg-[#faf6ef] text-xs"
          >
            ‹
          </button>
          <div className="font-bold text-[15px] truncate">
            Tháng {month}, {year}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={nextMonth}
              className="w-7.5 h-7.5 rounded-lg border border-[#e7ddd0] bg-[#faf6ef] text-xs"
            >
              ›
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Đóng"
              className="w-7.5 h-7.5 rounded-lg border border-[#e7ddd0] bg-[#faf6ef] text-[#7a6f62] text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="text-center text-[11px] font-bold text-[#7a6f62] pb-1.5">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const isToday = cell.date === todayStr;
            const isSelected = cell.date === selectedDate;
            const hasEntry = writtenSet.has(cell.date);

            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => onSelectDate(cell.date)}
                className={`aspect-square rounded-[10px] flex flex-col items-center justify-center text-[13px] ${
                  isToday
                    ? "bg-[#e8829e] text-white font-bold"
                    : !cell.inMonth
                    ? "text-[#c9beb0]"
                    : isSelected
                    ? "bg-[#ffd1de]"
                    : "hover:bg-[#ffd1de]"
                }`}
              >
                {cell.day}
                {hasEntry && (
                  <span
                    className={`w-[5px] h-[5px] rounded-full mt-0.5 ${
                      isToday ? "bg-white" : "bg-[#e8829e]"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 mt-3.5 pt-3 border-t border-[#e7ddd0] text-[11.5px] text-[#7a6f62]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e8829e]" /> Ngày đã viết
          </span>
          <span>Ô trống = chưa viết</span>
        </div>
      </div>
    </div>
  );
}
