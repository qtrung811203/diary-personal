import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";
import { ensureMoods } from "@/lib/mood-store";
import { validateMoodInput } from "@/lib/moods";

export async function GET() {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;
  const userId = guard.userId;

  return NextResponse.json({ moods: await ensureMoods(userId) });
}

export async function POST(request: Request) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;
  const userId = guard.userId;

  const parsed = validateMoodInput(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await ensureMoods(userId);
  const last = await prisma.mood.findFirst({
    where: { userId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  try {
    const mood = await prisma.mood.create({
      data: { ...parsed.value, userId, sortOrder: (last?.sortOrder ?? -1) + 1 },
    });
    return NextResponse.json(mood, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Đã có mood trùng tên này." }, { status: 409 });
    }
    throw e;
  }
}
