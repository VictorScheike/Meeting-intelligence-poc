import type { SendBriefRequest } from "./email.ts";
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

export async function login(password: string, turnstileToken: string): Promise<void> {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      password,
      "cf-turnstile-response": turnstileToken,
    }),
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

export type SessionState = {
  authenticated: boolean;
  canSendEmail: boolean;
};

export async function getSession(): Promise<SessionState> {
  const response = await fetch("/api/session", { credentials: "same-origin" });
  if (!response.ok) {
    return { authenticated: false, canSendEmail: false };
  }
  const payload = (await response.json()) as {
    authenticated?: boolean;
    canSendEmail?: boolean;
  };
  return {
    authenticated: payload.authenticated === true,
    canSendEmail: payload.canSendEmail === true,
  };
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

export async function analyzeExample(exampleId: string): Promise<AnalyzeResult> {
  const response = await fetch("/api/analyze-example", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ exampleId }),
  });

  if (!response.ok) {
    throw new RequestError(await readError(response), response.status);
  }

  return (await response.json()) as AnalyzeResult;
}

export type ExampleNotes = {
  id: string;
  title: string;
  date: string;
  transcript: string;
};

export async function fetchExampleNotes(exampleId: string): Promise<ExampleNotes> {
  const response = await fetch(`/api/examples/${exampleId}/notes`, {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new RequestError(await readError(response), response.status);
  }

  return (await response.json()) as ExampleNotes;
}

export function isMeetingReport(value: AnalyzeResult): value is MeetingReport {
  return value.ok;
}

export async function sendBrief(payload: SendBriefRequest): Promise<void> {
  const response = await fetch("/api/send-brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new RequestError(await readError(response), response.status);
  }
}
