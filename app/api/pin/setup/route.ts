import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { hashPassword } from "@/lib/auth-helpers";
import { isValidPin } from "@/lib/pin";
import { unlockTokenFor } from "@/lib/pin-store";

// First-time PIN creation. Changing an existing PIN goes through /reset.
export async function POST(request: Request) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  if (!isValidPin(body?.pin)) {
    return NextResponse.json({ error: "PIN phải gồm đúng 6 chữ số." }, { status: 400 });
  }

  const pinHash = await hashPassword(body.pin);
  // Conditional write: only succeeds while no PIN exists yet.
  const { count } = await prisma.user.updateMany({
    where: { id: guard.userId, pinHash: null },
    data: { pinHash, pinFailedCount: 0, pinLockedUntil: null },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Bạn đã có mã PIN." }, { status: 409 });
  }
  return NextResponse.json({ token: unlockTokenFor(guard.userId, guard.sessionVersion!) });
}
