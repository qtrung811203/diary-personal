import type { MusicLink } from "./music-link";
import { canonicalUrl, youtubeThumb } from "./music-link";

export const trackSelect = {
  id: true,
  title: true,
  provider: true,
  externalId: true,
  spotifyKind: true,
  thumbnailUrl: true,
} as const;

// Title + artwork from the provider's public oEmbed endpoint; best effort.
export async function lookupTrackMeta(link: MusicLink): Promise<{ title: string | null; thumbnailUrl: string | null }> {
  const endpoint =
    link.provider === "youtube" ? "https://www.youtube.com/oembed" : "https://open.spotify.com/oembed";
  try {
    const res = await fetch(`${endpoint}?format=json&url=${encodeURIComponent(canonicalUrl(link))}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error();
    const data = (await res.json()) as { title?: unknown; thumbnail_url?: unknown };
    return {
      title: typeof data.title === "string" ? data.title.slice(0, 200) : null,
      thumbnailUrl: typeof data.thumbnail_url === "string" ? data.thumbnail_url : null,
    };
  } catch {
    return {
      title: null,
      thumbnailUrl: link.provider === "youtube" ? youtubeThumb(link.externalId) : null,
    };
  }
}
