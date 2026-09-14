import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseTurnstileHostnames,
  TURNSTILE_SITEVERIFY_URL,
  verifyTurnstileToken,
} from "./turnstile.ts";

describe("parseTurnstileHostnames", () => {
  it("splits, trims, and drops empty values", () => {
    expect(
      parseTurnstileHostnames(" localhost ,127.0.0.1, ,example.com "),
    ).toEqual(new Set(["localhost", "127.0.0.1", "example.com"]));
  });
});

describe("verifyTurnstileToken", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accepts success with the expected action and hostname", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        action: "login",
        hostname: "localhost",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      verifyTurnstileToken({
        secret: "secret",
        token: "fresh-token-value",
        expectedAction: "login",
        expectedHostnames: new Set(["localhost"]),
        remoteip: "127.0.0.1",
      }),
    ).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      TURNSTILE_SITEVERIFY_URL,
      expect.objectContaining({
        method: "POST",
      }),
    );
    const body = fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams;
    expect(body.get("response")).toBe("fresh-token-value");
    expect(body.get("remoteip")).toBe("127.0.0.1");
  });

  it("rejects a successful token with the wrong action or hostname", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          action: "signup",
          hostname: "evil.example",
        }),
      }),
    );

    await expect(
      verifyTurnstileToken({
        secret: "secret",
        token: "fresh-token-value",
        expectedAction: "login",
        expectedHostnames: new Set(["localhost"]),
      }),
    ).resolves.toBe(false);
  });

  it("rejects empty tokens and siteverify failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, "error-codes": ["timeout-or-duplicate"] }),
      }),
    );

    await expect(
      verifyTurnstileToken({
        secret: "secret",
        token: "",
        expectedAction: "login",
        expectedHostnames: new Set(["localhost"]),
      }),
    ).resolves.toBe(false);

    await expect(
      verifyTurnstileToken({
        secret: "secret",
        token: "used-token",
        expectedAction: "login",
        expectedHostnames: new Set(["localhost"]),
      }),
    ).resolves.toBe(false);
  });
});
