"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import FavoriteButton from "@/components/FavoriteButton";
import SidebarToggle from "@/components/SidebarToggle";
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon } from "@/components/icons";
import { useJournal } from "@/components/JournalProvider";
import { useEntryMusic } from "@/components/music/MusicProvider";
import { MiniPlayer, MusicCard } from "@/components/music/DayMusic";
import Lightbox from "@/components/photos/Lightbox";
import type { Photo } from "@/hooks/useEntryPhotos";
import { apiFetch } from "@/lib/api-client";
import { DEFAULT_EDITOR_FONT, editorFontStack, isEditorFont } from "@/lib/fonts";
import { isPhotoLayout } from "@/lib/photos";
import { longDateLabel, shortDayLabel } from "@/lib/memories";
import EntryPhotos from "./EntryPhotos";
import ReadOnlyText from "./ReadOnlyText";

type Entry = {
  id: string;
  date: string;
  createdAt: string;
  title: string;
  contentJson: JSONContent;
  moodId: string | null;
  isFavorite: boolean;
  fontFamily: string;
  backgroundValue: string;
  photos: Photo[];
  coverPhotoId: string | null;
  photoLayout: string;
  trackId: string | null;
};

const timeFormat = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });

// Revisiting an entry: big cover, the text, photos in the chosen layout and
// the day's music (autoplays when set). Editing happens on /diary/[id].
export default function EntryReader({ id }: { id: string }) {
  const router = useRouter();
  const { entries, moods, patchEntry } = useJournal();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [failed, setFailed] = useState<"missing" | "error" | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const track = useEntryMusic(entry?.trackId ?? null);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/diary/${id}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) return setFailed("missing");
        if (!res.ok) return setFailed("error");
        setEntry(await res.json());
      })
      .catch(() => !cancelled && setFailed("error"));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Neighbours in the sidebar's (newest-first) list.
  const index = entries.findIndex((e) => e.id === id);
  const older = index >= 0 ? entries[index + 1] : undefined;
  const newer = index > 0 ? entries[index - 1] : undefined;

  if (failed) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-[#7a6f62] bg-[#fff4e4]">
        <p>{failed === "missing" ? "Không tìm thấy nhật ký này." : "Không tải được nhật ký."}</p>
        <Link href="/memories" className="text-[#e8829e] font-semibold">
          Về Kỷ niệm
        </Link>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="h-full bg-[#fff4e4] p-4 sm:p-8 animate-pulse">
        <div className="max-w-[1080px] mx-auto flex flex-col gap-4">
          <div className="h-10 w-40 rounded-xl bg-white/70" />
          <div className="h-[300px] rounded-3xl bg-white/60" />
          <div className="h-40 rounded-3xl bg-white/50" />
        </div>
      </div>
    );
  }

  const cover = entry.photos.find((p) => p.id === entry.coverPhotoId) ?? entry.photos[0] ?? null;
  const layout = isPhotoLayout(entry.photoLayout) ? entry.photoLayout : "cover";
  const mood = entry.moodId ? moods.find((m) => m.id === entry.moodId) : undefined;
  const title = entry.title || "Nhật ký không tiêu đề";
  const dateLine = `${longDateLabel(entry.date)} · ${timeFormat.format(new Date(entry.createdAt))}`;
  // "29 tháng 10", plus the year when it isn't this entry's year.
  const dayLabel = (date: string) =>
    date.slice(0, 4) === entry.date.slice(0, 4) ? shortDayLabel(date) : `${shortDayLabel(date)}, ${date.slice(0, 4)}`;
  const fontKey = isEditorFont(entry.fontFamily) ? entry.fontFamily : DEFAULT_EDITOR_FONT;
  const open = (p: Photo) => setViewing(Math.max(0, entry.photos.findIndex((x) => x.id === p.id)));

  function favorite(isFavorite: boolean) {
    setEntry((e) => (e ? { ...e, isFavorite } : e));
    patchEntry(id, { isFavorite });
    void apiFetch(`/api/diary/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite }),
    });
  }

  const pill =
    "h-10 rounded-xl bg-white shadow-sm px-3 flex items-center gap-1.5 text-sm font-semibold text-[#3a332c] hover:bg-[#fff0f4]";
  const circle = "w-11 h-11 rounded-full bg-white/90 shadow-md text-[#3a332c] flex items-center justify-center";

  return (
    <div className="h-full overflow-y-auto bg-[#fff4e4]">
      {/* Top bar (desktop) */}
      <div className="hidden md:flex max-w-[1080px] mx-auto items-center gap-2 px-6 pt-5 pb-4">
        <SidebarToggle />
        <button type="button" aria-label="Quay lại" onClick={() => router.back()} className={`${pill} w-10 justify-center px-0`}>
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="ml-auto flex items-center gap-2">
          {older && (
            <Link href={`/memories/${older.id}`} className={pill}>
              <ChevronLeftIcon className="w-4 h-4" /> {dayLabel(older.date)}
            </Link>
          )}
          {newer && (
            <Link href={`/memories/${newer.id}`} className={pill}>
              {dayLabel(newer.date)} <ChevronRightIcon className="w-4 h-4" />
            </Link>
          )}
          <Link href={`/diary/${id}`} className={pill}>
            <PencilIcon className="w-4 h-4 text-[#e8829e]" /> Chỉnh sửa
          </Link>
          <FavoriteButton value={entry.isFavorite} onChange={favorite} />
        </div>
      </div>

      <div className={`max-w-[1080px] mx-auto md:px-6 pb-28 md:pb-10 flex gap-6 items-start ${track ? "" : "justify-center"}`}>
        <article className={`flex-1 min-w-0 md:rounded-[28px] bg-[#fffaf5] md:shadow-[0_8px_30px_rgba(58,42,36,0.08)] overflow-hidden ${track ? "" : "max-w-[780px]"}`}>
          {/* Hero */}
          <div
            className="relative h-[340px] md:h-[300px] bg-cover bg-center"
            style={{
              backgroundColor: cover?.color ?? "#f4b6c4",
              backgroundImage: cover
                ? `url(${cover.url})`
                : "linear-gradient(135deg, #f8c79a 0%, #e8829e 60%, #c97b9f 100%)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#3a2a24]/70" />
            {/* Phone: buttons over the photo */}
            <div className="md:hidden absolute top-0 inset-x-0 flex items-center justify-between p-4 pt-[max(16px,env(safe-area-inset-top))]">
              <button type="button" aria-label="Quay lại" onClick={() => router.back()} className={circle}>
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                <Link href={`/diary/${id}`} aria-label="Chỉnh sửa" className={circle}>
                  <PencilIcon className="w-4 h-4" />
                </Link>
                <FavoriteButton value={entry.isFavorite} onChange={favorite} />
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 px-5 md:px-7 pb-8 md:pb-6 text-white">
              <div className="text-[11px] md:text-xs font-bold uppercase tracking-wide opacity-90">{dateLine}</div>
              <h1 style={{ fontFamily: editorFontStack(fontKey) }} className="mt-1.5 text-[28px] md:text-[34px] font-bold leading-tight drop-shadow-sm">{title}</h1>
            </div>
          </div>

          <div className="relative -mt-5 md:mt-0 rounded-t-[24px] md:rounded-none bg-[#fffaf5] px-5 md:px-7 pt-5 pb-8 flex flex-col gap-5">
            {mood && (
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#fbe9d6] px-3 py-1 text-[12px] font-semibold text-[#5c5248]">
                  {mood.icon} {mood.name}
                </span>
              </div>
            )}
            <ReadOnlyText doc={entry.contentJson} fontKey={fontKey} />
            <EntryPhotos photos={entry.photos} coverId={cover?.id ?? null} layout={layout} onOpen={open} />
          </div>
        </article>

        {track && (
          <aside className="hidden md:block w-[260px] shrink-0 sticky top-5">
            <MusicCard track={track} />
          </aside>
        )}
      </div>

      {/* Phone: music bar + previous / next day */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 flex items-center gap-2 pointer-events-none">
        {older ? (
          <Link href={`/memories/${older.id}`} aria-label="Ngày trước" className={`${circle} pointer-events-auto shrink-0`}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
        ) : (
          <span className="w-11 shrink-0" />
        )}
        <div className="flex-1 min-w-0 pointer-events-auto">{track && <MiniPlayer track={track} />}</div>
        {newer ? (
          <Link href={`/memories/${newer.id}`} aria-label="Ngày sau" className={`${circle} pointer-events-auto shrink-0`}>
            <ChevronRightIcon className="w-5 h-5" />
          </Link>
        ) : (
          <span className="w-11 shrink-0" />
        )}
      </div>

      {viewing !== null && (
        <Lightbox photos={entry.photos} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
