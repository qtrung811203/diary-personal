import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth-helpers";
import { isValidPin } from "@/lib/pin";
import { unlockTokenFor } from "@/lib/pin-store";

// Forgot / locked-out PIN: prove identity with the account password and set a
// new PIN (also clears any lockout).
export async function POST(request: Request) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!isValidPin(body?.newPin)) {
    return NextResponse.json({ error: "PIN phải gồm đúng 6 chữ số." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: guard.userId }, select: { passwordHash: true } });
  if (!user || !password || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Mật khẩu không đúng." }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: guard.userId },
    data: { pinHash: await hashPassword(body.newPin), pinFailedCount: 0, pinLockedUntil: null },
  });
  return NextResponse.json({ token: unlockTokenFor(guard.userId, guard.sessionVersion!) });
}
