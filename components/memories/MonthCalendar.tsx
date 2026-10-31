"use client";

import { HeartIcon } from "@/components/icons";
import { monthDays } from "@/lib/memories";
import type { MemoryCard } from "./types";

const WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// Days with an entry show its cover (or a soft pink); tapping one scrolls to
// that day's memory.
export default function MonthCalendar({
  month,
  entries,
  today,
  onDay,
}: {
  month: string;
  entries: MemoryCard[];
  today: string;
  onDay: (date: string) => void;
}) {
  const byDate = new Map<string, MemoryCard>();
  const favDays = new Set<string>();
  // entries are newest first; keep the day's first entry with a cover.
  for (const e of [...entries].reverse()) {
    const cur = byDate.get(e.date);
    if (!cur || (!cur.coverThumbUrl && e.coverThumbUrl)) byDate.set(e.date, e);
    if (e.isFavorite) favDays.add(e.date);
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] font-bold text-[#a1968a] mb-1">
        {WEEK.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {monthDays(month).map((day, i) => {
          if (!day) return <span key={i} />;
          const e = byDate.get(day);
          const n = Number(day.slice(8));
          const isToday = day === today;
          if (!e) {
            return (
              <span
                key={day}
                className={`aspect-square rounded-lg bg-[#fbf0e3] text-[11px] font-semibold text-[#8a7f73] flex items-center justify-center ${
                  isToday ? "ring-2 ring-[#e8829e]" : ""
                }`}
              >
                {n}
              </span>
            );
          }
          return (
            <button
              key={day}
              type="button"
              onClick={() => onDay(day)}
              title={e.title || "Nhật ký"}
              className={`relative aspect-square rounded-lg overflow-hidden text-[11px] font-bold text-white flex items-center justify-center bg-cover bg-center ${
                isToday ? "ring-2 ring-[#e8829e] ring-offset-1" : ""
              }`}
              style={{
                backgroundColor: e.coverColor ?? "#f4a6b8",
                backgroundImage: e.coverThumbUrl ? `url(${e.coverThumbUrl})` : undefined,
              }}
            >
              <span className="absolute inset-0 bg-[#3a2a24]/20" />
              <span className="relative drop-shadow">{n}</span>
              {favDays.has(day) && (
                <HeartIcon filled className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-white drop-shadow" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
