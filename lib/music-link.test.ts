import { describe, expect, it } from "vitest";
import { parseMusicLink, spotifyEmbedUrl } from "./music-link";

describe("parseMusicLink — YouTube", () => {
  const id = "dQw4w9WgXcQ";
  it.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=42s&list=PL1`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://music.youtube.com/watch?v=${id}&si=abc`,
    `https://youtu.be/${id}?si=xyz`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `  youtu.be/${id}  `,
  ])("%s", (url) => {
    expect(parseMusicLink(url)).toEqual({ provider: "youtube", externalId: id });
  });
});

describe("parseMusicLink — Spotify", () => {
  it("parses track, album, playlist and episode links", () => {
    expect(parseMusicLink("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=1")).toEqual({
      provider: "spotify",
      externalId: "4uLU6hMCjMI75M1A2tKUQC",
      spotifyKind: "track",
    });
    expect(parseMusicLink("https://open.spotify.com/intl-vi/album/1DFixLWuPkv3KT3TnV35m3")).toMatchObject({
      spotifyKind: "album",
      externalId: "1DFixLWuPkv3KT3TnV35m3",
    });
    expect(parseMusicLink("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M")).toMatchObject({ spotifyKind: "playlist" });
    expect(parseMusicLink("https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ")).toMatchObject({ spotifyKind: "episode" });
  });
  it("parses spotify: URIs", () => {
    expect(parseMusicLink("spotify:track:4uLU6hMCjMI75M1A2tKUQC")).toMatchObject({ spotifyKind: "track" });
  });
});

describe("parseMusicLink — rejects", () => {
  it.each([
    "",
    "hello",
    "https://example.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=short",
    "https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF",
    "javascript:alert(1)",
  ])("%s", (url) => {
    expect(parseMusicLink(url)).toBeNull();
  });
});

describe("spotifyEmbedUrl", () => {
  it("builds the embed URL", () => {
    expect(spotifyEmbedUrl("track", "abc")).toBe("https://open.spotify.com/embed/track/abc?utm_source=generator");
  });
});
