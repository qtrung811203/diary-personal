import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-helpers";
import { ensureMoods } from "@/lib/mood-store";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;

  if (!EMAIL_PATTERN.test(email) || password.length < 8) {
    return NextResponse.json(
      { error: "Email không hợp lệ hoặc mật khẩu phải có ít nhất 8 ký tự." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email này đã được đăng ký." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  // Best-effort: moods are also seeded lazily on first read.
  await ensureMoods(user.id).catch(() => {});

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
