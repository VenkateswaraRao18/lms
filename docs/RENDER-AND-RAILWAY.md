# Deploy Studio LMS on Render or Railway (recommended if Vercel auth misbehaves)

These platforms run **one long-lived Node process** (or your **Docker** image). That matches how **Auth.js cookies** and **local file uploads** behave in development, and avoids Vercel serverless + Server Action cookie edge cases.

Keep **Neon** as the database (same `DATABASE_URL` / `DIRECT_DATABASE_URL` as today).

---

## Option A — Render (Docker)

**Step-by-step:** [RENDER.md](./RENDER.md) (service name → `NEXTAUTH_URL`, env table, migrations, cold starts).

Short version: **New Web Service** → **Docker** → connect repo → set env vars → deploy → `npx prisma migrate deploy` from your laptop against Neon.

---

## Option B — Railway (Docker)

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Select this repo. Railway will detect the **Dockerfile** if you leave defaults or choose **Docker** as the build.
3. **Variables** tab: add the same env vars as in the table above. Set `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` to your **Railway public URL** (e.g. `https://lms-production-xxxx.up.railway.app`).
4. **Settings → Networking → Generate domain** so HTTPS is active before you copy `NEXTAUTH_URL`.
5. Run `npx prisma migrate deploy` from your laptop against the same Neon URLs (or use a one-off Railway **Shell** with those vars).

---

## Why this often fixes “login works locally but not on Vercel”

- **Vercel:** many short-lived serverless invocations; cookies + Server Actions + redirects are easy to get out of sync.
- **Render / Railway (Docker):** one process, normal `Set-Cookie` + full page loads — same model as `npm run start` on your machine.

---

## Uploads

Docker disk is still **ephemeral** if you don’t attach a volume. For a few small assignment uploads it’s often fine; for production scale, add **object storage** (S3, R2, etc.) later.

---

## Cost / ops snapshot

| Platform | Notes |
|----------|--------|
| **Render** | Simple UI; free web services spin down when idle (cold start). |
| **Railway** | Generous trial; paid usage after; very quick GitHub deploys. |
| **Fly.io** | Another good Docker host; slightly more CLI-oriented. |

If you tell us which host you picked (Render vs Railway), we can align `NEXTAUTH_URL` examples to their exact domain pattern only (no code changes required).
