export function emailRateLimitKey(
  sessionToken: string | undefined,
  connectingIp: string | undefined,
): string {
  const session = sessionToken?.trim();
  if (session) {
    return `send-brief:${session}`;
  }
  const ip = connectingIp?.trim();
  return `send-brief:${ip && ip.length > 0 ? ip : "anon"}`;
}
