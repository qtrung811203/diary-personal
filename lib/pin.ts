import { createHmac, timingSafeEqual } from "node:crypto";

export const PIN_MAX_FAILS = 5;
export const PIN_LOCK_MS = 15 * 60 * 1000;
// Server-side lifetime of a tab's unlock token; the client also locks sooner
// when idle.
export const UNLOCK_TTL_MS = 12 * 60 * 60 * 1000;

export function isValidPin(value: unknown): value is string {
  return typeof value === "string" && /^\d{6}$/.test(value);
}

export function isPinLocked(lockedUntil: Date | null, now: Date): boolean {
  return !!lockedUntil && lockedUntil.getTime() > now.getTime();
}

// State to store after a wrong PIN: the 5th wrong guess starts a lockout and
// resets the counter, so the next window gets 5 fresh tries.
export function afterFailedAttempt(
  failedCount: number,
  now: Date
): { failedCount: number; lockedUntil: Date | null } {
  const next = failedCount + 1;
  if (next >= PIN_MAX_FAILS) {
    return { failedCount: 0, lockedUntil: new Date(now.getTime() + PIN_LOCK_MS) };
  }
  return { failedCount: next, lockedUntil: null };
}

// Per-tab proof that the PIN was entered: "<base64url json>.<base64url hmac>".
export type UnlockPayload = { uid: string; sv: number };

function mac(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function signUnlockToken(payload: UnlockPayload, secret: string, nowMs: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: nowMs + UNLOCK_TTL_MS })).toString("base64url");
  return `${body}.${mac(body, secret)}`;
}

export function verifyUnlockToken(
  token: string | null | undefined,
  secret: string,
  nowMs: number
): UnlockPayload | null {
  if (!token) return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const expected = Buffer.from(mac(body, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof data.uid !== "string" || typeof data.sv !== "number" || typeof data.exp !== "number") return null;
    if (data.exp <= nowMs) return null;
    return { uid: data.uid, sv: data.sv };
  } catch {
    return null;
  }
}
