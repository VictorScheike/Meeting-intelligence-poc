interface Env {
  OPENAI_API_KEY: string;
  LOGIN_PASSWORD: string;
  SESSION_SECRET: string;
  TURNSTILE_SECRET: string;
  TURNSTILE_HOSTNAMES: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  RESEND_REPLY_TO?: string;
  RESEND_TEMPLATE_ID?: string;
  EMAIL_RATE_LIMIT: RateLimit;
}
