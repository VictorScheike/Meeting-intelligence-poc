import { describe, expect, it } from "vitest";
import { emailRateLimitKey } from "./rate-limit.ts";

describe("emailRateLimitKey", () => {
  it("prefers the session cookie over the connecting IP", () => {
    expect(emailRateLimitKey("session-token", "203.0.113.10")).toBe(
      "send-brief:session-token",
    );
  });

  it("falls back to the connecting IP when there is no session", () => {
    expect(emailRateLimitKey(undefined, "203.0.113.10")).toBe(
      "send-brief:203.0.113.10",
    );
  });

  it("uses a stable anonymous key when both are missing", () => {
    expect(emailRateLimitKey("  ", "")).toBe("send-brief:anon");
  });
});
