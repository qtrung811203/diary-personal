"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api-client";
import { loadYouTubeApi, YT_STATE, type YTPlayer } from "@/lib/youtube-player";

export type Track = {
  id: string;
  title: string;
  provider: "youtube" | "spotify";
  externalId: string;
  spotifyKind: string | null;
  thumbnailUrl: string | null;
};

// blocked = the browser refused to start sound without a tap (iPhone).
export type MusicStatus = "idle" | "loading" | "playing" | "paused" | "blocked" | "error";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

type MusicContextValue = {
  tracks: Track[];
  autoplay: boolean;
  setAutoplay: (v: boolean) => void;
  addTrack: (url: string) => Promise<Result<Track>>;
  renameTrack: (id: string, title: string) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;
  // The track of the entry on screen (null = none / no entry open).
  current: Track | null;
  status: MusicStatus;
  time: number;
  duration: number;
  bind: (track: Track | null) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used inside <MusicProvider>");
  return ctx;
}

// An open entry declares its track; leaving the entry stops the music.
export function useEntryMusic(trackId: string | null) {
  const { tracks, bind } = useMusic();
  const track = trackId ? (tracks.find((t) => t.id === trackId) ?? null) : null;
  useEffect(() => {
    bind(track);
  }, [track, bind]);
  useEffect(() => () => bind(null), [bind]);
  return track;
}

// How long autoplay may take to start before we assume the browser blocked it.
const AUTOPLAY_GRACE_MS = 3000;

