# Meeting Intelligence

A small web app that turns meeting notes into a **brief**: a short summary, the decision, and next steps grouped by person. You can copy the brief, tick your own tasks, or email them.

This is a proof of concept, not a workplace product. It runs as one Cloudflare Worker with a React front end.

Live demo: https://meeting-intelligence.victorscheike.com

The demo uses a shared password (sent separately to reviewers, not stored in this repo). Production login also uses Cloudflare Turnstile.

## Generated reports

Markdown briefs for all three source meetings are in this folder. That is the minimum output if you do not run the app:

- `results/q1-2024-product-roadmap.md`
- `results/nordea-implementation-kickoff.md`
- `results/payment-service-architecture-review.md`

Regenerate them with `npm run generate:results` from `output/` if you have the local `../Input` notes and an OpenAI key. Those source `.txt` files are not committed.

---

## My approach

Meetings produce long notes that are hard to scan. The useful part is usually a handful of decisions and a list of who does what.

I built a signed-in demo that:

1. Starts from one of three sample meetings, or a `.txt` upload
2. Sends the notes to a Cloudflare Worker
3. Lets OpenAI fill a fixed JSON shape (title, date, type, summary, conclusion, people and their next steps)
4. Shows that as a brief in the browser

The Worker owns the OpenAI call and the prompt. The browser never sees the API key. Uploaded notes are checked so they look like a meeting (speaker names or timestamps), then wrapped as untrusted text so the model is asked to extract a brief, not follow commands inside the file.

Example notes live inside the Worker. They are not published as static files. Uploads go in the request and are not stored on the server. Briefs and checklist ticks stay in this browser’s `localStorage` only.

**Show note source** is a local highlighter, not a search product. OpenAI may return a short quote with each task. The app then looks for that quote (or similar words) in the original notes and paints the match. If nothing matches, it says so.

## What makes it valuable

| Person | What they get |
| --- | --- |
| Someone who missed the meeting | A 4–6 sentence summary plus a conclusion that is the decision, not a second recap |
| Someone who was in the meeting | Their own next steps, with a due date only when the notes actually said one |
| Someone sharing afterwards | Copy or email the whole brief, one person’s list, or a single step — without rewriting a chat log |
| A colleague checking the claim | Original notes beside the brief, with Show note source on a step |

The brief is meant to be used, not admired: checklists in the browser, copy, and email through Resend.

This will not replace a full meeting tool. The model can still miss a task or a surname. Emails can drop later people if the Resend template string hits its 2,000-character cap. Treat the three `results/` files as the reviewed samples.

## Technical decisions

I wanted one host, TypeScript end to end, and no database for a short PoC.

| Choice | Why |
| --- | --- |
| **Vite + React + TypeScript** | Fast UI work. Screens are React state (no React Router). |
| **Tailwind + shadcn-style UI** | Presentable without a design system. Radix for checkbox/label; Base UI for the right-click menu. |
| **Cloudflare Workers + Wrangler + Hono** | Same place serves the site and the API. `@cloudflare/vite-plugin` is used in dev and deploy. |
| **OpenAI `gpt-4o-mini`** | Cheap enough for a demo. Called with `fetch` (no SDK), `temperature: 0`, `seed: 7`, a strict JSON schema, then **Zod** again on the result. |
| **Cloudflare Turnstile** | Stops the public login form being hammered. Skipped in local Vite. |
| **HMAC session cookie** | Shared password in, signed cookie out (`mi_session`, 8 hours). Not real user accounts. |
| **Resend** | Sends mail from the Worker using the published `meeting-brief` template. React Email in `emails/` is only for local preview. |
| **Zod** | One schema for the API, the model, tests, and `generate:results`. Extra JSON keys are rejected. |
| **Vitest + oxlint** | Unit tests and lint without a heavy toolchain. |

Limits that matter when you try it:

- Upload: `.txt` only, **100 KB**, **200–100,000** characters
- OpenAI: **40 second** timeout, **12,000** max tokens
- Brief: up to **30** people, **20** steps each
- Email: **5 sends per minute** per session (Cloudflare rate limit), **1–10** recipients, template strings capped at **2,000** characters
- Cache: **12** briefs in `localStorage`

The in-app **How it’s built** page lists the same product behaviour.

## Trade-offs

**Shared password, not SSO.** Cloudflare Access or a real identity provider would be better for anything beyond a reviewer demo. A cookie is enough here.

**No database.** Checklists and cached briefs do not follow you to another browser. Adding D1 or similar would be the next step if this had to feel like a product.

**`.txt` only.** PDF and Word are the usual meeting export formats. They were left out on purpose to keep parsing and security simpler.

**Resend template, not `mailto`.** If `RESEND_API_KEY` and `RESEND_FROM` are missing, send shows an error instead of opening a mail client. That is stricter, and it also means email must be configured to demo sharing.

**gpt-4o-mini and a fixed schema.** A larger model or a second “did we miss anyone?” pass would catch more tasks. Cost and time said no for this PoC.

**Prompt wrapping is a precaution, not a guarantee.** Files that look like jailbreaks are rejected. Real meetings that mention those phrases are still analysed. Do not treat this as a solved security product.

**What I would do with more time:** SSO, store checklists per user, timestamps on extracted tasks, a small eval set against the three meetings, Calendar or Teams send, and rate limits on analyse as well as email.

## How to run it

### Review without installing

1. Read the three files under `results/`.
2. Open https://meeting-intelligence.victorscheike.com, sign in with the password you were given, generate a brief from a sample meeting, and (optionally) upload a `.txt`.
3. Open **How it’s built** in the header for the feature list.

### Run locally

All commands are from `output/`.

1. Copy `.dev.vars.example` to `.dev.vars`.
2. Fill at least `OPENAI_API_KEY`, `LOGIN_PASSWORD`, `SESSION_SECRET`, `TURNSTILE_SECRET`, and `TURNSTILE_HOSTNAMES=localhost,127.0.0.1`.
3. For email: `RESEND_API_KEY` and `RESEND_FROM` (a verified Resend address). `RESEND_REPLY_TO` is optional. `RESEND_TEMPLATE_ID` defaults to `meeting-brief`.

```bash
cd output
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`). Local Vite skips Turnstile and prefills the password so you can click Continue.

Other commands:

```bash
npm run test
npm run lint
npm run email          # React Email preview at http://localhost:3000
npm run generate:results
```

### Deploy (production)

Secrets stay in Wrangler, not in `wrangler.jsonc`:

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

`TURNSTILE_HOSTNAMES` and `RESEND_TEMPLATE_ID` are plain vars in `wrangler.jsonc`.

`npm run deploy` builds the app and publishes the Worker. After `wrangler secret put`, run `npm run deploy` (or at least `npm run build` first). Otherwise Cloudflare can publish the Vite source page and the window will not load.
