import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";
import { parseMusicLink } from "@/lib/music-link";
import { lookupTrackMeta, trackSelect } from "@/lib/track-store";

const MAX_TRACKS = 200;

export async function GET() {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;

  const [tracks, user] = await Promise.all([
    prisma.track.findMany({ where: { userId: guard.userId }, orderBy: { createdAt: "asc" }, select: trackSelect }),
    prisma.user.findUnique({ where: { id: guard.userId }, select: { musicAutoplay: true } }),
  ]);
  return NextResponse.json({ tracks, autoplay: user?.musicAutoplay ?? true });
}

// Adds a YouTube / Spotify link to the library (or returns the existing one).
export async function POST(request: Request) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;
  const userId = guard.userId;

  const body = await request.json().catch(() => null);
  const link = typeof body?.url === "string" ? parseMusicLink(body.url) : null;
  if (!link) {
    return NextResponse.json({ error: "Link chưa đúng. Dán link bài hát YouTube hoặc Spotify." }, { status: 400 });
  }

  const existing = await prisma.track.findUnique({
    where: { userId_provider_externalId: { userId, provider: link.provider, externalId: link.externalId } },
    select: trackSelect,
  });
  if (existing) return NextResponse.json(existing);

  if ((await prisma.track.count({ where: { userId } })) >= MAX_TRACKS) {
    return NextResponse.json({ error: `Thư viện tối đa ${MAX_TRACKS} bài.` }, { status: 400 });
  }

  const meta = await lookupTrackMeta(link);
  const given = typeof body?.title === "string" ? body.title.trim().slice(0, 200) : "";
  const track = await prisma.track.create({
    data: {
      userId,
      provider: link.provider,
      externalId: link.externalId,
      spotifyKind: link.provider === "spotify" ? link.spotifyKind : null,
      title: given || meta.title || (link.provider === "youtube" ? "Bài hát YouTube" : "Bài hát Spotify"),
      thumbnailUrl: meta.thumbnailUrl,
    },
    select: trackSelect,
  });
  return NextResponse.json(track, { status: 201 });
}
