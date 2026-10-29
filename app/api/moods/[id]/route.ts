import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";
import { validateMoodInput } from "@/lib/moods";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;
  const userId = guard.userId;

  const parsed = validateMoodInput(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { id } = await params;
  try {
    const result = await prisma.mood.updateMany({ where: { id, userId }, data: parsed.value });
    if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(await prisma.mood.findUnique({ where: { id } }));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Đã có mood trùng tên này." }, { status: 409 });
    }
    throw e;
  }
}

// Entries that used this mood just become "no mood" (FK is ON DELETE SET NULL).
export async function DELETE(_request: Request, { params }: Ctx) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;
  const userId = guard.userId;

  const { id } = await params;
  const result = await prisma.mood.deleteMany({ where: { id, userId } });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
