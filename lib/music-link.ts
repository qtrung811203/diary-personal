// Turns a pasted YouTube / Spotify link into something the app can play.

export type SpotifyKind = "track" | "album" | "playlist" | "episode";
export type MusicLink =
  | { provider: "youtube"; externalId: string }
  | { provider: "spotify"; externalId: string; spotifyKind: SpotifyKind };

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;
const SPOTIFY_KINDS = new Set(["track", "album", "playlist", "episode"]);
const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]);

function youtube(url: URL): MusicLink | null {
  let id: string | null = null;
  if (url.hostname === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (YT_HOSTS.has(url.hostname)) {
    const [, first, second] = url.pathname.split("/");
    if (first === "watch") id = url.searchParams.get("v");
    else if (first === "shorts" || first === "embed" || first === "live") id = second ?? null;
  }
  return id && YT_ID.test(id) ? { provider: "youtube", externalId: id } : null;
}

function spotify(kind: string | undefined, id: string | undefined): MusicLink | null {
  if (!kind || !id || !SPOTIFY_KINDS.has(kind) || !SPOTIFY_ID.test(id)) return null;
  return { provider: "spotify", externalId: id, spotifyKind: kind as SpotifyKind };
}

export function parseMusicLink(raw: string): MusicLink | null {
  const text = raw.trim();
  if (text.startsWith("spotify:")) {
    const [, kind, id] = text.split(":");
    return spotify(kind, id);
  }
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.hostname === "open.spotify.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0]?.startsWith("intl-")) parts.shift();
    return spotify(parts[0], parts[1]);
  }
  return youtube(url);
}

export const spotifyEmbedUrl = (kind: string, id: string) =>
  `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator`;

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

export function canonicalUrl(link: MusicLink): string {
  return link.provider === "youtube"
    ? `https://www.youtube.com/watch?v=${link.externalId}`
    : `https://open.spotify.com/${link.spotifyKind}/${link.externalId}`;
}
