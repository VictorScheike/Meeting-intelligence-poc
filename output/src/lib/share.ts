import { MAILTO_URL_LIMIT } from "./constants.ts";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function buildMailtoUrl(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function shareByEmail(
  subject: string,
  body: string,
): Promise<"opened" | "copied" | "failed"> {
  const url = buildMailtoUrl(subject, body);
  if (url.length > MAILTO_URL_LIMIT) {
    const copied = await copyText(body);
    return copied ? "copied" : "failed";
  }

  window.location.href = url;
  return "opened";
}