// One hidden YouTube player for the whole app (it lives inside PinGate, so
// locking or signing out tears it down and the music stops). Spotify tracks
// are not played here: the views show Spotify's own embed for them.
export default function MusicProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [autoplay, setAutoplayState] = useState(true);
  const [current, setCurrent] = useState<Track | null>(null);
  const [status, setStatus] = useState<MusicStatus>("idle");
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Promise<YTPlayer> | null>(null);
  const currentRef = useRef<Track | null>(null);
  const autoplayRef = useRef(true);
  const blockTimer = useRef<number | null>(null);

  useEffect(() => {
    apiFetch("/api/tracks")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { tracks: Track[]; autoplay: boolean } | null) => {
        if (!d) return;
        setTracks(d.tracks);
        setAutoplayState(d.autoplay);
        autoplayRef.current = d.autoplay;
      })
      .catch(() => {});
  }, []);

  const clearBlockTimer = () => {
    if (blockTimer.current) window.clearTimeout(blockTimer.current);
    blockTimer.current = null;
  };

  const getPlayer = useCallback((): Promise<YTPlayer> => {
    if (!playerRef.current) {
      playerRef.current = loadYouTubeApi().then(
        (YT) =>
          new Promise<YTPlayer>((resolve) => {
            const el = document.createElement("div");
            hostRef.current!.appendChild(el);
            const player: YTPlayer = new YT.Player(el, {
              width: 200,
              height: 200,
              playerVars: { playsinline: 1, controls: 0, disablekb: 1, rel: 0 },
              events: {
                onReady: () => resolve(player),
                onStateChange: ({ data }) => {
                  if (data === YT_STATE.PLAYING) {
                    clearBlockTimer();
                    setStatus("playing");
                    setDuration(player.getDuration());
                  } else if (data === YT_STATE.PAUSED) {
                    setStatus((s) => (s === "blocked" ? s : "paused"));
                  } else if (data === YT_STATE.CUED) {
                    setStatus("paused");
                  } else if (data === YT_STATE.ENDED) {
                    // Background music loops.
                    player.seekTo(0, true);
                    player.playVideo();
                  }
                },
                onError: () => {
                  clearBlockTimer();
                  setStatus("error");
                },
              },
            });
          })
      );
      playerRef.current.catch(() => {
        playerRef.current = null;
        setStatus("error");
      });
    }
    return playerRef.current;
  }, []);

  const bind = useCallback(
    (track: Track | null) => {
      if (currentRef.current?.id === track?.id) {
        // Same track, maybe renamed.
        currentRef.current = track;
        setCurrent(track);
        return;
      }
      currentRef.current = track;
      clearBlockTimer();
      setCurrent(track);
      setTime(0);
      setDuration(0);
      playerRef.current?.then((p) => p.stopVideo()).catch(() => {});
      if (!track || track.provider !== "youtube") {
        setStatus("idle");
        return;
      }
      setStatus("loading");
      getPlayer()
        .then((p) => {
          if (currentRef.current?.id !== track.id) return;
          if (autoplayRef.current) {
            p.loadVideoById(track.externalId);
            blockTimer.current = window.setTimeout(() => {
              if (p.getPlayerState() !== YT_STATE.PLAYING) {
                p.pauseVideo();
                setStatus("blocked");
              }
            }, AUTOPLAY_GRACE_MS);
          } else {
            p.cueVideoById(track.externalId);
            setStatus("paused");
          }
        })
        .catch(() => {});
    },
    [getPlayer]
  );

  // Progress while playing.
  useEffect(() => {
    if (status !== "playing") return;
    const t = window.setInterval(() => {
      playerRef.current
        ?.then((p) => {
          setTime(p.getCurrentTime());
          setDuration(p.getDuration());
        })
        .catch(() => {});
    }, 500);
    return () => window.clearInterval(t);
  }, [status]);

  useEffect(
    () => () => {
      clearBlockTimer();
      playerRef.current?.then((p) => p.destroy()).catch(() => {});
    },
    []
  );

  const toggle = useCallback(() => {
    const track = currentRef.current;
    if (!track || track.provider !== "youtube") return;
    // Called from a tap, so this also works where autoplay was blocked.
    getPlayer()
      .then((p) => {
        if (p.getPlayerState() === YT_STATE.PLAYING) p.pauseVideo();
        else p.playVideo();
      })
      .catch(() => {});
  }, [getPlayer]);

  const seek = useCallback((seconds: number) => {
    playerRef.current
      ?.then((p) => {
        p.seekTo(Math.max(0, seconds), true);
        setTime(Math.max(0, seconds));
      })
      .catch(() => {});
  }, []);

  const setAutoplay = useCallback((v: boolean) => {
    setAutoplayState(v);
    autoplayRef.current = v;
    void apiFetch("/api/me/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ musicAutoplay: v }),
    }).catch(() => {});
  }, []);

  const addTrack = useCallback(async (url: string): Promise<Result<Track>> => {
    const res = await apiFetch("/api/tracks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }).catch(() => null);
    if (!res) return { ok: false, error: "Không kết nối được máy chủ." };
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: typeof data.error === "string" ? data.error : "Không thêm được bài hát." };
    const track = data as Track;
    setTracks((list) => (list.some((t) => t.id === track.id) ? list : [...list, track]));
    return { ok: true, value: track };
  }, []);

  const renameTrack = useCallback(async (id: string, title: string) => {
    const res = await apiFetch(`/api/tracks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }).catch(() => null);
    if (!res?.ok) return;
    const track = (await res.json()) as Track;
    setTracks((list) => list.map((t) => (t.id === id ? track : t)));
  }, []);

  const deleteTrack = useCallback(async (id: string) => {
    const res = await apiFetch(`/api/tracks/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return;
    setTracks((list) => list.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      tracks,
      autoplay,
      setAutoplay,
      addTrack,
      renameTrack,
      deleteTrack,
      current,
      status,
      time,
      duration,
      bind,
      toggle,
      seek,
    }),
    [tracks, autoplay, setAutoplay, addTrack, renameTrack, deleteTrack, current, status, time, duration, bind, toggle, seek]
  );

  return (
    <MusicContext.Provider value={value}>
      {children}
      <div
        ref={hostRef}
        aria-hidden
        className="fixed pointer-events-none opacity-0"
        style={{ left: -10000, top: 0, width: 200, height: 200 }}
      />
    </MusicContext.Provider>
  );
}
