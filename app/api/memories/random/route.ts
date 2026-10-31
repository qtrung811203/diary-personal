import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";
import { nonEmptyEntry } from "@/lib/memory-store";

// A random entry to revisit; `not` avoids landing on the one already open.
export async function GET(request: Request) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;

  const not = new URL(request.url).searchParams.get("not") ?? undefined;
  const where = { userId: guard.userId, ...nonEmptyEntry, ...(not && { id: { not } }) };
  const count = await prisma.diaryEntry.count({ where });
  if (count === 0) return NextResponse.json({ id: null });
  const [entry] = await prisma.diaryEntry.findMany({
    where,
    orderBy: { createdAt: "asc" },
    skip: Math.floor(Math.random() * count),
    take: 1,
    select: { id: true },
  });
  return NextResponse.json({ id: entry?.id ?? null });
}
