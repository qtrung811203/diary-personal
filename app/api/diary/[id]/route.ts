import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { deleteImageByUrl } from "@/lib/storage";
import { countWords, extractTitleAndPreview, normalizeDoc } from "@/lib/doc";

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
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await prisma.diaryEntry.findFirst({ where: { id, userId } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...entry, contentJson: normalizeDoc(entry.contentJson) });
}

// Partial update: any of contentJson / moodId / backgroundType+backgroundValue.
export async function PUT(request: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const entry = await prisma.diaryEntry.update({ where: { id }, data });
  return NextResponse.json({
    id: entry.id,
    title: entry.title,
    preview: entry.preview,
    moodId: entry.moodId,
    updatedAt: entry.updatedAt,
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await prisma.diaryEntry.findFirst({
    where: { id, userId },
    select: { backgroundType: true, backgroundValue: true },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.diaryEntry.delete({ where: { id } });
  if (entry.backgroundType === "image") {
    deleteImageByUrl(entry.backgroundValue).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
