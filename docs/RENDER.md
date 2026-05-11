# Deploy Studio LMS on Render (Docker + Neon)

Render runs your app as a **single Docker container** (same idea as `npm run build` + `node server.js` locally). Auth cookies and login behave like on your laptop, without Vercel serverless quirks.

**Database:** keep using **Neon** — only the app moves to Render.

---

## 1. Prerequisites

- Code on **GitHub** (Render pulls from there).
- Neon **`DATABASE_URL`** (pooled) and **`DIRECT_DATABASE_URL`** (direct) ready.
- A long **`AUTH_SECRET`** (e.g. `openssl rand -base64 32`).

---

## 2. Create the Web Service (recommended: UI)

1. Open [dashboard.render.com](https://dashboard.render.com) and sign in.
2. **New +** → **Web Service**.
3. **Connect** your GitHub account and select the **lms** repository.
4. Configure:
   - **Name:** pick something stable (e.g. `studio-lms`). Your app URL will be `https://<name>.onrender.com`.
   - **Region:** e.g. Oregon (default is fine).
   - **Branch:** `main` (or your default branch).
   - **Root directory:** leave empty (repo root).
   - **Runtime:** **Docker** (important — not “Node”).
   - **Dockerfile path:** `./Dockerfile` (default if the file is at the repo root).
   - **Instance type:** Free or Starter — free services **spin down** after idle; first request after sleep can take **30–60+ seconds**.

5. Click **Create Web Service** and let the first **build + deploy** finish. Fix any build errors from the **Logs** tab (Docker build output).

---

## 3. Environment variables

In the service → **Environment** → **Environment Variables**, add:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Neon **pooled** connection string (`sslmode=require` as Neon gives you). |
| `DIRECT_DATABASE_URL` | Neon **direct** (non-pooler) URL — same DB, for migrations. |
| `AUTH_SECRET` | Your long random secret. |
| `NEXTAUTH_URL` | `https://<exactly-your-service-name>.onrender.com` — **no path**, no trailing slash issue; must match the hostname users open in the browser. |
| `NEXT_PUBLIC_APP_URL` | Same value as `NEXTAUTH_URL`. |

Optional: leave **`VERCEL`** unset. Omit **`OLLAMA_*`** if you only generate courses on your computer.

**Tip:** Because the URL is `https://<name>.onrender.com` and `<name>` is what you typed in step 2, you can set `NEXTAUTH_URL` **before** the first successful deploy if you already fixed the service name.

After changing env vars, Render **redeploys** automatically (or use **Manual Deploy**).

---

## 4. Database migrations (from your laptop)

The Docker image does **not** need to run `prisma migrate` on every boot for normal operation. Apply schema once (or after new migrations) **against Neon**:

```bash
cd /path/to/lms
export DATABASE_URL="postgresql://…"
export DIRECT_DATABASE_URL="postgresql://…"
npx prisma migrate deploy
```

Optional first users:

```bash
npm run db:seed
```

---

## 5. Smoke test

1. Open `https://<your-service-name>.onrender.com`.
2. If the service was asleep, wait for it to wake up.
3. Go to **Sign in** and log in with a user that exists in **that Neon database**.

---

## 6. Optional: Blueprint (`render.yaml`)

This repo includes a minimal [`render.yaml`](../render.yaml). You can use **New… → Blueprint** and select the repo instead of creating the Web Service manually — then adjust **name / region / plan** in the dashboard if Render prompts you.

---

## 7. Limits to know

| Topic | Notes |
|--------|--------|
| **Cold starts** | Free tier sleeps; first hit is slow. Upgrade or accept delay. |
| **Uploads** | Container disk is **ephemeral** unless you add a **persistent disk** and mount it (advanced). Fine for light testing; use object storage for serious file homework. |
| **Custom domain** | Render → **Settings → Custom Domains** — then set `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` to the `https://` custom domain. |

---

## 8. If the build fails

- Confirm **Docker** is selected (not Node).
- Read the **Build** log: Prisma + `npm run build` run **inside** the Dockerfile; errors are usually missing env at **build** time only if you referenced them in `next.config` during build (this project does not require DB at build time).
- Out of memory: bump the instance type in Render.

For Render account/billing questions, use [Render docs](https://render.com/docs) or their support.
