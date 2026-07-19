# Buketboxd

The social diary for everything you read — essays, newsletters, papers, and long-form writing.

Inspired by Letterboxd. Built with Next.js, Supabase, Prisma, Tailwind, and shadcn/ui.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui + Framer Motion + Lucide
- **Supabase** — Auth (email + Google), Postgres, Storage, RLS
- **Prisma** — schema source of truth (optional direct queries via `DATABASE_URL`)
- **TanStack Query** — client data fetching
- **Vercel** — deploy target

## Getting started

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase setup

1. Project is provisioned as **buketboxd** (schema + RLS already applied).
2. Auth → enable **Email** and **Google** providers.
3. Auth → URL config: Site URL `http://localhost:3000`, redirect `http://localhost:3000/auth/callback`.
4. Storage buckets: `avatars`, `covers` (public read).
5. Optional Prisma: copy the Database connection strings into `DATABASE_URL` / `DIRECT_URL`, then:

```bash
npx prisma generate
npx prisma db pull   # optional sync from remote
```

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Local development        |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run lint` | ESLint                   |

## MVP routes

| Route              | Purpose                |
| ------------------ | ---------------------- |
| `/`                | Marketing homepage     |
| `/login` `/signup` | Auth                   |
| `/onboarding`      | Username setup         |
| `/home`            | Activity feed          |
| `/log/new`         | Log a read (&lt;30s)   |
| `/article/[slug]`  | Article + reviews      |
| `/u/[username]`    | Public profile         |
| `/discover`        | Discovery shelves      |
| `/search`          | Global search          |
| `/settings`        | Edit profile           |

## Architecture notes

- Mutations use **Server Actions** under `src/server/actions`.
- Reads use the **Supabase SSR client** so RLS applies with the user JWT.
- Prisma schema lives in `prisma/schema.prisma` and mirrors the remote DB.
- Activity feed is powered by the `activities` table + follow graph.

## Deploy (Vercel)

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
4. Add the production URL to Supabase Auth redirect allow-list.
