"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SidebarToggle from "@/components/SidebarToggle";
import PhotoThumb from "@/components/photos/PhotoThumb";
import { useJournal } from "@/components/JournalProvider";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlayIcon } from "@/components/icons";
import CalendarIcon from "@/components/CalendarIcon";
import { apiFetch } from "@/lib/api-client";
import { toDateString } from "@/lib/dates";
import { isValidMonthParam } from "@/lib/validation";
import { currentMonth, monthLabelOf, shiftMonth } from "@/lib/memories";
import { CardsTab, fallbackCover, GridTab, TimelineTab } from "./MemoryCards";
import MonthCalendar from "./MonthCalendar";
import MonthPicker from "./MonthPicker";
import type { MemoryCard, MemoryTab, MonthData } from "./types";

const TABS: { key: MemoryTab; label: string }[] = [
  { key: "cards", label: "Thẻ" },
  { key: "grid", label: "Lưới ảnh" },
  { key: "timeline", label: "Dòng thời gian" },
];
const TAB_KEY = "diary.memoriesTab";

function readTab(): MemoryTab {
  try {
    const v = localStorage.getItem(TAB_KEY);
    return v === "grid" || v === "timeline" ? v : "cards";
  } catch {
    return "cards";
  }
}

const fmtDay = (date: string) => date.split("-").reverse().join("/");

function OnThisDay({ entry, compact }: { entry: MemoryCard; compact?: boolean }) {
  const { moods } = useJournal();
  const mood = moods.find((m) => m.id === entry.moodId);
  const cover = entry.coverThumbUrl ? (
    <PhotoThumb photo={{ url: entry.coverThumbUrl, color: entry.coverColor }} className="absolute inset-0" />
  ) : null;
  const meta = `${fmtDay(entry.date)}${entry.photoCount ? ` · ${entry.photoCount} ảnh` : ""}`;

  if (compact) {
    return (
      <Link
        href={`/memories/${entry.id}`}
        className="flex items-center gap-3 rounded-2xl border border-[#f5c9d5] bg-gradient-to-r from-[#fff0f4] to-[#ffe9dc] p-2.5"
      >
        <span className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: fallbackCover(mood) }}>
          {cover}
        </span>
        <span className="min-w-0">
          <span className="block text-[10.5px] font-bold uppercase tracking-wide text-[#c25576]">Hôm nay năm xưa</span>
          <span className="block truncate font-bold text-[#3a332c]">{entry.title || "Nhật ký"}</span>
          <span className="block text-[11.5px] text-[#8a7f73]">{meta}</span>
        </span>
      </Link>
    );
  }
  return (
    <div className="rounded-3xl border border-[#f5c9d5] bg-gradient-to-b from-[#fff0f4] to-[#ffe9dc] p-3.5">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[#c25576] mb-2.5">Hôm nay năm xưa</div>
      <div className="relative h-[130px] rounded-2xl overflow-hidden" style={{ background: fallbackCover(mood) }}>
        {cover}
      </div>
      <div className="mt-2.5 font-bold text-[#3a332c] leading-snug">{entry.title || "Nhật ký không tiêu đề"}</div>
      <div className="text-[12px] text-[#8a7f73]">{meta}</div>
      <Link
        href={`/memories/${entry.id}`}
        className="mt-3 block rounded-xl bg-[#e8829e] hover:bg-[#d96b89] py-2.5 text-center text-sm font-semibold text-white"
      >
        Xem lại ngày đó
      </Link>
    </div>
  );
}

