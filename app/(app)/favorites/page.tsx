"use client";

import Link from "next/link";
import SidebarToggle from "@/components/SidebarToggle";
import { HeartIcon } from "@/components/icons";
import { useJournal } from "@/components/JournalProvider";
import { groupByMonth } from "@/lib/entry-dates";
import { weekdayShort } from "@/lib/dates";

export default function FavoritesPage() {
  const { entries, entriesLoaded, moods } = useJournal();
  const favorites = entries.filter((e) => e.isFavorite);
  const moodById = new Map(moods.map((m) => [m.id, m]));

  return (
    <div className="h-full overflow-y-auto bg-[#fffaf3]">
      <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-10">
        <header className="sticky top-0 z-10 bg-[#fffaf3]/95 py-3 flex items-center gap-2">
          <SidebarToggle />
          <h1 className="text-xl font-bold text-[#3a332c] font-[family-name:var(--font-lora)] flex items-center gap-2">
            <HeartIcon filled className="w-5 h-5 text-[#e8829e]" />
            Yêu thích
          </h1>
          {favorites.length > 0 && <span className="text-sm text-[#a1968a] font-semibold">{favorites.length}</span>}
        </header>

        {!entriesLoaded && (
          <div className="space-y-2 animate-pulse mt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[84px] rounded-2xl bg-white/70" />
            ))}
          </div>
        )}

        {entriesLoaded && favorites.length === 0 && (
          <div className="text-center text-[#7a6f62] py-20 leading-relaxed">
            <div className="text-4xl mb-2 text-[#ffd1de]">♡</div>
            Chưa có nhật ký yêu thích nào.
            <br />
            Bấm trái tim trong một nhật ký để lưu vào đây.
          </div>
        )}

        {groupByMonth(favorites).map((group) => (
          <section key={group.label} className="mt-3">
            <h2 className="px-1 pb-1.5 text-[11px] font-bold tracking-wide uppercase text-[#a1968a]">{group.label}</h2>
            <ul className="space-y-2">
              {group.items.map((e) => {
                const mood = e.moodId ? moodById.get(e.moodId) : undefined;
                return (
                  <li key={e.id}>
                    <Link
                      href={`/diary/${e.id}`}
                      className="flex gap-3 rounded-2xl bg-white border border-[#f1e7da] hover:bg-[#fff0f4] px-4 py-3"
                    >
                      <div className="w-10 shrink-0 text-center leading-none pt-0.5">
                        <div className="text-[11px] font-bold text-[#e8829e]">{weekdayShort(e.date)}</div>
                        <div className="text-[22px] font-bold mt-1 text-[#3a332c]">{Number(e.date.slice(8))}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`font-bold truncate text-[#3a332c] ${e.title ? "" : "italic font-medium opacity-60"}`}>
                          {e.title || "Nhật ký không tiêu đề"}
                        </div>
                        {e.preview && <div className="text-[13px] text-[#6f655a] leading-snug line-clamp-2 mt-0.5">{e.preview}</div>}
                        {mood && (
                          <div className="text-[11px] text-[#a1968a] mt-1">
                            {mood.icon} {mood.name}
                          </div>
                        )}
                      </div>
                      <HeartIcon filled className="w-4 h-4 shrink-0 text-[#e8829e] mt-1" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
