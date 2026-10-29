import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { isPinLocked } from "@/lib/pin";

export async function GET() {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;
  const user = await prisma.user.findUnique({
    where: { id: guard.userId },
    select: { pinHash: true, pinLockedUntil: true },
  });
  const locked = isPinLocked(user?.pinLockedUntil ?? null, new Date());
  return NextResponse.json({
    hasPin: !!user?.pinHash,
    lockedUntil: locked ? user!.pinLockedUntil : null,
  });
}
