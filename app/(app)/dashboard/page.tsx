"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import SidebarToggle from "@/components/SidebarToggle";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { useJournal } from "@/components/JournalProvider";
import MoodCalendar from "@/components/dashboard/MoodCalendar";
import { Empty, GroupDonut, MoodBars, TrendChart, WeekdayChart } from "@/components/dashboard/Charts";
import type { DashboardData } from "@/components/dashboard/types";
import { addDays, monthRange, toDateString, weekRange } from "@/lib/dates";

type View = "week" | "month";

function periodLabel(view: View, anchor: string) {
  if (view === "month") return `Tháng ${Number(anchor.slice(5, 7))}, ${anchor.slice(0, 4)}`;
  const { start, end } = weekRange(anchor);
  const f = (d: string) => `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`;
  return `${f(start)} – ${f(end)}/${end.slice(0, 4)}`;
}

function shiftAnchor(view: View, anchor: string, dir: 1 | -1) {
  if (view === "week") return addDays(anchor, 7 * dir);
  const { start, end } = monthRange(anchor);
  return dir === 1 ? addDays(end, 1) : addDays(start, -1);
}

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-white border border-[#f1e7da] p-4 sm:p-5 ${className}`}>
      <h2 className="text-[13px] font-bold text-[#7a6f62] mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white border border-[#f1e7da] px-4 py-3.5">
      <div className="text-[11px] font-semibold text-[#a1968a]">{label}</div>
      <div className="text-2xl font-bold text-[#3a332c] mt-0.5 leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-[#a1968a] mt-0.5">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { entries } = useJournal();
  const [view, setView] = useState<View>("month");
  // Dates are the user's own local days; "today" comes from the browser.
  const [today] = useState(() => toDateString(new Date()));
  const [anchor, setAnchor] = useState(today);
  const [result, setResult] = useState<{ key: string; data: DashboardData | null } | null>(null);

  const key = `${view}|${anchor}`;
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dashboard?view=${view}&date=${anchor}&today=${today}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data) => {
        if (!cancelled) setResult({ key, data });
      });
    return () => {
      cancelled = true;
    };
  }, [view, anchor, today, key]);

  // Newest entry per date, so a calendar day opens that day's latest diary.
  const entryByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of entries) if (!map.has(e.date)) map.set(e.date, e.id);
    return map;
  }, [entries]);

  const data = result?.key === key ? result.data : null;
  const loading = result?.key !== key;
  const range = view === "week" ? weekRange(anchor) : monthRange(anchor);
  const showToday = today < range.start || today > range.end;

  return (
    <div className="h-full overflow-y-auto bg-[#fffaf3]">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-10">
        <header className="sticky top-0 z-10 bg-[#fffaf3]/95 py-3 flex items-center gap-2 flex-wrap">
          <SidebarToggle />
          <h1 className="text-xl font-bold text-[#3a332c] font-[family-name:var(--font-lora)] mr-1">Tổng quan</h1>

          <div className="flex rounded-xl bg-white border border-[#f1e7da] p-0.5">
            {(["week", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setView(v);
                  setAnchor(today);
                }}
                className={`px-3.5 py-1.5 rounded-[10px] text-sm font-semibold ${
                  view === v ? "bg-[#e8829e] text-white" : "text-[#7a6f62]"
                }`}
              >
                {v === "week" ? "Tuần" : "Tháng"}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAnchor((a) => shiftAnchor(view, a, -1))}
              title={view === "week" ? "Tuần trước" : "Tháng trước"}
              className="w-9 h-9 rounded-xl bg-white border border-[#f1e7da] text-[#7a6f62] flex items-center justify-center"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className="min-w-[8.5rem] text-center text-sm font-bold text-[#3a332c]">
              {periodLabel(view, anchor)}
            </span>
            <button
              type="button"
              onClick={() => setAnchor((a) => shiftAnchor(view, a, 1))}
              title={view === "week" ? "Tuần sau" : "Tháng sau"}
              className="w-9 h-9 rounded-xl bg-white border border-[#f1e7da] text-[#7a6f62] flex items-center justify-center"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
            {showToday && (
              <button
                type="button"
                onClick={() => setAnchor(today)}
                className="ml-1 rounded-xl bg-[#ffd1de] text-[#3a332c] text-xs font-bold px-3 h-9"
              >
                {view === "week" ? "Tuần này" : "Tháng này"}
              </button>
            )}
          </div>
        </header>

        {loading && (
          <div className="space-y-3 animate-pulse mt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[84px] rounded-2xl bg-white/70" />
              ))}
            </div>
            <div className="h-72 rounded-2xl bg-white/70" />
          </div>
        )}

        {!loading && !data && (
          <p className="text-center text-[#c0392b] py-16">Không tải được thống kê. Thử tải lại trang.</p>
        )}

        {data && (
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Số nhật ký" value={data.summary.entriesCount} sub={`${data.summary.daysWritten} ngày có viết`} />
              <Stat label="Số từ đã viết" value={data.summary.words.toLocaleString("vi-VN")} />
              <Stat
                label="Chuỗi ngày viết"
                value={<>🔥 {data.streaks.current}</>}
                sub={`Dài nhất: ${data.streaks.longest} ngày`}
              />
              <Stat
                label="Tâm trạng nổi bật"
                value={
                  data.summary.topMood ? (
                    <span className="flex items-center gap-1.5 text-lg">
                      <span className="text-2xl">{data.summary.topMood.icon}</span>
                      {data.summary.topMood.name}
                    </span>
                  ) : (
                    "–"
                  )
                }
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-3">
              <Card title="Lịch tâm trạng">
                <MoodCalendar
                  days={data.days}
                  view={data.view}
                  today={data.today}
                  dailyMoods={data.dailyMoods}
                  entryByDate={entryByDate}
                />
              </Card>

              <div className="space-y-3">
                <Card title="Phân bố nhóm cảm xúc">
                  <GroupDonut dist={data.groupDistribution} />
                </Card>
                <Card title="Tâm trạng hay gặp nhất">
                  <MoodBars dist={data.moodDistribution} />
                </Card>
              </div>
            </div>

            <Card title="Xu hướng cảm xúc theo ngày">
              <TrendChart valence={data.valence} />
            </Card>

            <div className="grid lg:grid-cols-2 gap-3">
              <Card title="Tâm trạng theo thứ trong tuần (90 ngày gần đây)">
                <WeekdayChart weekday={data.weekday} />
              </Card>

              <Card title="Ngày này những năm trước">
                {data.onThisDay.length === 0 ? (
                  <Empty text="Chưa có nhật ký nào vào đúng ngày này ở các năm trước." />
                ) : (
                  <ul className="space-y-2">
                    {data.onThisDay.map((e) => (
                      <li key={e.id}>
                        <Link
                          href={`/diary/${e.id}`}
                          className="block rounded-xl bg-[#fffaf3] hover:bg-[#fff0f4] px-3.5 py-2.5"
                        >
                          <div className="text-[11px] font-bold text-[#e8829e]">
                            {e.yearsAgo} năm trước · {e.date.slice(8)}/{e.date.slice(5, 7)}/{e.date.slice(0, 4)}
                          </div>
                          <div className="font-bold text-[#3a332c] truncate">{e.title || "Nhật ký không tiêu đề"}</div>
                          {e.preview && <div className="text-[13px] text-[#6f655a] line-clamp-2">{e.preview}</div>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
