import { spotifyEmbedUrl } from "@/lib/music-link";
import type { Track } from "./MusicProvider";

// Spotify plays inside its own player (full songs only when the browser is
// signed in to Spotify; otherwise 30-second previews) and never autoplays.
// Heights Spotify supports: 80 (compact bar), 152 (card), 352 (with list).
export default function SpotifyEmbed({ track, height = 152 }: { track: Track; height?: 80 | 152 | 352 }) {
  return (
    <iframe
      title={track.title}
      src={spotifyEmbedUrl(track.spotifyKind ?? "track", track.externalId)}
      width="100%"
      height={height}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      className={`block border-0 ${height === 80 ? "" : "rounded-xl"}`}
    />
  );
}
