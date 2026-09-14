import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { AnalysisError, extractMeetingReport } from "../src/lib/analyze.ts";
import { SESSION_COOKIE_NAME } from "../src/lib/constants.ts";
import { EXAMPLE_MEETINGS } from "../src/lib/examples.ts";
import {
  emailConfigured,
  resendTemplateId,
  sendBriefRequestSchema,
} from "../src/lib/email.ts";
import {
  analyzeExampleRequestSchema,
  analyzeRequestSchema,
  loginRequestSchema,
} from "../src/lib/report-schema.ts";
import {
  parseTurnstileHostnames,
  TURNSTILE_LOGIN_ACTION,
  verifyTurnstileToken,
} from "../src/lib/turnstile.ts";
import { sendMeetingBrief } from "./send-brief.ts";
import { emailRateLimitKey } from "./rate-limit.ts";
import {
  createSessionToken,
  passwordsMatch,
  verifySessionToken,
} from "../src/lib/session.ts";
import { validateTranscript } from "../src/lib/transcript.ts";
import {
  getExampleTranscript,
  isExampleId,
} from "./example-catalog.ts";

const app = new Hono<{ Bindings: Env }>();

function jsonError(
  message: string,
  status: 400 | 401 | 403 | 429 | 500 | 502 | 503 | 504,
) {
  return Response.json({ error: message }, { status });
}

function isMutating(method: string): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function isSameOriginRequest(request: Request): boolean {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin) {
    return origin === url.origin;
  }

  const site = request.headers.get("Sec-Fetch-Site");
  return site === "same-origin" || site === "none" || site === null;
}

function hasJsonContentType(request: Request): boolean {
  const contentType = request.headers.get("Content-Type") ?? "";
  return contentType.toLowerCase().startsWith("application/json");
}

function cookieSecure(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}

function isLocalDevHost(request: Request): boolean {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

async function requireSession(request: Request, secret: string): Promise<boolean> {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  const token = match?.[1];
  if (!token) {
    return false;
  }
  return verifySessionToken(decodeURIComponent(token), secret);
}

app.onError((error, c) => {
  if (error instanceof AnalysisError) {
    return jsonError(error.message, error.status as 400 | 401 | 403 | 500 | 502 | 504);
  }
  console.error("Unhandled worker error", error instanceof Error ? error.message : "unknown");
  return c.json({ error: "Something went wrong. Please try again." }, 500);
});

app.use("/api/*", async (c, next) => {
  if (isMutating(c.req.method) && !isSameOriginRequest(c.req.raw)) {
    return jsonError("Request origin is not allowed.", 403);
  }
  await next();
});

app.all("/examples/*", (c) => c.json({ error: "Not found." }, 404));

app.post("/api/login", async (c) => {
  if (!hasJsonContentType(c.req.raw)) {
    return jsonError("Content-Type must be application/json.", 400);
  }

  const password = c.env.LOGIN_PASSWORD;
  const secret = c.env.SESSION_SECRET;
  const turnstileSecret = c.env.TURNSTILE_SECRET;
  const expectedHostnames = parseTurnstileHostnames(c.env.TURNSTILE_HOSTNAMES);
  const localDev = isLocalDevHost(c.req.raw);
  if (!password || !secret) {
    console.error("Login is missing required server secrets");
    return jsonError("This demo is not configured yet.", 500);
  }
  if (!localDev && (!turnstileSecret || expectedHostnames.size === 0)) {
    console.error("Login is missing required server secrets");
    return jsonError("This demo is not configured yet.", 500);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = loginRequestSchema.safeParse(body);
  if (!parsed.success) {
    const tokenIssue = parsed.error.issues.some(
      (issue) => issue.path[0] === "cf-turnstile-response",
    );
    if (tokenIssue) {
      return jsonError("Verification failed. Please try again.", 403);
    }
    return jsonError("Enter a password to continue.", 400);
  }

  if (!localDev) {
    const remoteip =
      c.req.header("CF-Connecting-IP") ??
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim();
    const verified = await verifyTurnstileToken({
      secret: turnstileSecret,
      token: parsed.data["cf-turnstile-response"],
      ...(remoteip ? { remoteip } : {}),
      expectedAction: TURNSTILE_LOGIN_ACTION,
      expectedHostnames,
    });
    if (!verified) {
      return jsonError("Verification failed. Please try again.", 403);
    }
  }

  const matched = await passwordsMatch(parsed.data.password, password);
  if (!matched) {
    return jsonError("That password is incorrect.", 401);
  }

  const session = await createSessionToken(secret);
  setCookie(c, SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    secure: cookieSecure(c.req.raw),
    expires: new Date(session.expiresAt),
  });

  return c.json({ authenticated: true });
});

app.post("/api/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, {
    path: "/",
    secure: cookieSecure(c.req.raw),
    sameSite: "Lax",
  });
  return c.json({ authenticated: false });
});

