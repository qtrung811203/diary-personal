import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";
import { deleteImageByUrl } from "@/lib/storage";
import { countWords, extractTitleAndPreview, normalizeDoc } from "@/lib/doc";
import { isEditorFont } from "@/lib/fonts";
import { isPhotoLayout } from "@/lib/photos";
import { deletePhotoObjects, migrateInlineImages, photoSelect, refreshCover } from "@/lib/photo-store";
import { trackSelect } from "@/lib/track-store";

type Ctx = { params: Promise<{ id: string }> };

const MAX_DOC_CHARS = 2_000_000;

function isDocShaped(v: unknown): boolean {
  return (
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    (v as { type?: unknown }).type === "doc" &&
    JSON.stringify(v).length <= MAX_DOC_CHARS
  );
}

export async function GET(_request: Request, { params }: Ctx) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;
  const userId = guard.userId;

  const { id } = await params;
  await migrateInlineImages(userId, id);
  const entry = await prisma.diaryEntry.findFirst({
    where: { id, userId },
    include: {
      photos: { orderBy: { sortOrder: "asc" }, select: photoSelect },
      track: { select: trackSelect },
    },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...entry, contentJson: normalizeDoc(entry.contentJson) });
}

// Partial update: any of contentJson / moodId / fontFamily / backgroundType+backgroundValue.
export async function PUT(request: Request, { params }: Ctx) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;
  const userId = guard.userId;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = await prisma.diaryEntry.findFirst({
    where: { id, userId },
    select: { backgroundType: true, backgroundValue: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};

  if ("contentJson" in body) {
    if (!isDocShaped(body.contentJson)) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }
    const doc = normalizeDoc(body.contentJson);
    Object.assign(data, {
      contentJson: doc,
      ...extractTitleAndPreview(doc),
      words: countWords(doc),
    });
  }

  if ("moodId" in body) {
    if (body.moodId === null) {
      data.moodId = null;
    } else if (typeof body.moodId === "string") {
      const mood = await prisma.mood.findFirst({
        where: { id: body.moodId, userId },
        select: { id: true },
      });
      if (!mood) return NextResponse.json({ error: "Unknown mood" }, { status: 400 });
      data.moodId = mood.id;
    } else {
      return NextResponse.json({ error: "Invalid mood" }, { status: 400 });
    }
  }

  if ("isFavorite" in body) {
    if (typeof body.isFavorite !== "boolean") {
      return NextResponse.json({ error: "Invalid isFavorite" }, { status: 400 });
    }
    data.isFavorite = body.isFavorite;
  }

  if ("fontFamily" in body) {
    if (!isEditorFont(body.fontFamily)) {
      return NextResponse.json({ error: "Invalid font" }, { status: 400 });
    }
    data.fontFamily = body.fontFamily;
  }

  if ("backgroundValue" in body) {
    if (typeof body.backgroundValue !== "string" || body.backgroundValue.length > 500) {
      return NextResponse.json({ error: "Invalid background" }, { status: 400 });
    }
    data.backgroundType = body.backgroundType === "image" ? "image" : "color";
    data.backgroundValue = body.backgroundValue;

    // Replacing a background image orphans the old object in storage unless
    // it's cleaned up here — best-effort, never blocks the save on failure.
    if (
      existing.backgroundType === "image" &&
      existing.backgroundValue !== body.backgroundValue
    ) {
      deleteImageByUrl(existing.backgroundValue).catch(() => {});
    }
  }

  if ("photoLayout" in body) {
    if (!isPhotoLayout(body.photoLayout)) {
      return NextResponse.json({ error: "Invalid photoLayout" }, { status: 400 });
    }
    data.photoLayout = body.photoLayout;
  }

  if ("trackId" in body) {
    if (body.trackId === null) {
      data.trackId = null;
    } else {
      const track =
        typeof body.trackId === "string"
          ? await prisma.track.findFirst({ where: { id: body.trackId, userId }, select: { id: true } })
          : null;
      if (!track) return NextResponse.json({ error: "Unknown track" }, { status: 400 });
      data.trackId = track.id;
    }
  }

  let cover: Awaited<ReturnType<typeof refreshCover>> | null = null;
  if ("coverPhotoId" in body) {
    const photo =
      typeof body.coverPhotoId === "string"
        ? await prisma.entryPhoto.findFirst({ where: { id: body.coverPhotoId, entryId: id }, select: { id: true } })
        : null;
    if (!photo) return NextResponse.json({ error: "Unknown photo" }, { status: 400 });
    cover = await refreshCover(id, photo.id);
  }

  const entry = await prisma.diaryEntry.update({ where: { id }, data });
  return NextResponse.json({
    id: entry.id,
    title: entry.title,
    preview: entry.preview,
    moodId: entry.moodId,
    isFavorite: entry.isFavorite,
    photoLayout: entry.photoLayout,
    trackId: entry.trackId,
    ...(cover ?? {
      photoCount: entry.photoCount,
      coverPhotoId: entry.coverPhotoId,
      coverThumbUrl: entry.coverThumbUrl,
      coverColor: entry.coverColor,
    }),
    updatedAt: entry.updatedAt,
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;
  const userId = guard.userId;

  const { id } = await params;
  const entry = await prisma.diaryEntry.findFirst({
    where: { id, userId },
    select: { backgroundType: true, backgroundValue: true },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const photos = await prisma.entryPhoto.findMany({ where: { entryId: id }, select: { url: true, thumbUrl: true } });
  await prisma.diaryEntry.delete({ where: { id } });
  deletePhotoObjects(photos);
  if (entry.backgroundType === "image") {
    deleteImageByUrl(entry.backgroundValue).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
