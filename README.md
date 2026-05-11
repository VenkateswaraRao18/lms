# Studio LMS

Production-minded, lightweight LMS for a solo educator or small studio (~200–500 learners). Built with **Next.js 15 (App Router)**, **TypeScript**, **PostgreSQL**, **Prisma**, **Auth.js**, **Tailwind CSS**, **shadcn/ui**, local **Ollama** for AI authoring, and **Docker** for the database.

## Features

- **Roles**: `ADMIN`, `STUDENT` with route separation and middleware protection.
- **Courses → modules → lessons** with VIDEO, NOTES, QUIZ (navigation), and ASSIGNMENT kinds.
- **Module quizzes**: MCQ + True/False, passing score, attempt limits, server-side grading.
- **Module locking**: the next module stays locked until the learner **passes** the current module’s quiz (enforced in `lib/access.ts` and quiz submission actions — not bypassable via URLs alone).
- **Assignments**: text + file uploads (local `uploads/` storage, typed MIME validation, download routes with auth checks).
- **Progress**: per-lesson completion records.
- **AI (Ollama)**: course **draft** generation (3–5 modules, 3–5 doc-style lessons per module, **5-question** end-of-module quizzes) and per-lesson summaries (`lib/ai/ollama.ts`, `lib/ai/prompts.ts`, `actions/ai-actions.ts`). You review and **publish** in the course editor; students only see **published** courses in their list.
- **UI**: dark navy palette (`app/globals.css`), sidebar shells, minimal dashboards.

## Prerequisites

- Node.js 20+
- Docker Desktop (or compatible engine) for PostgreSQL
- [Ollama](https://ollama.com/) installed locally when using AI features

## Quick start (local)

### 1. Clone and install

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

Default Compose maps Postgres to host port **5433** (avoids clashing with a local Postgres on 5432). Adjust `DATABASE_URL` if you change it.

### 3. Environment

Copy `.env.example` to `.env` and set at minimum:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `DIRECT_DATABASE_URL` | Same as `DATABASE_URL` locally; on Neon use the **direct** (non-pooler) URL so migrations work |
| `AUTH_SECRET` | Long random string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |

Ollama defaults:

| Variable | Default |
| --- | --- |
| `OLLAMA_HOST` | `http://localhost:11434` |
| `OLLAMA_MODEL_COURSE` | `gemma:7b` |
| `OLLAMA_MODEL_FAST` | `gemma:7b` |

Pull models you reference, for example:

```bash
ollama pull gemma:7b
```

### 4. Database schema

```bash
npx prisma migrate dev
npm run db:seed
```

Seed creates:

- **Admin**: `admin@local.test` / `admin123` (override with `SEED_ADMIN_PASSWORD`)
- **Student**: `student@local.test` / `student123`

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admins land on `/admin`, students on `/student`.

## Production database (hosted Postgres)

Use any managed Postgres (e.g. **Neon**, **Supabase**, **Railway**). Then apply the same migrations your repo already contains — **do not** use `db push` for prod if you rely on migration history.

1. Create a database and copy the connection string(s). For **Neon**, prefer the **direct** URI for `DIRECT_DATABASE_URL`; if Neon gives you a **pooled** URI for serverless, use pooled for `DATABASE_URL` and direct for `DIRECT_DATABASE_URL`.
2. Set `DATABASE_URL`, `DIRECT_DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_APP_URL` to your **production** URLs.
3. From your machine or CI (with env vars loaded):

```bash
npm run db:migrate:deploy
```

4. Optionally seed **once** (change passwords immediately afterward):

```bash
npm run db:seed
```

For **Vercel**, run `db:migrate:deploy` in CI before or after deploy, or as a one-off local command pointed at production — avoid multiple concurrent migrate runs.

## Project layout

| Path | Purpose |
| --- | --- |
| `app/` | Routes (marketing, login, admin, student, API) |
| `actions/` | Server actions (courses, quizzes, AI, uploads, …) |
| `components/` | UI including shadcn primitives |
| `lib/` | Prisma client, access control, AI helpers, uploads |
| `prisma/` | Schema & migrations |
| `uploads/` | Local file storage (gitignored contents) |
| `types/` | Auth.js module augmentation |
| `utils/` | Small helpers (e.g. slugify) |

## Docker image (app)

The included `Dockerfile` builds a **standalone** Next.js image. Run Postgres via `docker-compose.yml`, apply migrations against your production `DATABASE_URL`, then run the app container. Ensure `AUTH_SECRET` and uploaded files volume are set for real deployments.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Next.js dev (Turbopack) |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start production server |
| `npm run db:migrate` | Prisma migrate dev (local) |
| `npm run db:migrate:deploy` | Apply migrations to production / CI |
| `npm run db:seed` | Seed admin/student users |
| `npm run db:studio` | Prisma Studio |

## Security notes

- Quiz access and lesson access are checked server-side before rendering sensitive UI or accepting submissions.
- Assignment and lesson attachment downloads go through authenticated API routes that validate role and ownership.
- Change all seed passwords before exposing the stack beyond localhost.

## License

Private / your deployment — adjust as needed.
