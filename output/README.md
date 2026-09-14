# Meeting Intelligence

Turn meeting transcripts into a brief someone can actually use: the outcome in 30 seconds, next steps by person, and a report that can be copied or emailed without reformatting.

Live URL: deploy this Worker, then replace this line with the `*.workers.dev` address. A custom domain such as `meeting.victorscheike.com` can be attached later the same way as other Cloudflare sites.

Demo password: the shared `LOGIN_PASSWORD` Worker secret. It is not stored in this repository.

## The problem

Workplace meetings produce long transcripts that are hard to scan. Someone who missed the meeting needs the outcome quickly. Someone who attended needs their own tasks. Someone briefing others needs a clean report, not a chat log.

## What this product does

A signed-in user chooses one of the three included examples or uploads a `.txt` transcript. The browser sends the text as JSON. A Cloudflare Worker validates the session and transcript, calls OpenAI with a server-owned prompt and schema, validates the JSON again, and returns a meeting brief.

The brief always uses one schema: title, date, meeting type, a short summary, a decision-focused conclusion, and next steps grouped by named person. Due dates appear only when the transcript actually states them.

## Why this shape

The summary is for the person who missed the meeting. The conclusion is the organisation-level decision, not a second recap. Per-person checklists are for the people who have to do the work, and they copy or email without touching the rest of the report.

## Generated reports

This repository includes validated Markdown reports for all three source meetings:

- `results/q1-2024-product-roadmap.md`
- `results/nordea-implementation-kickoff.md`
- `results/payment-service-architecture-review.md`

Regenerate them from the repo root of this app:

```bash
cd output
npm run generate:results
```

The command reads `../Input`, uses the same analysis function, system instruction and Zod schema as the live Worker, and refuses to write a file if validation fails.

## Architecture

```text
Password login
  -> choose an example or upload one .txt file
  -> POST /api/analyze { transcript }
  -> Worker checks the signed session and transcript
  -> OpenAI returns structured JSON
  -> Zod validates the result
  -> the UI renders the brief
```

The original file is never uploaded as multipart data and is never stored. Checklist ticks live in `localStorage` only.

## Technology

Vite, React, TypeScript, Tailwind CSS and shadcn/ui keep the UI small and presentable. A Hono Worker on Cloudflare is the entire backend. OpenAI is called only from the Worker. Zod is shared by the API, the model response, tests and the result-generation script. That set is enough for a 3-4 hour proof of concept without a database or a second hosting platform.

## Local setup

1. Copy `.dev.vars.example` to `.dev.vars` and fill `OPENAI_API_KEY`, `LOGIN_PASSWORD` and `SESSION_SECRET`.
2. Install dependencies and start the app from `output`:

```bash
npm install
npm run dev
```

3. Useful commands:

```bash
npm run test
npm run lint
npm run build
npm run generate:results
```

## Cloudflare deploy

Set Worker secrets before the first production request. Do not put these values in `wrangler.jsonc`.

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put LOGIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npm run deploy
```

`npm run deploy` builds the Vite app and deploys the Worker with static assets.

## Security choices

- The OpenAI key is read only as `env.OPENAI_API_KEY` in Worker code. The React bundle never receives it.
- Login creates an HttpOnly, SameSite=Lax, time-limited HMAC cookie. `Secure` is enabled on HTTPS.
- `/api/analyze` returns 401 without a valid session.
- Requests must be JSON with a known shape. Extra keys are rejected. The client cannot choose the model, prompt or token limit.
- Transcripts are limited to `.txt`, 100 KB on the client, and 100,000 characters on the server.
- Model output is parsed with Zod before it reaches the UI. React renders values as text, never as HTML.
- The speaker/timestamp heuristic is an input guard, not a claim that prompt injection is solved. Transcript text is still treated as untrusted content.

## Trade-offs

This is a shared-password demo, not an identity provider. There is no database, so checklists do not follow a person across browsers. PDF/DOCX and a mail server are out of scope. `mailto:` is used for sharing, with a clipboard fallback when the URL is too long.

## If we had more time

Cloudflare Access or SSO, platform-level rate limiting, source timestamps on extracted tasks, a small evaluation set against the three meetings, persistent per-user checklist state, and workplace integrations such as Calendar or Teams would be the next additions.
