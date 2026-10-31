"use client";

import type { CSSProperties } from "react";
import type { MusicStatus, Track } from "./MusicProvider";

export const formatTime = (s: number) => {
  const t = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

export const statusLabel = (status: MusicStatus, track: Track) =>
  track.provider === "spotify"
    ? "Spotify"
    : status === "playing"
    ? "Đang phát"
    : status === "blocked"
    ? "Chạm để phát"
    : status === "loading"
    ? "Đang tải…"
    : status === "error"
    ? "Không phát được"
    : "Tạm dừng";

// A spinning record; the label shows the track's artwork when there is one.
export function Vinyl({ track, playing, size }: { track: Track | null; playing: boolean; size: number }) {
  const label: CSSProperties = track?.thumbnailUrl
    ? { backgroundImage: `url(${track.thumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, #f8c79a, #e8829e)" };
  return (
    <div
      className="vinyl vinyl-grooves relative rounded-full shrink-0 shadow-[0_6px_18px_rgba(58,42,36,0.35)]"
      data-playing={playing}
      style={{ width: size, height: size }}
    >
      <div className="absolute rounded-full" style={{ inset: size * 0.3, ...label }} />
      <div
        className="absolute rounded-full bg-[#fff6ec] border border-[#3a2a24]/40"
        style={{ width: Math.max(4, size * 0.07), height: Math.max(4, size * 0.07), left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
      />
    </div>
  );
}

// Seekable progress bar (YouTube only).
export function Progress({
  time,
  duration,
  onSeek,
  showTimes = true,
}: {
  time: number;
  duration: number;
  onSeek: (s: number) => void;
  showTimes?: boolean;
}) {
  const pct = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;
  return (
    <div>
      <input
        type="range"
        min={0}
        max={Math.max(1, Math.floor(duration))}
        value={Math.floor(time)}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Tua nhạc"
        className="w-full h-1.5 appearance-none rounded-full cursor-pointer accent-[#e8829e]"
        style={{ background: `linear-gradient(to right, #e8829e ${pct}%, #f5c9d5 ${pct}%)` }}
      />
      {showTimes && (
        <div className="mt-1 flex justify-between text-[11px] text-[#8a7f73]">
          <span>{formatTime(time)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}
