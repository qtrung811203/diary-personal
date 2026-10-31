import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";

export async function PUT(request: Request) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  if (typeof body?.musicAutoplay !== "boolean") {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }
  await prisma.user.update({ where: { id: guard.userId }, data: { musicAutoplay: body.musicAutoplay } });
  return NextResponse.json({ musicAutoplay: body.musicAutoplay });
}
