import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";
import { isValidMonthParam } from "@/lib/validation";
import { monthRange } from "@/lib/memories";
import { memoryCardSelect, nonEmptyEntry } from "@/lib/memory-store";

// One month of memories: cards (cover thumbnails only) plus every photo's
// thumbnail for the photo-grid tab. Full-size images are never sent here.
export async function GET(request: Request) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;
  const userId = guard.userId;

  const month = new URL(request.url).searchParams.get("month") ?? "";
  if (!isValidMonthParam(month)) return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  const { from, to } = monthRange(month);

  const entries = await prisma.diaryEntry.findMany({
    where: { userId, date: { gte: from, lte: to }, ...nonEmptyEntry },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: memoryCardSelect,
  });
  const photos = entries.some((e) => e.photoCount > 0)
    ? await prisma.entryPhoto.findMany({
        where: { entryId: { in: entries.map((e) => e.id) } },
        orderBy: [{ entryId: "asc" }, { sortOrder: "asc" }],
        select: { id: true, entryId: true, url: true, thumbUrl: true, width: true, height: true, color: true },
      })
    : [];

  return NextResponse.json({
    month,
    entries,
    photos,
    photoTotal: photos.length,
  });
}
