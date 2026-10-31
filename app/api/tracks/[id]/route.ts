import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";
import { trackSelect } from "@/lib/track-store";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 200) : "";
  if (!title) return NextResponse.json({ error: "Tên bài không được để trống." }, { status: 400 });

  const { count } = await prisma.track.updateMany({ where: { id, userId: guard.userId }, data: { title } });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(await prisma.track.findUnique({ where: { id }, select: trackSelect }));
}

// Entries using the track lose their music (relation is SetNull).
export async function DELETE(_request: Request, { params }: Ctx) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const { count } = await prisma.track.deleteMany({ where: { id, userId: guard.userId } });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
