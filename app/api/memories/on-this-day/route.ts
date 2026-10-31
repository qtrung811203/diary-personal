import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";
import { isValidDateParam } from "@/lib/validation";
import { onThisDayDates } from "@/lib/memories";
import { memoryCardSelect, nonEmptyEntry } from "@/lib/memory-store";

// Entries written on today's day-and-month in earlier years (newest first).
// `today` is the user's local day, sent by the client.
export async function GET(request: Request) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;

  const today = new URL(request.url).searchParams.get("today") ?? "";
  if (!isValidDateParam(today)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  const entries = await prisma.diaryEntry.findMany({
    where: { userId: guard.userId, date: { in: onThisDayDates(today, 50) }, ...nonEmptyEntry },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 5,
    select: memoryCardSelect,
  });
  return NextResponse.json({ entries });
}
