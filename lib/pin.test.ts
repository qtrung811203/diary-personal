import { describe, expect, it } from "vitest";
import {
  PIN_LOCK_MS,
  PIN_MAX_FAILS,
  afterFailedAttempt,
  isPinLocked,
  isValidPin,
  signUnlockToken,
  verifyUnlockToken,
} from "./pin";

describe("isValidPin", () => {
  it("accepts exactly 6 digits", () => {
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("000000")).toBe(true);
  });
  it("rejects anything else", () => {
    for (const v of ["12345", "1234567", "12345a", "12 456", "", null, undefined, 123456]) {
      expect(isValidPin(v)).toBe(false);
    }
  });
});

describe("pin attempt limiting", () => {
  const now = new Date("2026-10-29T10:00:00Z");

  it("counts wrong guesses without locking before the limit", () => {
    const s = afterFailedAttempt(PIN_MAX_FAILS - 2, now);
    expect(s).toEqual({ failedCount: PIN_MAX_FAILS - 1, lockedUntil: null });
  });

  it("locks for 15 minutes on the 5th wrong guess and resets the counter", () => {
    const s = afterFailedAttempt(PIN_MAX_FAILS - 1, now);
    expect(s.failedCount).toBe(0);
    expect(s.lockedUntil).toEqual(new Date(now.getTime() + PIN_LOCK_MS));
    expect(PIN_LOCK_MS).toBe(15 * 60 * 1000);
  });

  it("isPinLocked is true only while lockedUntil is in the future", () => {
    const later = new Date(now.getTime() + 1000);
    expect(isPinLocked(later, now)).toBe(true);
    expect(isPinLocked(now, now)).toBe(false);
    expect(isPinLocked(null, now)).toBe(false);
  });
});

describe("unlock token", () => {
  const secret = "test-secret";
  const now = 1_000_000;
  const payload = { uid: "u1", sv: 2 };

  it("round-trips a valid token", () => {
    const t = signUnlockToken(payload, secret, now);
    expect(verifyUnlockToken(t, secret, now + 1000)).toEqual(payload);
  });
  it("rejects a wrong secret, tampering and garbage", () => {
    const t = signUnlockToken(payload, secret, now);
    expect(verifyUnlockToken(t, "other", now)).toBeNull();
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ uid: "u2", sv: 2, exp: now + 99999999 })).toString("base64url");
    expect(verifyUnlockToken(`${forged}.${sig}`, secret, now)).toBeNull();
    expect(verifyUnlockToken(body, secret, now)).toBeNull();
    expect(verifyUnlockToken("", secret, now)).toBeNull();
    expect(verifyUnlockToken(null, secret, now)).toBeNull();
  });
  it("rejects an expired token", () => {
    const t = signUnlockToken(payload, secret, now);
    expect(verifyUnlockToken(t, secret, now + 13 * 60 * 60 * 1000)).toBeNull();
  });
});
