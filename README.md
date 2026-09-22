# Skinergy

A burn monitoring platform: patient/burn-case management, AI-assisted scan
classification, device connection flow, and a chat assistant, for both
personal and healthcare use.

## First-time setup

Environment files (`.env`) and the local database (`prisma/dev.db`) are not
committed to git — you need to create them on any machine you run this on.

```bash
npm install

# 1. Create your local env file, then fill in DATABASE_URL with a real
#    Postgres connection string (see "Deploying" below for how to get one —
#    the same database works for both local dev and Vercel)
cp .env.example .env

# 2. Create the database tables
npx prisma db push

# 3. Seed demo data (patients, cases, scans, staff accounts)
npm run db:seed

# 4. Run the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo logins (password
`password123` for all): `ahmed@skinergy.health` (patient),
`dr.laila@skinergy.health` (doctor), `nurse.omar@skinergy.health` (nurse).

If login fails with no error, it's almost always because step 2 or 3 above
was skipped — there's no database yet, so there are no users to log in as.

## AI burn classification service (optional)

Real photo classification uses a local Python inference service. Without it
running, scans still work — they fall back to a simulated classification.

```bash
python -m venv inference/.venv
inference/.venv/Scripts/pip install -r inference/requirements.txt
npm run inference
```

See `inference/README.md` for details and known assumptions about the model.

## Deploying (e.g. to Vercel)

The database is Postgres (not SQLite — Vercel has no persistent disk for a
local file to live on). You need one hosted Postgres database, shared between
your local `.env` and your Vercel project:

1. Create a free Postgres database — [Supabase](https://supabase.com) is a
   good option. Copy its connection string (Supabase: Project Settings →
   Database → Connection string → **URI**, "Transaction" pooling mode).
2. Put that connection string in this project's `.env` as `DATABASE_URL`,
   then run once from your machine:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
   This creates the tables and demo accounts in the hosted database.
3. In your Vercel project → Settings → Environment Variables, add:
   - `DATABASE_URL` — the same connection string from step 1
   - `AUTH_SECRET` — a real random secret (`openssl rand -base64 32`), not the
     placeholder value
   - `NEXTAUTH_URL` — your Vercel deployment URL, e.g.
     `https://your-app.vercel.app`
4. Redeploy. `npm run build` runs `prisma generate` automatically first, so
   the Prisma Client matches Postgres on Vercel's build machine.

If login silently fails after deploying, it's almost always a missing/wrong
environment variable in step 3, or step 2 was skipped so the tables/users
don't exist yet in the hosted database.
