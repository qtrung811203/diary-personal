import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth-helpers";
import { PIN_MAX_FAILS, afterFailedAttempt, isPinLocked, signUnlockToken } from "@/lib/pin";

export type PinCheck =
  | { status: "ok" }
  | { status: "no-pin" }
  | { status: "locked"; lockedUntil: Date }
  | { status: "wrong"; remaining: number; lockedUntil: Date | null };

// Checks a PIN against the account, applying the shared 5-tries / 15-minute
// lockout. Used both for unlocking a tab and for password reset.
export async function checkPin(userId: string, pin: string): Promise<PinCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pinHash: true, pinFailedCount: true, pinLockedUntil: true },
  });
  if (!user?.pinHash) return { status: "no-pin" };

  const now = new Date();
  if (user.pinLockedUntil && isPinLocked(user.pinLockedUntil, now)) {
    return { status: "locked", lockedUntil: user.pinLockedUntil };
  }

  if (await verifyPassword(pin, user.pinHash)) {
    if (user.pinFailedCount !== 0 || user.pinLockedUntil) {
      await prisma.user.update({ where: { id: userId }, data: { pinFailedCount: 0, pinLockedUntil: null } });
    }
    return { status: "ok" };
  }

  const next = afterFailedAttempt(user.pinFailedCount, now);
  await prisma.user.update({
    where: { id: userId },
    data: { pinFailedCount: next.failedCount, pinLockedUntil: next.lockedUntil },
  });
  return { status: "wrong", remaining: next.lockedUntil ? 0 : PIN_MAX_FAILS - next.failedCount, lockedUntil: next.lockedUntil };
}

export function unlockTokenFor(userId: string, sessionVersion: number): string {
  return signUnlockToken({ uid: userId, sv: sessionVersion }, process.env.NEXTAUTH_SECRET ?? "", Date.now());
}
