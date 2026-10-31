"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { lockNow, setUnlockToken } from "@/lib/api-client";
import CalendarIcon from "./CalendarIcon";
import { BookIcon, ChevronLeftIcon, HeartIcon, PlusIcon } from "./icons";
import { useJournal } from "./JournalProvider";
import { groupByMonth } from "@/lib/entry-dates";
import { weekdayShort } from "@/lib/dates";
import PhotoThumb from "@/components/photos/PhotoThumb";

const timeFormat = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });

export default function Sidebar() {
  const pathname = usePathname();
  const { entries, entriesLoaded, moods, desktopOpen, mobileOpen, toggleSidebar, closeSidebarOnMobile, createEntry, creating } =
    useJournal();

  const moodById = new Map(moods.map((m) => [m.id, m]));
  const activeId = /^\/(diary|memories)\/[^/]+/.test(pathname) ? pathname.split("/")[2] : null;
  const onDashboard = pathname.startsWith("/dashboard");
  const onFavorites = pathname.startsWith("/favorites");
  const onMemories = pathname.startsWith("/memories");
  const favoriteCount = entries.filter((e) => e.isFavorite).length;

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
            onClick={() => void createEntry()}
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

        <Link
          href="/favorites"
          onClick={closeSidebarOnMobile}
          className={`mx-3 mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold ${
            onFavorites ? "bg-[#ffd1de] text-[#3a332c]" : "text-[#5c5248] hover:bg-[#fff0f4]"
          }`}
        >
          <span className="w-7 h-7 shrink-0 flex items-center justify-center text-[#e8829e]">
            <HeartIcon filled className="w-5 h-5" />
          </span>
          <span className="flex-1">Yêu thích</span>
          {favoriteCount > 0 && <span className="text-xs font-bold text-[#a1968a]">{favoriteCount}</span>}
        </Link>

        <Link
          href="/memories"
          onClick={closeSidebarOnMobile}
          className={`mx-3 mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold ${
            onMemories ? "bg-[#ffd1de] text-[#3a332c]" : "text-[#5c5248] hover:bg-[#fff0f4]"
          }`}
        >
          <span className="w-7 h-7 shrink-0 flex items-center justify-center text-[#e8829e]">
            <BookIcon className="w-5 h-5" />
          </span>
          Kỷ niệm
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

          {groupByMonth(entries).map((group, i) => (
            // A month can come up twice when a backdated entry sorts between others.
            <section key={`${group.label}-${i}`}>
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
                            {e.photoCount > 0 && <span className="shrink-0">· {e.photoCount} ảnh</span>}
                            {mood && (
                              <span className="truncate">
                                · {mood.icon} {mood.name}
                              </span>
                            )}
                          </div>
                        </div>
                        {e.coverThumbUrl && (
                          <PhotoThumb
                            photo={{ url: e.coverThumbUrl, color: e.coverColor }}
                            className={`w-11 h-11 rounded-xl shrink-0 self-center ${active ? "ring-2 ring-white/70" : ""}`}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="flex gap-2 border-t border-[#f1e7da] p-3">
          <button
            type="button"
            onClick={() => {
              closeSidebarOnMobile();
              lockNow();
            }}
            className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold text-[#5c5248] hover:bg-[#fff0f4] flex items-center justify-center gap-1.5"
          >
            🔒 Khoá ngay
          </button>
          <button
            type="button"
            onClick={() => {
              setUnlockToken(null);
              void signOut({ callbackUrl: "/login" });
            }}
            className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold text-[#5c5248] hover:bg-[#fff0f4] flex items-center justify-center gap-1.5"
          >
            ↩ Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
