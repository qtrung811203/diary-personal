"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import DiaryEditor from "@/components/DiaryEditor";
import BackgroundPicker from "@/components/BackgroundPicker";
import Calendar from "@/components/Calendar";

const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

function todayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS[date.getDay()]}, ${d} Tháng ${m}, ${y}`;
}

function shiftDate(dateStr: string, deltaDays: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + deltaDays);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

type DiaryEntryResponse = {
  contentJson: JSONContent;
  backgroundType: string;
  backgroundValue: string;
} | null;

export default function DiaryDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = use(params);
  const router = useRouter();
  const isToday = date === todayDateString();

  const [entry, setEntry] = useState<DiaryEntryResponse>(null);
  const [loaded, setLoaded] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [writtenDates, setWrittenDates] = useState<string[]>([]);
  const [calendarYear, calendarMonthInit] = date.split("-").map(Number);
  const [calendarMonth, setCalendarMonth] = useState(calendarMonthInit);
  const [calYear, setCalYear] = useState(calendarYear);

  useEffect(() => {
    const yyyymm = `${calYear}-${String(calendarMonth).padStart(2, "0")}`;
    fetch(`/api/diary/month/${yyyymm}`)
      .then((res) => res.json())
      .then((data: { writtenDates: string[] }) =>
        setWrittenDates(data.writtenDates ?? [])
      );
  }, [calYear, calendarMonth]);

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/diary/${date}`)
      .then((res) => res.json())
      .then((data) => {
        setEntry(data);
        setLoaded(true);
      });
  }, [date]);

  function saveEntry(next: {
    contentJson?: JSONContent;
    backgroundType?: string;
    backgroundValue?: string;
  }) {
    const payload = {
      contentJson: next.contentJson ?? entry?.contentJson ?? {},
      backgroundType: next.backgroundType ?? entry?.backgroundType ?? "color",
      backgroundValue:
        next.backgroundValue ?? entry?.backgroundValue ?? "#fbe9d6",
    };

    fetch(`/api/diary/${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  function handleChange(contentJson: JSONContent) {
    setEntry((prev) => ({
      contentJson,
      backgroundType: prev?.backgroundType ?? "color",
      backgroundValue: prev?.backgroundValue ?? "#fbe9d6",
    }));
    saveEntry({ contentJson });
  }

  function handleBackgroundChange(type: "color" | "image", value: string) {
    setEntry((prev) => ({
      contentJson: prev?.contentJson ?? {},
      backgroundType: type,
      backgroundValue: value,
    }));
    saveEntry({ backgroundType: type, backgroundValue: value });
  }

  const background =
    entry?.backgroundType === "image"
      ? `url(${entry.backgroundValue}) center/cover fixed`
      : entry?.backgroundValue ?? "#fbe9d6";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background }}
    >
      <div className="flex items-center justify-between flex-wrap gap-y-2 px-4 py-3.5 sm:px-7 sm:py-4.5">
        <div className="flex items-center gap-2 sm:gap-3">
          {!isToday && (
            <button
              className="w-8.5 h-8.5 rounded-[10px] border border-[#e7ddd0] bg-white/80 text-sm"
              onClick={() => router.push(`/diary/${shiftDate(date, -1)}`)}
              title="Ngày trước"
            >
              ‹
            </button>
          )}
          <div>
            <div className="text-xs font-semibold tracking-wide uppercase text-[#7a6f62]">
              {isToday ? "Hôm nay" : "Xem lại"}
            </div>
            <div className="text-xl font-bold">{formatDisplayDate(date)}</div>
          </div>
          {!isToday && (
            <>
              <button
                className="w-8.5 h-8.5 rounded-[10px] border border-[#e7ddd0] bg-white/80 text-sm"
                onClick={() => router.push(`/diary/${shiftDate(date, 1)}`)}
                title="Ngày sau"
              >
                ›
              </button>
              <button
                className="text-xs font-bold text-[#c76f4b] bg-[#f0d9c9] rounded-full px-2.5 py-1"
                onClick={() => router.push(`/diary/${todayDateString()}`)}
              >
                Về hôm nay
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <BackgroundPicker
            backgroundType={
              entry?.backgroundType === "image" ? "image" : "color"
            }
            backgroundValue={entry?.backgroundValue ?? "#fbe9d6"}
            onChange={handleBackgroundChange}
          />
          <button
            type="button"
            title="Mở lịch"
            onClick={() => setCalendarOpen(true)}
            className="w-10 h-10 rounded-xl border border-[#e7ddd0] bg-white/80 flex items-center justify-center text-lg"
          >
            📅
          </button>
        </div>
      </div>

      {calendarOpen && (
        <Calendar
          year={calYear}
          month={calendarMonth}
          writtenDates={writtenDates}
          selectedDate={date}
          onSelectDate={(d) => {
            setCalendarOpen(false);
            router.push(`/diary/${d}`);
          }}
          onClose={() => setCalendarOpen(false)}
          onMonthChange={(y, m) => {
            setCalYear(y);
            setCalendarMonth(m);
          }}
        />
      )}

      {!isToday && (
        <div className="mx-4 sm:mx-7 mb-3.5 bg-[#fff4e5] border border-[#f0d9c0] text-[#8a5a22] text-[12.5px] font-semibold px-3.5 py-2 rounded-[10px]">
          ✏️ Bạn đang sửa lại nhật ký của một ngày trước — thay đổi sẽ được lưu lại bình thường.
        </div>
      )}

      <div className="flex-1 mx-4 sm:mx-7 mb-4 sm:mb-7">
        {loaded && (
          <DiaryEditor
            initialContent={entry?.contentJson ?? null}
            onChange={handleChange}
          />
        )}
      </div>
    </div>
  );
}
