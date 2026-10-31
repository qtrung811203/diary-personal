"use client";

import Link from "next/link";
import PhotoThumb from "@/components/photos/PhotoThumb";
import { HeartIcon, ImageIcon } from "@/components/icons";
import { useJournal, type Mood } from "@/components/JournalProvider";
import { weekdayShort } from "@/lib/dates";
import { MOOD_GROUP_META } from "@/lib/moods";
import { shortDayLabel } from "@/lib/memories";
import type { MemoryCard, MemoryPhoto } from "./types";

// Cover for an entry without photos: a soft gradient in its mood's colour.
export function fallbackCover(mood: Mood | undefined) {
  const c = mood ? MOOD_GROUP_META[mood.group].color : "#e8829e";
  return `linear-gradient(135deg, #fde2c8 0%, ${c} 100%)`;
}

const anchor = (e: MemoryCard, first: boolean) => (first ? { id: `mem-${e.date}` } : {});

function DateBadge({ date }: { date: string }) {
  return (
    <span className="absolute top-3 left-3 w-11 rounded-xl bg-white/95 text-center leading-none py-1.5 shadow-sm">
      <span className="block text-[10px] font-bold text-[#e8829e]">{weekdayShort(date)}</span>
      <span className="block text-[19px] font-bold text-[#3a332c] mt-0.5">{Number(date.slice(8))}</span>
    </span>
  );
}

function MoodChip({ mood }: { mood: Mood | undefined }) {
  if (!mood) return null;
  return (
    <span className="inline-block rounded-full bg-[#fbe9d6] px-2.5 py-1 text-[11.5px] font-semibold text-[#5c5248]">
      {mood.icon} {mood.name}
    </span>
  );
}

// Each day's first card carries an id so the calendar can scroll to it.
const firstOfDay = (list: { date: string }[]) => {
  const seen = new Set<string>();
  return list.map((e) => !seen.has(e.date) && !!seen.add(e.date));
};

export function CardsTab({ entries }: { entries: MemoryCard[] }) {
  const { moods } = useJournal();
  const firsts = firstOfDay(entries);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {entries.map((e, i) => {
        const mood = moods.find((m) => m.id === e.moodId);
        return (
          <Link
            key={e.id}
            {...anchor(e, firsts[i])}
            href={`/memories/${e.id}`}
            className="scroll-mt-24 group rounded-[22px] bg-[#fffaf5] overflow-hidden shadow-[0_4px_18px_rgba(58,42,36,0.07)] hover:shadow-[0_8px_26px_rgba(58,42,36,0.13)] transition-shadow"
          >
            <div className="relative h-[150px] sm:h-[160px]" style={{ background: e.coverThumbUrl ? undefined : fallbackCover(mood) }}>
              {e.coverThumbUrl && (
                <PhotoThumb photo={{ url: e.coverThumbUrl, color: e.coverColor }} className="absolute inset-0" />
              )}
              <DateBadge date={e.date} />
              {e.photoCount > 0 && (
                <span className="absolute top-3 right-3 rounded-full bg-[#3a2a24]/55 px-2 py-1 text-[11px] font-bold text-white flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" /> {e.photoCount}
                </span>
              )}
              {e.isFavorite && (
                <span className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-white/90 text-[#e8829e] flex items-center justify-center">
                  <HeartIcon filled className="w-4 h-4" />
                </span>
              )}
            </div>
            <div className="p-4 pt-3.5">
              <h3 className="font-bold text-[17px] text-[#3a332c] font-[family-name:var(--font-lora)] truncate">
                {e.title || "Nhật ký không tiêu đề"}
              </h3>
              {e.preview && <p className="mt-1 text-[13px] leading-snug text-[#6f655a] line-clamp-2">{e.preview}</p>}
              <div className="mt-3">
                <MoodChip mood={mood} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function GridTab({ entries, photos }: { entries: MemoryCard[]; photos: MemoryPhoto[] }) {
  const byEntry = new Map<string, MemoryPhoto[]>();
  for (const p of photos) byEntry.set(p.entryId, [...(byEntry.get(p.entryId) ?? []), p]);
  const days: { date: string; items: { entry: MemoryCard; photo: MemoryPhoto }[] }[] = [];
  for (const e of entries) {
    const items = (byEntry.get(e.id) ?? []).map((photo) => ({ entry: e, photo }));
    if (items.length === 0) continue;
    const last = days[days.length - 1];
    if (last?.date === e.date) last.items.push(...items);
    else days.push({ date: e.date, items });
  }
  if (days.length === 0) {
    return <p className="py-16 text-center text-[#7a6f62]">Tháng này chưa có ảnh nào.</p>;
  }
  return (
    <div className="flex flex-col gap-5">
      {days.map((d) => (
        <section key={d.date} id={`mem-${d.date}`} className="scroll-mt-24">
          <div className="mb-2 text-[12px] font-bold text-[#8a7f73]">
            {weekdayShort(d.date)} · {shortDayLabel(d.date)}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {d.items.map(({ entry, photo }) => (
              <Link key={photo.id} href={`/memories/${entry.id}`} title={entry.title}>
                <PhotoThumb photo={photo} className="aspect-square rounded-2xl hover:opacity-90" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function TimelineTab({ entries, photos }: { entries: MemoryCard[]; photos: MemoryPhoto[] }) {
  const { moods } = useJournal();
  const firsts = firstOfDay(entries);
  return (
    <ol className="relative ml-3 border-l-2 border-dashed border-[#f0c4cf]">
      {entries.map((e, i) => {
        const mood = moods.find((m) => m.id === e.moodId);
        const own = photos.filter((p) => p.entryId === e.id).slice(0, 6);
        return (
          <li key={e.id} {...anchor(e, firsts[i])} className="scroll-mt-24 relative pl-6 pb-6">
            <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[#e8829e] ring-4 ring-[#fff4e4]" />
            {firsts[i] && (
              <div className="text-[12px] font-bold uppercase tracking-wide text-[#c25576]">
                {weekdayShort(e.date)} · {shortDayLabel(e.date)}
              </div>
            )}
            <Link href={`/memories/${e.id}`} className="mt-1.5 block rounded-2xl bg-[#fffaf5] p-4 shadow-[0_4px_14px_rgba(58,42,36,0.06)] hover:shadow-[0_6px_20px_rgba(58,42,36,0.12)]">
              <div className="flex items-start gap-2">
                <h3 className="flex-1 font-bold text-[#3a332c] font-[family-name:var(--font-lora)]">
                  {e.title || "Nhật ký không tiêu đề"}
                </h3>
                {e.isFavorite && <HeartIcon filled className="w-4 h-4 text-[#e8829e] shrink-0 mt-1" />}
              </div>
              {e.preview && <p className="mt-1 text-[13px] leading-snug text-[#6f655a] line-clamp-2">{e.preview}</p>}
              {own.length > 0 && (
                <div className="mt-3 flex gap-1.5">
                  {own.map((p) => (
                    <PhotoThumb key={p.id} photo={p} className="w-14 h-14 rounded-xl" />
                  ))}
                  {e.photoCount > own.length && (
                    <span className="w-14 h-14 rounded-xl bg-[#fbe9d6] text-[12px] font-bold text-[#8a7f73] flex items-center justify-center">
                      +{e.photoCount - own.length}
                    </span>
                  )}
                </div>
              )}
              <div className="mt-2.5">
                <MoodChip mood={mood} />
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
