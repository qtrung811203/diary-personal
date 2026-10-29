import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-helpers";
import { isValidPin } from "@/lib/pin";
import { checkPin } from "@/lib/pin-store";

const GENERIC = "Email hoặc mã PIN không đúng.";

// Password reset without a session: email + PIN. Shares the account's
// 5-tries / 15-minute PIN lockout. Bumping sessionVersion signs out every
// device that still holds an old session.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!isValidPin(body?.pin) || !email) {
    return NextResponse.json({ error: GENERIC }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Mật khẩu mới phải có ít nhất 8 ký tự." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: GENERIC }, { status: 401 });

  const result = await checkPin(user.id, body.pin);
  if (result.status === "locked") {
    return NextResponse.json({ error: "locked-out", lockedUntil: result.lockedUntil }, { status: 429 });
  }
  if (result.status === "wrong" && result.lockedUntil) {
    return NextResponse.json({ error: "locked-out", lockedUntil: result.lockedUntil }, { status: 429 });
  }
  if (result.status !== "ok") return NextResponse.json({ error: GENERIC }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), sessionVersion: { increment: 1 } },
  });
  return NextResponse.json({ ok: true });
}
