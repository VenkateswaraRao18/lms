# Deploy Studio LMS to Vercel (Neon Postgres)

Use this when **students** use the hosted app; keep **Ollama / AI authoring** on your machine if you prefer.

## 1. Repo on GitHub

Push this project to a GitHub repository Vercel can import.

## 2. Create the Vercel project

1. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project** → import the repo.
2. **Framework Preset:** Next.js (auto-detected).
3. **Build Command:** `npm run build` (default).
4. **Install Command:** `npm install` (default).
5. **Output:** leave default (do not override with Docker).

## 3. Environment variables (Production + Preview)

Add these in **Project → Settings → Environment Variables** (check **Production** and **Preview** as needed).

| Name | Notes |
|------|--------|
| `DATABASE_URL` | Neon **pooled** connection string (`-pooler` host), `?sslmode=require` |
| `DIRECT_DATABASE_URL` | Neon **direct** (non-pooler) host — required for `prisma migrate` |
| `AUTH_SECRET` | Long random string (`openssl rand -base64 32`) — **different** from local if you want |
| `NEXTAUTH_URL` | **Origin only** — `https://your-project.vercel.app` (no `/login`, no path after the host). Same rule for `AUTH_URL` if you set it. |
| `NEXT_PUBLIC_APP_URL` | Same as `NEXTAUTH_URL` |

**Preview deployments** (`*-git-*-*.vercel.app`): either add the same variables for the **Preview** environment in Vercel, or test login on your **Production** URL only. If `NEXTAUTH_URL` points at Production but you open a Preview URL, cookies and redirects can misbehave.

Wrong example (breaks `/api/auth/*` with 400): `NEXTAUTH_URL=https://....vercel.app/login`

Optional (only if you use AI on this deployment):

| Name | Notes |
|------|--------|
| `OLLAMA_HOST` | e.g. tunnel to your machine — usually **omit** if AI is local-only |

Do **not** commit `.env`; set everything in the Vercel UI.

## 4. Database migrations (once per schema change)

From your laptop, with **production** URLs in env (or a one-off copy of prod vars):

```bash
cd /path/to/lms
npx prisma migrate deploy
```

Run this **after** the first deploy (or before first traffic) so tables exist. Avoid running two `migrate deploy` jobs at the same time.

## 5. Seed / admin user (optional)

If you need a first admin in production:

```bash
DATABASE_URL="…" DIRECT_DATABASE_URL="…" npm run db:seed
```

Change passwords immediately after. Prefer creating users through your own secure flow for real classes.

## 6. Deploy

Trigger a deploy from the Vercel dashboard or by pushing to the connected branch.

## 7. After deploy

- Open `NEXTAUTH_URL` in the browser → **Login** → test student/admin flows.
- If login redirects look wrong, double-check **`NEXTAUTH_URL`** matches the URL in the address bar (including `https`).

## Limitations (same as before)

- **Assignment file uploads** use server disk; on Vercel the filesystem is ephemeral. Plan **object storage** (S3, R2, Vercel Blob) for serious production file submissions.
- **Ollama** does not run on Vercel; course generation stays on your local app + Neon (or however you sync data) unless you add a remote LLM.

## Local check before pushing

```bash
rm -rf .next && npm run build
```

If that passes, Vercel’s build is very likely to pass with the same env vars available.
