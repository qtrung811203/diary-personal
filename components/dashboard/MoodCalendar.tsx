"use client";

import Link from "next/link";
import { weekdayIndex } from "@/lib/dates";
import type { DMood } from "./types";

const HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// A calendar where each day shows that day's mood icon. Days that have an
// entry link to it (the newest one when there are several).
export default function MoodCalendar({
  days,
  view,
  today,
  dailyMoods,
  entryByDate,
}: {
  days: string[];
  view: "week" | "month";
  today: string;
  dailyMoods: Record<string, DMood>;
  entryByDate: Map<string, string>;
}) {
  const blanks = weekdayIndex(days[0]);
  const big = view === "week";

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {HEADERS.map((h) => (
          <div key={h} className="text-center text-[11px] font-bold text-[#a1968a]">
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: blanks }, (_, i) => (
          <div key={`b${i}`} />
        ))}
        {days.map((d) => {
          const mood = dailyMoods[d];
          const entryId = entryByDate.get(d);
          const isToday = d === today;
          const cell = (
            <div
              className={`aspect-square rounded-xl flex flex-col items-center justify-center ${
                isToday ? "ring-2 ring-[#e8829e]" : ""
              } ${mood ? "bg-[#fff0f4]" : entryId ? "bg-[#fffaf3]" : "bg-transparent"} ${
                entryId ? "hover:bg-[#ffd1de] transition-colors" : ""
              }`}
              title={mood ? `${Number(d.slice(8))}/${Number(d.slice(5, 7))} · ${mood.name}` : undefined}
            >
              <span className={`leading-none ${big ? "text-[34px]" : "text-[22px] sm:text-[26px]"}`}>
                {mood ? mood.icon : entryId ? "•" : ""}
              </span>
              <span
                className={`mt-0.5 font-semibold ${big ? "text-xs" : "text-[10px] sm:text-[11px]"} ${
                  isToday ? "text-[#e8829e]" : "text-[#8a7f73]"
                }`}
              >
                {Number(d.slice(8))}
              </span>
            </div>
          );
          return entryId ? (
            <Link key={d} href={`/diary/${entryId}`}>
              {cell}
            </Link>
          ) : (
            <div key={d}>{cell}</div>
          );
        })}
      </div>
    </div>
  );
}