// Kỷ niệm: one month at a time (cards / photo grid / timeline), a calendar,
// "on this day" from earlier years and a random-day button.
export default function MemoriesView() {
  const router = useRouter();
  const params = useSearchParams();
  const today = toDateString(new Date());
  const maxMonth = currentMonth();
  const fromUrl = params.get("month") ?? "";
  const month = isValidMonthParam(fromUrl) && fromUrl <= maxMonth ? fromUrl : maxMonth;

  const cache = useRef(new Map<string, MonthData>());
  const [data, setData] = useState<MonthData | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<MemoryTab>("cards");
  const [onThisDay, setOnThisDay] = useState<MemoryCard[]>([]);
  const [picker, setPicker] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [rolling, setRolling] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the saved tab after hydration
  useEffect(() => setTab(readTab()), []);

  useEffect(() => {
    const cached = cache.current.get(month);
    if (cached) return setData(cached);
    let cancelled = false;
    setData(null);
    setFailed(false);
    apiFetch(`/api/memories?month=${month}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: MonthData) => {
        cache.current.set(month, d);
        if (!cancelled) setData(d);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [month]);

  useEffect(() => {
    apiFetch(`/api/memories/on-this-day?today=${today}`)
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((d: { entries: MemoryCard[] }) => setOnThisDay(d.entries))
      .catch(() => {});
  }, [today]);

  const go = (m: string) => {
    setPicker(false);
    router.replace(`/memories?month=${m}`, { scroll: false });
  };

  function chooseTab(t: MemoryTab) {
    setTab(t);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {}
  }

  function jumpTo(date: string) {
    setSheet(false);
    // The photo grid has no section for days without photos.
    const el = document.getElementById(`mem-${date}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (tab === "grid") {
      chooseTab("cards");
      window.setTimeout(() => document.getElementById(`mem-${date}`)?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  async function random() {
    setRolling(true);
    const r = await apiFetch("/api/memories/random").catch(() => null);
    const d = r?.ok ? ((await r.json()) as { id: string | null }) : null;
    setRolling(false);
    if (d?.id) router.push(`/memories/${d.id}`);
  }

  const entries = data?.entries ?? [];
  const subtitle = data
    ? `${monthLabelOf(month)} · ${entries.length} nhật ký · ${data.photoTotal} ảnh`
    : monthLabelOf(month);
  const navBtn = "w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#5c5248] hover:bg-[#fff0f4] disabled:opacity-35";

  const monthNav = (
    <div className="relative flex items-center gap-1.5">
      <button type="button" aria-label="Tháng trước" className={navBtn} onClick={() => go(shiftMonth(month, -1))}>
        <ChevronLeftIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setPicker((v) => !v)}
        className="h-9 rounded-xl bg-white shadow-sm px-3 text-sm font-bold text-[#3a332c] hover:bg-[#fff0f4]"
      >
        {monthLabelOf(month)} <span className="text-[#a1968a]">▾</span>
      </button>
      <button
        type="button"
        aria-label="Tháng sau"
        className={navBtn}
        disabled={month >= maxMonth}
        onClick={() => go(shiftMonth(month, 1))}
      >
        <ChevronRightIcon className="w-4 h-4" />
      </button>
      {picker && <MonthPicker value={month} max={maxMonth} onPick={go} onClose={() => setPicker(false)} />}
    </div>
  );

  const tabs = (
    <div className="flex rounded-2xl bg-white p-1 shadow-sm">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => chooseTab(t.key)}
          className={`flex-1 md:flex-none rounded-xl px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors ${
            tab === t.key ? "bg-[#e8829e] text-white" : "text-[#5c5248] hover:bg-[#fff0f4]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const calendarCard = (
    <div className="rounded-3xl bg-white p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between mb-2.5">
        <span className="font-bold text-[#3a332c] font-[family-name:var(--font-lora)]">Tháng {Number(month.slice(5))}</span>
        <span className="text-[10.5px] text-[#a1968a]">Ô có ảnh là ngày có nhật ký</span>
      </div>
      <MonthCalendar month={month} entries={entries} today={today} onDay={jumpTo} />
    </div>
  );

  const randomBtn = (
    <button
      type="button"
      onClick={random}
      disabled={rolling}
      className="w-full rounded-2xl bg-[#3a2a24] hover:bg-[#2b1f1a] py-3.5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
    >
      <PlayIcon className="w-3.5 h-3.5" /> Lướt ngẫu nhiên một ngày
    </button>
  );

  let body;
  if (failed) body = <p className="py-16 text-center text-[#c0392b]">Không tải được kỷ niệm tháng này.</p>;
  else if (!data)
    body = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[260px] rounded-[22px] bg-white/60" />
        ))}
      </div>
    );
  else if (entries.length === 0)
    body = (
      <div className="py-16 text-center text-[#7a6f62] leading-relaxed">
        <div className="text-4xl mb-2">📖</div>
        {monthLabelOf(month)} chưa có nhật ký nào.
      </div>
    );
  else if (tab === "grid") body = <GridTab entries={entries} photos={data.photos} />;
  else if (tab === "timeline") body = <TimelineTab entries={entries} photos={data.photos} />;
  else body = <CardsTab entries={entries} />;

  return (
    <div className="h-full overflow-y-auto bg-[#fff4e4]">
      <div className="max-w-[1120px] mx-auto px-3 sm:px-6 pb-12">
        <header className="pt-4 pb-4 flex flex-wrap items-center gap-3">
          <SidebarToggle />
          <div className="min-w-0 mr-auto">
            <h1 className="text-[26px] sm:text-[30px] font-bold leading-tight text-[#3a332c] font-[family-name:var(--font-lora)]">
              Kỷ niệm
            </h1>
            <p className="text-[12.5px] text-[#8a7f73]">{subtitle}</p>
          </div>
          <div className="hidden md:block">{monthNav}</div>
          <div className="hidden md:block">{tabs}</div>
          <button
            type="button"
            aria-label="Lịch tháng"
            onClick={() => setSheet(true)}
            className="md:hidden w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center"
          >
            <CalendarIcon className="w-7 h-7" />
          </button>
        </header>

        <div className="md:hidden flex flex-col gap-3 mb-4">
          {onThisDay[0] && <OnThisDay entry={onThisDay[0]} compact />}
          <div className="flex justify-center">{monthNav}</div>
          {tabs}
        </div>

        <div className="flex gap-6 items-start">
          <main className="flex-1 min-w-0">{body}</main>
          <aside className="hidden md:flex w-[270px] shrink-0 flex-col gap-4 sticky top-4">
            {calendarCard}
            {onThisDay[0] && <OnThisDay entry={onThisDay[0]} />}
            {randomBtn}
          </aside>
        </div>
      </div>

      {sheet && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#3a332c]/25 flex items-end" onClick={() => setSheet(false)}>
          <div
            className="w-full rounded-t-3xl bg-[#fff4e4] p-4 pb-[max(16px,env(safe-area-inset-bottom))] flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              {monthNav}
              <button type="button" aria-label="Đóng" onClick={() => setSheet(false)} className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            {calendarCard}
            {randomBtn}
          </div>
        </div>
      )}
    </div>
  );
}
