import { describe, expect, it } from "vitest";
import { createSessionToken, passwordsMatch, verifySessionToken } from "./session.ts";

describe("session signing", () => {
  it("creates a token that verifies before expiry", async () => {
    const secret = "test-session-secret-value";
    const { token } = await createSessionToken(secret, 1_000);
    await expect(verifySessionToken(token, secret, 1_500)).resolves.toBe(true);
  });

  it("rejects an expired token", async () => {
    const secret = "test-session-secret-value";
    const { token } = await createSessionToken(secret, 1_000);
    await expect(verifySessionToken(token, secret, 1_000 + 9 * 60 * 60 * 1000)).resolves.toBe(
      false,
    );
  });

  it("rejects a tampered token", async () => {
    const secret = "test-session-secret-value";
    const { token } = await createSessionToken(secret, 1_000);
    const tampered = `${token.slice(0, -2)}aa`;
    await expect(verifySessionToken(tampered, secret, 1_500)).resolves.toBe(false);
  });
});

describe("password comparison", () => {
  it("matches equal passwords and rejects different ones", async () => {
    await expect(passwordsMatch("correct-horse", "correct-horse")).resolves.toBe(true);
    await expect(passwordsMatch("correct-horse", "wrong-battery")).resolves.toBe(false);
  });
});
