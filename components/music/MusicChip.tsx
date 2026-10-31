"use client";

import { useRef, useState } from "react";
import { CloseIcon, MusicIcon, PauseIcon, PencilIcon, PlayIcon, TrashIcon } from "@/components/icons";
import { useMusic, type Track } from "./MusicProvider";
import { formatTime, Progress, statusLabel, Vinyl } from "./Vinyl";
import SpotifyEmbed from "./SpotifyEmbed";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2.5 text-[13px] font-semibold text-[#3a332c] cursor-pointer">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`relative w-10 h-6 rounded-full transition-colors ${on ? "bg-[#e8829e]" : "bg-[#e7ddd0]"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function TrackRow({
  track,
  selected,
  onPick,
}: {
  track: Track;
  selected: boolean;
  onPick: () => void;
}) {
  const { renameTrack, deleteTrack } = useMusic();
  const small = "w-7 h-7 rounded-lg flex items-center justify-center text-[#8a7f73] hover:bg-white";
  return (
    <div
      className={`group flex items-center gap-2 rounded-xl px-3 py-2 ${
        selected ? "bg-[#ffd1de]" : "bg-white/70 hover:bg-white"
      }`}
    >
      <button type="button" onClick={onPick} className="flex-1 min-w-0 text-left">
        <div className="truncate text-[13px] font-semibold text-[#3a332c]">{track.title}</div>
        <div className="text-[11px] text-[#8a7f73]">{track.provider === "youtube" ? "YouTube" : "Spotify"}</div>
      </button>
      <button
        type="button"
        title="Đổi tên"
        className={small}
        onClick={() => {
          const title = window.prompt("Tên bài hát", track.title)?.trim();
          if (title) void renameTrack(track.id, title);
        }}
      >
        <PencilIcon className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        title="Xoá khỏi thư viện"
        className={`${small} hover:text-[#c0392b]`}
        onClick={() => {
          if (window.confirm(`Xoá "${track.title}" khỏi thư viện nhạc? Các nhật ký đang dùng bài này sẽ không còn nhạc.`))
            void deleteTrack(track.id);
        }}
      >
        <TrashIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// The entry's music in the writing page header: a chip that plays / pauses,
// and opens the library to pick, add (paste a link) or remove music.
export default function MusicChip({
  track,
  onChange,
}: {
  track: Track | null;
  onChange: (trackId: string | null) => void;
}) {
  const music = useMusic();
  const { status, time, duration, autoplay, setAutoplay, tracks, addTrack, toggle, seek } = music;
  const playing = status === "playing" && music.current?.id === track?.id;
  const btnRef = useRef<HTMLDivElement>(null);
  // null = closed; desktop opens a popover under the chip, phones a bottom sheet.
  const [pos, setPos] = useState<{ left: number; top: number; desktop: boolean } | null>(null);
  const [link, setLink] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open() {
    if (pos) return setPos(null);
    const r = btnRef.current!.getBoundingClientRect();
    setPos({ left: Math.min(Math.max(r.left, 8), window.innerWidth - 348), top: r.bottom + 8, desktop: window.innerWidth >= 768 });
  }

  async function add() {
    if (!link.trim() || adding) return;
    setAdding(true);
    setError(null);
    const res = await addTrack(link);
    setAdding(false);
    if (!res.ok) return setError(res.error);
    setLink("");
    onChange(res.value.id);
  }

  return (
    <>
      <div
        ref={btnRef}
        className={`h-10 rounded-xl border bg-white shadow-sm flex items-center gap-1 pl-1.5 pr-2 ${
          pos ? "border-[#e8829e]" : "border-white/60"
        }`}
      >
        {track ? (
          <>
            <Vinyl track={track} playing={playing} size={28} />
            {track.provider === "youtube" && (
              <button
                type="button"
                aria-label={playing ? "Tạm dừng" : "Phát"}
                onClick={toggle}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white bg-[#e8829e] ${
                  status === "blocked" ? "animate-pulse" : ""
                }`}
              >
                {playing ? <PauseIcon className="w-3.5 h-3.5" /> : <PlayIcon className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={open}
              aria-label="Chọn nhạc"
              className="flex items-center gap-1 pl-1 text-sm font-semibold text-[#3a332c] max-w-[9rem]"
            >
              {/* Phones: title in the sheet only, so the header stays one row. */}
              <span className="truncate hidden sm:inline">{track.title}</span>
              <span className="text-[#a1968a]">▾</span>
            </button>
          </>
        ) : (
          <button type="button" onClick={open} className="flex items-center gap-1.5 px-1.5 text-sm font-semibold text-[#5c5248]">
            <MusicIcon className="w-4 h-4 text-[#e8829e]" />
            <span className="hidden sm:inline">Thêm nhạc</span>
          </button>
        )}
      </div>

      {pos && (
        <>
          <div className="fixed inset-0 z-40 bg-[#3a332c]/20 md:bg-transparent" onClick={() => setPos(null)} />
          <div
            className="fixed z-50 inset-x-0 bottom-0 md:inset-x-auto md:bottom-auto md:w-[340px] max-h-[80vh] overflow-y-auto no-scrollbar rounded-t-3xl md:rounded-3xl border border-[#f5c9d5] bg-gradient-to-b from-[#fff0f4] to-[#fff6ec] p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl flex flex-col gap-3"
            style={pos.desktop ? { left: pos.left, top: pos.top } : undefined}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#c25576]">Nhạc nền</span>
              <div className="flex items-center gap-2">
                {track?.provider === "youtube" && duration > 0 && (
                  <span className="text-[11px] text-[#8a7f73]">{formatTime(duration)}</span>
                )}
                <button type="button" aria-label="Đóng" onClick={() => setPos(null)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#8a7f73] hover:bg-white">
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {track && track.provider === "youtube" && (
              <>
                <div className="flex items-center gap-3">
                  <Vinyl track={track} playing={playing} size={72} />
                  <div className="min-w-0">
                    <div className="font-bold text-[#3a332c] leading-snug line-clamp-2">{track.title}</div>
                    <div className="text-[12px] text-[#8a7f73]">
                      {statusLabel(status, track)}
                      {duration > 0 && ` · ${formatTime(duration)}`}
                    </div>
                  </div>
                </div>
                <Progress time={time} duration={duration} onSeek={seek} showTimes={false} />
              </>
            )}
            {track && track.provider === "spotify" && <SpotifyEmbed track={track} />}

            <div className="flex flex-col gap-1.5">
              {tracks.map((t) => (
                <TrackRow key={t.id} track={t} selected={t.id === track?.id} onPick={() => onChange(t.id)} />
              ))}
              {tracks.length === 0 && (
                <p className="text-[12.5px] text-[#7a6f62] px-1">Thư viện nhạc trống. Dán link bài hát YouTube hoặc Spotify để thêm.</p>
              )}
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void add();
              }}
            >
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Dán link YouTube / Spotify"
                inputMode="url"
                className="flex-1 min-w-0 rounded-xl border border-[#e7ddd0] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#e8829e]"
              />
              <button
                type="submit"
                disabled={!link.trim() || adding}
                className="rounded-xl bg-[#e8829e] px-3 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                {adding ? "…" : "Thêm"}
              </button>
            </form>
            {error && <p className="text-[12px] font-semibold text-[#c0392b]">{error}</p>}

            <Toggle on={autoplay} onChange={setAutoplay} label="Tự phát khi mở nhật ký" />
            {track && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-[13px] font-semibold text-[#8a7f73] hover:text-[#c0392b] py-1"
              >
                Bỏ nhạc khỏi nhật ký này
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
