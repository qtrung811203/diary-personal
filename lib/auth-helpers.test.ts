import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./auth-helpers";

describe("auth-helpers", () => {
  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("correct-horse");
    expect(await verifyPassword("correct-horse", hash)).toBe(true);
  });
  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct-horse");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});
