# Meeting Intelligence

Turn Original meeting notes into something someone can actually use: the outcome in 30 seconds, next steps by person, and a report that can be copied or emailed without reformatting.

Live demo: https://meeting-intelligence.victorscheike.com

The demo is password protected. The password is shared separately with reviewers and is stored only as a Cloudflare Worker secret. It is not included in this repository. Sign-in also requires Cloudflare Turnstile. The Worker checks the Turnstile token with Siteverify before it compares the password.

## The problem

Workplace meetings produce long Original meeting notes that are hard to scan. Someone who missed the meeting needs the outcome quickly. Someone who attended needs their own tasks. Someone sharing with others needs a clean report, not a chat log.

## What this product does

A signed-in user can generate a fresh brief from one of three example meetings, read the Original meeting notes in an embedded window, or upload a `.txt` of Original meeting notes. Generate Brief and uploads both call the Worker. The Worker validates the session and Original meeting notes, calls OpenAI with a server-owned prompt and schema, validates the JSON again, and returns a meeting brief. Example Original meeting notes stay inside the Worker; they are not published as static files. Briefs from this browser are cached in `localStorage`, and recent uploads appear on the home page.

The brief always uses one schema: title, date, meeting type, a short summary, a decision-focused conclusion, and next steps grouped by named person. Due dates appear only when the Original meeting notes actually state them.

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

The command reads local `../Input` Original meeting notes when regenerating reports on a machine that has them. Those files are not committed, not copied into `public/`, and not required to run or deploy the app.

## Architecture

```text
Password login (Turnstile + shared password)
  -> generate a brief from an example, read the Original meeting notes, or upload one .txt file
  -> POST /api/analyze-example { exampleId } or POST /api/analyze { transcript }
  -> GET /api/examples/:id/notes for the Original meeting notes
  -> Worker checks the signed session and Original meeting notes
  -> OpenAI returns structured JSON
  -> Zod validates the result
  -> the UI renders the brief
```

Example Original meeting notes are bundled into the Worker only and are not served from `public/`. Uploaded files are sent as JSON and are never stored on the server. Generated briefs and checklist ticks live in `localStorage` only.

## Technology

Vite, React, TypeScript, Tailwind CSS and shadcn/ui keep the UI small and presentable. A Hono Worker on Cloudflare is the entire backend. OpenAI is called only from the Worker. Zod is shared by the API, the model response, tests and the result-generation script. That set is enough for a 3-4 hour proof of concept without a database or a second hosting platform.

## Local setup

1. Copy `.dev.vars.example` to `.dev.vars` and fill `OPENAI_API_KEY`, `LOGIN_PASSWORD`, `SESSION_SECRET`, `TURNSTILE_SECRET`, and `TURNSTILE_HOSTNAMES` (`localhost,127.0.0.1` for local development). To send briefs through Resend, also set `RESEND_API_KEY` and `RESEND_FROM` (a verified domain address such as `Meeting Intelligence <briefs@mail.example.com>`). `RESEND_REPLY_TO` is optional. `RESEND_TEMPLATE_ID` defaults to the published `meeting-brief` template alias.
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
npm run email
npm run generate:results
```

`npm run email` starts the React Email preview at `http://localhost:3000` for the local meeting brief templates in `emails/`. Production sending uses the published Resend template (`meeting-brief`), not those `.tsx` files.

## Cloudflare deploy

Set Worker secrets before the first production request. Do not put these values in `wrangler.jsonc`.

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put LOGIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM
npx wrangler secret put RESEND_REPLY_TO
npm run deploy
```

`TURNSTILE_HOSTNAMES` and `RESEND_TEMPLATE_ID` are not secrets. Production uses the values in `wrangler.jsonc`. Local `.dev.vars` should set `TURNSTILE_HOSTNAMES=localhost,127.0.0.1` so Siteverify accepts the local widget. `RESEND_TEMPLATE_ID` defaults to `meeting-brief`.

`npm run deploy` builds the Vite app and deploys the Worker with static assets.

## Security choices

- The OpenAI key is read only as `env.OPENAI_API_KEY` in Worker code. The React bundle never receives it.
- Login creates an HttpOnly, SameSite=Lax, time-limited HMAC cookie. `Secure` is enabled on HTTPS.
- `/api/login` requires a Turnstile token. The Worker validates it with Siteverify (`success`, action `login`, and an allowed hostname) before it checks the password.
- `/api/analyze` returns 401 without a valid session.
- Requests must be JSON with a known shape. Extra keys are rejected. The client cannot choose the model, prompt or token limit.
- `/api/send-brief` is rate limited to 5 sends per minute per session.
- Uploaded files must look like meeting notes (speaker names or timestamps). Files that look like jailbreak instructions for an AI — only LLM-role speakers plus injection phrases, or injection phrases with no meeting structure — are rejected before OpenAI is called.
- Original meeting notes are limited to `.txt`, 100 KB on the client, and 100,000 characters on the server.
- Model output is parsed with Zod before it reaches the UI. React renders values as text, never as HTML.
- Uploaded transcript text is wrapped in delimiter tags and sent as untrusted content. The model is told to extract a brief and not follow commands inside that block. Real meetings that mention jailbreak phrases are still analysed. This reduces prompt-injection risk; it is not a claim that injection is fully solved.

## Trade-offs

This is a shared-password demo, not an identity provider. There is no database, so checklists do not follow a person across browsers. PDF/DOCX are out of scope. Whole-brief, per-person, and next-step emails all go through Resend's stored `meeting-brief` template. If `RESEND_API_KEY` and `RESEND_FROM` are missing, the send dialog shows an error instead of opening a mail client.

## If we had more time

Cloudflare Access or SSO, platform-level rate limiting, source timestamps on extracted tasks, a small evaluation set against the three meetings, persistent per-user checklist state, and workplace integrations such as Calendar or Teams would be the next additions.
