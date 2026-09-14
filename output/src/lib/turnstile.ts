/** Cloudflare's always-pass test sitekey. Used only in local Vite dev. */
export const TURNSTILE_DEV_SITEKEY = "1x00000000000000000000AA";
export const TURNSTILE_SITEKEY = import.meta.env.DEV
  ? TURNSTILE_DEV_SITEKEY
  : "0x4AAAAAAE0EQgDbwiIn88l6";
export const TURNSTILE_LOGIN_ACTION = "login";
export const TURNSTILE_TOKEN_MAX_LENGTH = 2048;
export const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type SiteverifyResult = {
  success: boolean;
  action?: string;
  hostname?: string;
};

export function parseTurnstileHostnames(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );
}

export function isUsableTurnstileToken(token: string): boolean {
  return token.length > 0 && token.length <= TURNSTILE_TOKEN_MAX_LENGTH;
}

function asSiteverifyResult(value: unknown): SiteverifyResult | null {
  if (typeof value !== "object" || value === null || !("success" in value)) {
    return null;
  }
  const success = Reflect.get(value, "success");
  if (typeof success !== "boolean") {
    return null;
  }
  const action = Reflect.get(value, "action");
  const hostname = Reflect.get(value, "hostname");
  return {
    success,
    ...(typeof action === "string" ? { action } : {}),
    ...(typeof hostname === "string" ? { hostname } : {}),
  };
}

export async function verifyTurnstileToken(input: {
  secret: string;
  token: string;
  remoteip?: string;
  expectedAction: string;
  expectedHostnames: Set<string>;
}): Promise<boolean> {
  if (
    !isUsableTurnstileToken(input.token) ||
    input.expectedHostnames.size === 0 ||
    input.secret.length === 0
  ) {
    return false;
  }

  const body = new URLSearchParams({
    secret: input.secret,
    response: input.token,
  });
  if (input.remoteip) {
    body.set("remoteip", input.remoteip);
  }

  let result: SiteverifyResult | null;
  try {
    const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body,
    });
    if (!response.ok) {
      return false;
    }
    result = asSiteverifyResult(await response.json());
  } catch {
    return false;
  }

  return (
    result !== null &&
    result.success === true &&
    result.action === input.expectedAction &&
    typeof result.hostname === "string" &&
    input.expectedHostnames.has(result.hostname)
  );
}
