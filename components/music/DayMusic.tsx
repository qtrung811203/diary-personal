"use client";

import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "@/components/icons";
import { useMusic, type Track } from "./MusicProvider";
import { Progress, statusLabel, Vinyl } from "./Vinyl";
import SpotifyEmbed from "./SpotifyEmbed";

const SKIP_SECONDS = 15;

// Read view, desktop: the "Nhạc của ngày" card beside the entry.
export function MusicCard({ track }: { track: Track }) {
  const { status, time, duration, toggle, seek, autoplay, setAutoplay } = useMusic();
  const playing = status === "playing";
  const round = "w-11 h-11 rounded-full bg-white shadow-sm text-[#3a332c] flex items-center justify-center hover:bg-[#fff0f4]";

  return (
    <div className="rounded-3xl border border-[#f5c9d5] bg-gradient-to-b from-[#fff0f4] to-[#ffe9dc] p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-[#c25576]">Nhạc của ngày</span>
        <button
          type="button"
          onClick={() => setAutoplay(!autoplay)}
          title="Tự phát nhạc khi mở nhật ký"
          className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5c5248]"
        >
          Tự phát: {autoplay ? "bật" : "tắt"}
        </button>
      </div>

      {track.provider === "spotify" ? (
        <>
          <div className="font-bold text-center text-[#3a332c]">{track.title}</div>
          <SpotifyEmbed track={track} />
        </>
      ) : (
        <>
          <div className="flex justify-center py-1">
            <Vinyl track={track} playing={playing} size={168} />
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-[#3a332c] leading-snug line-clamp-2">{track.title}</div>
            <div className="text-[12px] text-[#8a7f73]">{statusLabel(status, track)}</div>
          </div>
          <Progress time={time} duration={duration} onSeek={seek} />
          <div className="flex items-center justify-center gap-5">
            <button type="button" aria-label="Về đầu bài" className={round} onClick={() => seek(0)}>
              <SkipBackIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label={playing ? "Tạm dừng" : "Phát"}
              onClick={toggle}
              className={`w-14 h-14 rounded-full bg-[#e8829e] text-white shadow-md flex items-center justify-center ${
                status === "blocked" ? "animate-pulse" : ""
              }`}
            >
              {playing ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 translate-x-0.5" />}
            </button>
            <button
              type="button"
              aria-label={`Tua tới ${SKIP_SECONDS} giây`}
              className={round}
              onClick={() => seek(Math.min(duration, time + SKIP_SECONDS))}
            >
              <SkipForwardIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Read view, phone: a floating bar at the bottom.
export function MiniPlayer({ track }: { track: Track }) {
  const { status, toggle } = useMusic();
  const playing = status === "playing";
  if (track.provider === "spotify") {
    return (
      <div className="rounded-2xl overflow-hidden shadow-xl">
        <SpotifyEmbed track={track} height={80} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-full border border-[#f5c9d5] bg-gradient-to-r from-[#fff0f4] to-[#ffe9dc] pl-2 pr-2 py-2 shadow-xl">
      <Vinyl track={track} playing={playing} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-[14px] text-[#3a332c]">{track.title}</div>
        <div className="text-[11px] text-[#8a7f73]">{statusLabel(status, track)}</div>
      </div>
      <button
        type="button"
        aria-label={playing ? "Tạm dừng" : "Phát"}
        onClick={toggle}
        className={`w-10 h-10 rounded-full bg-[#e8829e] text-white flex items-center justify-center shrink-0 ${
          status === "blocked" ? "animate-pulse" : ""
        }`}
      >
        {playing ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 translate-x-px" />}
      </button>
    </div>
  );
}
