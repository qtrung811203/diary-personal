import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyUnlockToken } from "@/lib/pin";

export const UNLOCK_HEADER = "x-unlock-token";

export async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

type Guard = { ok: true; userId: string } | { ok: false; response: NextResponse };

// Logged in (valid session whose sessionVersion is still current), no PIN
// token required — for the /api/pin/* endpoints themselves.
export async function requireSession(): Promise<Guard & { sessionVersion?: number }> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { sessionVersion: true } });
  if (!user || user.sessionVersion !== session.user.sv) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, userId, sessionVersion: user.sessionVersion };
}

// Diary data: needs a session AND this tab's PIN unlock token (423 if not).
export async function requireUnlocked(): Promise<Guard> {
  const s = await requireSession();
  if (!s.ok) return s;
  const token = (await headers()).get(UNLOCK_HEADER);
  const payload = verifyUnlockToken(token, process.env.NEXTAUTH_SECRET ?? "", Date.now());
  if (!payload || payload.uid !== s.userId || payload.sv !== s.sessionVersion) {
    return { ok: false, response: NextResponse.json({ error: "locked" }, { status: 423 }) };
  }
  return { ok: true, userId: s.userId };
}
