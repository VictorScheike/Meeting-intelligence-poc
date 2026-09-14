import { SESSION_TTL_MS } from "./constants.ts";

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const binary = atob(`${padded}${"=".repeat(padLength)}`);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.byteLength; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function hmacSign(secret: string, payload: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToBase64Url(signature);
}

export async function passwordsMatch(
  provided: string,
  expected: string,
): Promise<boolean> {
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return timingSafeEqual(
    new Uint8Array(providedHash),
    new Uint8Array(expectedHash),
  );
}

export async function createSessionToken(
  secret: string,
  now = Date.now(),
): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = now + SESSION_TTL_MS;
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify({ exp: expiresAt })));
  const signature = await hmacSign(secret, payload);
  return { token: `${payload}.${signature}`, expiresAt };
}

export async function verifySessionToken(
  token: string,
  secret: string,
  now = Date.now(),
): Promise<boolean> {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) {
    return false;
  }

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!payload || !signature) {
    return false;
  }

  const expected = await hmacSign(secret, payload);
  if (!timingSafeEqual(base64UrlToBytes(signature), base64UrlToBytes(expected))) {
    return false;
  }

  try {
    const decoded = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payload)),
    ) as { exp?: unknown };
    return typeof decoded.exp === "number" && decoded.exp > now;
  } catch {
    return false;
  }
}
