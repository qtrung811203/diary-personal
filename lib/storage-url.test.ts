import { describe, it, expect } from "vitest";
import { extractStorageKey } from "./storage-url";

describe("extractStorageKey", () => {
  const bucket = "together-diary";
  const publicUrlBase = "https://example.com/media";
  const internalEndpoint = "http://127.0.0.1:9000";

  it("extracts the key from a URL built on the public base", () => {
    expect(
      extractStorageKey(
        "https://example.com/media/together-diary/abc-123.png",
        bucket,
        publicUrlBase,
        internalEndpoint
      )
    ).toBe("abc-123.png");
  });

  it("extracts the key from a URL built on the internal endpoint (dev, where they're the same)", () => {
    expect(
      extractStorageKey(
        "http://127.0.0.1:9000/together-diary/abc-123.png",
        bucket,
        internalEndpoint,
        internalEndpoint
      )
    ).toBe("abc-123.png");
  });

  it("returns null for a URL from a different host (never delete someone else's URL)", () => {
    expect(
      extractStorageKey(
        "https://evil.example/together-diary/abc-123.png",
        bucket,
        publicUrlBase,
        internalEndpoint
      )
    ).toBe(null);
  });

  it("returns null for a malformed URL", () => {
    expect(
      extractStorageKey("not-a-url", bucket, publicUrlBase, internalEndpoint)
    ).toBe(null);
  });
});
