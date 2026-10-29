import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";
import { isValidDateParam } from "@/lib/validation";
import { countWords, extractTitleAndPreview, isDocEmpty, normalizeDoc } from "@/lib/doc";
import { DEFAULT_BACKGROUND_VALUE } from "@/lib/background";

const LIST_LIMIT = 1000;

// Sidebar list — newest first. Entries written before title/preview existed
// (migrated one-per-day rows) are filled in here the first time they're read.
export async function GET() {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;
  const userId = guard.userId;

  const unfilled = await prisma.diaryEntry.findMany({
    where: { userId, title: "", preview: "", words: 0 },
    select: { id: true, contentJson: true },
    take: 200,
  });
  for (const row of unfilled) {
    if (isDocEmpty(row.contentJson)) continue;
    const doc = normalizeDoc(row.contentJson);
    await prisma.diaryEntry.update({
      where: { id: row.id },
      data: {
        contentJson: doc as object,
        ...extractTitleAndPreview(doc),
        words: countWords(doc),
      },
    });
  }

  const entries = await prisma.diaryEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
    select: { id: true, date: true, createdAt: true, title: true, preview: true, moodId: true },
  });
  return NextResponse.json({ entries });
}

// New entry for the user's current local day (client supplies it, so the
// "day" is the user's own calendar day, not the server's).
export async function POST(request: Request) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;
  const userId = guard.userId;

  const body = await request.json().catch(() => null);
  const date = typeof body?.date === "string" ? body.date : "";
  if (!isValidDateParam(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const entry = await prisma.diaryEntry.create({
    data: {
      userId,
      date,
      contentJson: normalizeDoc(null) as object,
      backgroundType: "color",
      backgroundValue: DEFAULT_BACKGROUND_VALUE,
    },
  });
  return NextResponse.json(entry, { status: 201 });
}
