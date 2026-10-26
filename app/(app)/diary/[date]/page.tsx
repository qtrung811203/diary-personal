"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import DiaryEditor from "@/components/DiaryEditor";
import BackgroundPicker from "@/components/BackgroundPicker";
import Calendar from "@/components/Calendar";
import CalendarIcon from "@/components/CalendarIcon";
import { DEFAULT_BACKGROUND_VALUE } from "@/lib/background";

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

  // Keyed by `date` so a route/date change derives loaded/loadError/entry
  // without ever calling setState synchronously inside the fetch effect
  // (only from its .then/.catch, which react-hooks/set-state-in-effect
  // treats as the external-system callback it's meant for).
  const [fetchResult, setFetchResult] = useState<{
    date: string;
    status: "loaded" | "error";
    entry: DiaryEntryResponse;
  } | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const entry = fetchResult?.date === date ? fetchResult.entry : null;
  const loaded = fetchResult?.date === date && fetchResult.status === "loaded";
  const loadError = fetchResult?.date === date && fetchResult.status === "error";
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [writtenDates, setWrittenDates] = useState<string[]>([]);
  const [calendarYear, calendarMonthInit] = date.split("-").map(Number);
  const [calendarMonth, setCalendarMonth] = useState(calendarMonthInit);
  const [calYear, setCalYear] = useState(calendarYear);

  useEffect(() => {
    const yyyymm = `${calYear}-${String(calendarMonth).padStart(2, "0")}`;
    fetch(`/api/diary/month/${yyyymm}`)
      .then((res) => (res.ok ? res.json() : { writtenDates: [] }))
      .then((data: { writtenDates: string[] }) =>
        setWrittenDates(data.writtenDates ?? [])
      );
    // Refetches whenever the calendar is (re)opened too, so a dot added by
    // an edit made since it was last open shows up without a page reload.
  }, [calYear, calendarMonth, calendarOpen]);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/diary/${date}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load entry: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setFetchResult({ date, status: "loaded", entry: data });
      })
      .catch(() => {
        // Do NOT fall back to an empty entry here — that would let the
        // first keystroke's autosave PUT overwrite whatever is actually
        // stored for this date. Show a retry prompt instead.
        if (!cancelled) setFetchResult({ date, status: "error", entry: null });
      });

    return () => {
      cancelled = true;
    };
  }, [date, retryTick]);

  function saveEntry(next: {
    contentJson?: JSONContent;
    backgroundType?: string;
    backgroundValue?: string;
  }) {
    const payload = {
      contentJson: next.contentJson ?? entry?.contentJson ?? {},
      backgroundType: next.backgroundType ?? entry?.backgroundType ?? "color",
      backgroundValue:
        next.backgroundValue ?? entry?.backgroundValue ?? DEFAULT_BACKGROUND_VALUE,
    };

    setSaveStatus("saving");
    fetch(`/api/diary/${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
        setSaveStatus("saved");
        setWrittenDates((prev) => (prev.includes(date) ? prev : [...prev, date]));
      })
      .catch(() => setSaveStatus("error"));
  }

  function handleChange(contentJson: JSONContent) {
    setFetchResult((prev) => ({
      date,
      status: "loaded",
      entry: {
        contentJson,
        backgroundType: prev?.entry?.backgroundType ?? "color",
        backgroundValue: prev?.entry?.backgroundValue ?? DEFAULT_BACKGROUND_VALUE,
      },
    }));
    saveEntry({ contentJson });
  }

  function handleBackgroundChange(type: "color" | "image", value: string) {
    setFetchResult((prev) => ({
      date,
      status: "loaded",
      entry: {
        contentJson: prev?.entry?.contentJson ?? {},
        backgroundType: type,
        backgroundValue: value,
      },
    }));
    saveEntry({ backgroundType: type, backgroundValue: value });
  }

  const background =
    entry?.backgroundType === "image"
      ? `url(${entry.backgroundValue}) center/cover fixed`
      : entry?.backgroundValue ?? DEFAULT_BACKGROUND_VALUE;

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 ease-out"
      style={{ background }}
    >
      {/* Two clean rows on mobile (date-nav, then actions) instead of one
          row that wraps mid-pill; collapses to a single row from sm: up. */}
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-7 sm:py-4.5">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Prev/next date nav — "xem nhật ký": always available, not just
              on past days, so browsing into yesterday doesn't require the
              calendar first. */}
          <button
            className="shrink-0 w-8.5 h-8.5 rounded-[10px] border border-white/60 bg-white shadow-sm text-sm"
            onClick={() => router.push(`/diary/${shiftDate(date, -1)}`)}
            title="Ngày trước"
          >
            ‹
          </button>

          {/* Flat pastel-pink pill, always on top of whatever background the
              day has (so it stays legible on dark picks too) — white text
              with a soft drop shadow, set in the same font as the editor.
              min-w-0 + truncate so a long date never breaks the pill onto a
              second line. */}
          <div className="flex-1 min-w-0 rounded-xl px-3.5 py-1.5 bg-[#FFF4DE]">
            <div className="text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase text-[#5c5248]/70 truncate">
              <span>{isToday ? "Hôm nay" : "Xem lại"}</span>
              {saveStatus === "saving" && <span className="normal-case font-normal text-[#5c5248]/70"> · Đang lưu…</span>}
              {saveStatus === "saved" && <span className="normal-case font-normal text-[#3f8a52]"> · Đã lưu</span>}
              {saveStatus === "error" && <span className="normal-case font-normal text-[#c0392b]"> · Lỗi lưu</span>}
            </div>
            <div className="text-sm sm:text-xl font-bold text-[#3a332c] font-[family-name:var(--font-lora)] truncate">
              {formatDisplayDate(date)}
            </div>
          </div>

          <button
            className="shrink-0 w-8.5 h-8.5 rounded-[10px] border border-white/60 bg-white shadow-sm text-sm"
            onClick={() => router.push(`/diary/${shiftDate(date, 1)}`)}
            title="Ngày sau"
          >
            ›
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {!isToday ? (
            <button
              className="text-xs font-bold text-[#e8829e] bg-white shadow-sm rounded-full px-2.5 py-1.5"
              onClick={() => router.push(`/diary/${todayDateString()}`)}
            >
              Về hôm nay
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <BackgroundPicker
              backgroundType={
                entry?.backgroundType === "image" ? "image" : "color"
              }
              backgroundValue={entry?.backgroundValue ?? DEFAULT_BACKGROUND_VALUE}
              onChange={handleBackgroundChange}
            />
            <button
              type="button"
              title="Xem nhật ký theo lịch"
              onClick={() => setCalendarOpen(true)}
              className="w-10 h-10 rounded-xl border border-white/60 bg-white shadow-sm flex items-center justify-center p-1.5"
            >
              <CalendarIcon className="w-full h-full" />
            </button>
          </div>
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

      {!isToday && !loadError && (
        <div className="mx-4 sm:mx-7 mb-3.5 bg-[#fff4e5] border border-[#f0d9c0] text-[#8a5a22] text-[12.5px] font-semibold px-3.5 py-2 rounded-[10px]">
          ✏️ Bạn đang sửa nhật ký ngày {formatDisplayDate(date)} — thay đổi sẽ được lưu lại bình thường.
        </div>
      )}

      {loadError && (
        <div className="mx-4 sm:mx-7 mb-3.5 bg-[#fdecea] border border-[#f3c6c0] text-[#c0392b] text-[12.5px] font-semibold px-3.5 py-2.5 rounded-[10px] flex items-center justify-between gap-3">
          <span>
            ⚠️ Không tải được nhật ký ngày này. Không có gì bị mất — hãy thử
            lại.
          </span>
          <button
            type="button"
            onClick={() => setRetryTick((n) => n + 1)}
            className="shrink-0 bg-white border border-[#f3c6c0] rounded-full px-3 py-1 text-xs font-bold"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="flex-1 mx-4 sm:mx-7 mb-4 sm:mb-7">
        {loaded && !loadError && (
          <DiaryEditor
            initialContent={entry?.contentJson ?? null}
            onChange={handleChange}
          />
        )}
        {/* Loading skeleton — switching days is a fetch, not instant, and
            leaving this blank while the background color also jumps looked
            like a jarring blank flash/stutter. Same shape as DiaryEditor so
            nothing shifts when the real content swaps in. */}
        {!loaded && !loadError && (
          <div className="flex flex-col gap-3 sm:gap-3.5 h-full animate-pulse">
            <div className="h-[52px] rounded-2xl bg-white/50" />
            <div className="flex-1 rounded-[18px] bg-white/40" />
          </div>
        )}
      </div>
    </div>
  );
}
