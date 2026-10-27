"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CalendarIcon from "./CalendarIcon";
import { ChevronLeftIcon, PlusIcon } from "./icons";
import { useJournal, type EntrySummary } from "./JournalProvider";
import { weekdayShort } from "@/lib/dates";

const timeFormat = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });

function monthLabel(date: string) {
  const [y, m] = date.split("-");
  return `Tháng ${Number(m)}, ${y}`;
}

function groupByMonth(entries: EntrySummary[]) {
  const groups: { label: string; items: EntrySummary[] }[] = [];
  for (const e of entries) {
    const label = monthLabel(e.date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(e);
    else groups.push({ label, items: [e] });
  }
  return groups;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { entries, entriesLoaded, moods, desktopOpen, mobileOpen, toggleSidebar, closeSidebarOnMobile, createEntry, creating } =
    useJournal();

  const moodById = new Map(moods.map((m) => [m.id, m]));
  const activeId = pathname.startsWith("/diary/") ? pathname.split("/")[2] : null;
  const onDashboard = pathname.startsWith("/dashboard");

  // Mobile: a drawer that starts closed. Desktop: open unless the user hid it.
  const visibility = `${mobileOpen ? "flex" : "hidden"} ${desktopOpen === false ? "md:hidden" : "md:flex"}`;

  return (
    <>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/30" onClick={toggleSidebar} />
      )}
      <aside
        className={`${visibility} flex-col fixed inset-y-0 left-0 z-30 w-[86vw] max-w-[340px] bg-white border-r border-[#f1e7da] md:static md:z-auto md:w-80 md:max-w-none md:shrink-0 h-dvh`}
      >
        <div className="flex items-center gap-2 px-3 py-3 border-b border-[#f1e7da]">
          <button
            type="button"
            onClick={toggleSidebar}
            title="Ẩn thanh bên"
            className="w-9 h-9 rounded-xl text-[#7a6f62] hover:bg-[#fff0f4] flex items-center justify-center"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="flex-1 font-bold text-[#3a332c] font-[family-name:var(--font-lora)] text-lg">Nhật ký</h1>
          <button
            type="button"
            onClick={createEntry}
            disabled={creating}
            title="Viết nhật ký hôm nay"
            className="w-9 h-9 rounded-xl bg-[#e8829e] hover:bg-[#d96b89] text-white flex items-center justify-center shadow-sm disabled:opacity-60"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        <Link
          href="/dashboard"
          onClick={closeSidebarOnMobile}
          className={`mx-3 mt-3 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold ${
            onDashboard ? "bg-[#ffd1de] text-[#3a332c]" : "text-[#5c5248] hover:bg-[#fff0f4]"
          }`}
        >
          <CalendarIcon className="w-7 h-7 shrink-0" />
          Tổng quan
        </Link>

        <div className="flex-1 overflow-y-auto mt-2 pb-4">
          {!entriesLoaded && (
            <div className="px-3 space-y-2 animate-pulse">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[84px] rounded-xl bg-[#faf3ea]" />
              ))}
            </div>
          )}

          {entriesLoaded && entries.length === 0 && (
            <p className="px-5 py-8 text-sm text-[#7a6f62] text-center leading-relaxed">
              Chưa có nhật ký nào.
              <br />
              Bấm nút <b>+</b> để viết nhật ký hôm nay.
            </p>
          )}

          {groupByMonth(entries).map((group) => (
            <section key={group.label}>
              <div className="sticky top-0 z-10 bg-white/95 px-5 py-1.5 text-[11px] font-bold tracking-wide uppercase text-[#a1968a]">
                {group.label}
              </div>
              <ul className="px-2">
                {group.items.map((e) => {
                  const active = e.id === activeId;
                  const mood = e.moodId ? moodById.get(e.moodId) : undefined;
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/diary/${e.id}`}
                        onClick={closeSidebarOnMobile}
                        className={`flex gap-3 rounded-xl px-3 py-2.5 mb-0.5 transition-colors ${
                          active ? "bg-[#e8829e] text-white" : "hover:bg-[#fff0f4] text-[#3a332c]"
                        }`}
                      >
                        <div className="w-9 shrink-0 text-center leading-none pt-0.5">
                          <div className={`text-[11px] font-bold ${active ? "text-white/90" : "text-[#e8829e]"}`}>
                            {weekdayShort(e.date)}
                          </div>
                          <div className="text-[22px] font-bold mt-1">{Number(e.date.slice(8))}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`font-bold truncate ${e.title ? "" : "italic font-medium opacity-60"}`}>
                            {e.title || "Nhật ký mới"}
                          </div>
                          {e.preview && (
                            <div className={`text-[13px] leading-snug line-clamp-2 mt-0.5 ${active ? "text-white/90" : "text-[#6f655a]"}`}>
                              {e.preview}
                            </div>
                          )}
                          <div className={`text-[11px] mt-1 flex items-center gap-1.5 ${active ? "text-white/85" : "text-[#a1968a]"}`}>
                            <span>{timeFormat.format(new Date(e.createdAt))}</span>
                            {mood && (
                              <span className="truncate">
                                · {mood.icon} {mood.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </aside>
    </>
  );
}