app.get("/api/session", async (c) => {
  const secret = c.env.SESSION_SECRET;
  if (!secret) {
    return c.json({ authenticated: false });
  }
  const token = getCookie(c, SESSION_COOKIE_NAME);
  const authenticated = token ? await verifySessionToken(token, secret) : false;
  return c.json({
    authenticated,
    canSendEmail: authenticated && emailConfigured(c.env),
  });
});

app.post("/api/analyze", async (c) => {
  if (!hasJsonContentType(c.req.raw)) {
    return jsonError("Content-Type must be application/json.", 400);
  }

  const secret = c.env.SESSION_SECRET;
  const apiKey = c.env.OPENAI_API_KEY;
  if (!secret || !apiKey) {
    console.error("Analyze is missing required server secrets");
    return jsonError("This demo is not configured yet.", 500);
  }

  const authenticated = await requireSession(c.req.raw, secret);
  if (!authenticated) {
    return jsonError("Your session has expired. Please sign in again.", 401);
  }

  const contentLength = Number(c.req.header("Content-Length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 250_000) {
    return jsonError("The Original meeting notes exceed the size limit.", 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Send a JSON object with the Original meeting notes.", 400);
  }

  const transcriptCheck = validateTranscript(parsed.data.transcript);
  if (!transcriptCheck.ok) {
    return jsonError(transcriptCheck.message, 400);
  }

  const report = await extractMeetingReport(parsed.data.transcript, apiKey);
  return c.json(report);
});

app.get("/api/examples/:id/notes", async (c) => {
  const secret = c.env.SESSION_SECRET;
  if (!secret) {
    return jsonError("This demo is not configured yet.", 500);
  }
  const authenticated = await requireSession(c.req.raw, secret);
  if (!authenticated) {
    return jsonError("Your session has expired. Please sign in again.", 401);
  }

  const id = c.req.param("id");
  if (!isExampleId(id)) {
    return c.json({ error: "Example not found." }, 404);
  }

  const meeting = EXAMPLE_MEETINGS.find((entry) => entry.id === id);
  if (!meeting) {
    return c.json({ error: "Example not found." }, 404);
  }

  return c.json({
    id,
    title: meeting.title,
    date: meeting.date,
    transcript: getExampleTranscript(id),
  });
});

app.post("/api/analyze-example", async (c) => {
  if (!hasJsonContentType(c.req.raw)) {
    return jsonError("Content-Type must be application/json.", 400);
  }

  const secret = c.env.SESSION_SECRET;
  const apiKey = c.env.OPENAI_API_KEY;
  if (!secret || !apiKey) {
    console.error("Analyze is missing required server secrets");
    return jsonError("This demo is not configured yet.", 500);
  }

  const authenticated = await requireSession(c.req.raw, secret);
  if (!authenticated) {
    return jsonError("Your session has expired. Please sign in again.", 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = analyzeExampleRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Choose one of the included example meetings.", 400);
  }

  const transcript = getExampleTranscript(parsed.data.exampleId);
  const transcriptCheck = validateTranscript(transcript);
  if (!transcriptCheck.ok) {
    return jsonError(transcriptCheck.message, 400);
  }

  const report = await extractMeetingReport(transcript, apiKey);
  return c.json(report);
});

app.post("/api/send-brief", async (c) => {
  if (!hasJsonContentType(c.req.raw)) {
    return jsonError("Content-Type must be application/json.", 400);
  }

  const secret = c.env.SESSION_SECRET;
  if (!secret) {
    console.error("Send brief is missing required server secrets");
    return jsonError("This demo is not configured yet.", 500);
  }

  const authenticated = await requireSession(c.req.raw, secret);
  if (!authenticated) {
    return jsonError("Your session has expired. Please sign in again.", 401);
  }

  if (!emailConfigured(c.env) || !c.env.RESEND_API_KEY || !c.env.RESEND_FROM) {
    return jsonError(
      "Email sending is not configured yet. Set RESEND_API_KEY and RESEND_FROM on the server.",
      503,
    );
  }

  const { success } = await c.env.EMAIL_RATE_LIMIT.limit({
    key: emailRateLimitKey(
      getCookie(c, SESSION_COOKIE_NAME),
      c.req.header("CF-Connecting-IP"),
    ),
  });
  if (!success) {
    return jsonError(
      "Too many emails were sent. Please wait a minute and try again.",
      429,
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = sendBriefRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Enter valid recipient addresses and a meeting brief.", 400);
  }

  const result = await sendMeetingBrief({
    apiKey: c.env.RESEND_API_KEY,
    from: c.env.RESEND_FROM,
    replyTo: c.env.RESEND_REPLY_TO,
    templateId: resendTemplateId(c.env),
    request: parsed.data,
  });

  if (!result.ok) {
    return jsonError(result.message, result.status);
  }

  return c.json({ ok: true, id: result.id });
});

export default app;
