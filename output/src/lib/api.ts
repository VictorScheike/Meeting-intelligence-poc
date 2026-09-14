import type { AnalyzeResult, MeetingReport } from "./report-schema.ts";

export type ApiError = {
  error: string;
};

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ApiError;
    if (payload.error) {
      return payload.error;
    }
  } catch {
    // Fall through to the generic message.
  }
  return "Something went wrong. Please try again.";
}

export class RequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RequestError";
    this.status = status;
  }
}

export async function login(password: string): Promise<void> {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    throw new RequestError(await readError(response), response.status);
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", {
    method: "POST",
    credentials: "same-origin",
  });
}

export async function getSession(): Promise<boolean> {
  const response = await fetch("/api/session", { credentials: "same-origin" });
  if (!response.ok) {
    return false;
  }
  const payload = (await response.json()) as { authenticated?: boolean };
  return payload.authenticated === true;
}

export async function analyzeTranscript(transcript: string): Promise<AnalyzeResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    throw new RequestError(await readError(response), response.status);
  }

  return (await response.json()) as AnalyzeResult;
}

export function isMeetingReport(value: AnalyzeResult): value is MeetingReport {
  return value.ok;
}
