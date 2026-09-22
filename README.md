# Skinergy

A burn monitoring platform: patient/burn-case management, AI-assisted scan
classification, device connection flow, and a chat assistant, for both
personal and healthcare use.

## First-time setup

Environment files (`.env`) and the local database (`prisma/dev.db`) are not
committed to git — you need to create them on any machine you run this on.

```bash
npm install

# 1. Create your local env file
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

## Deploying beyond your own machine

SQLite (`prisma/dev.db`) is a local file — it works for local development but
not for serverless hosts (e.g. Vercel), which don't have persistent disk. To
deploy, switch `prisma/schema.prisma`'s datasource to a hosted Postgres
database (Supabase, Neon, Railway, etc.), update `DATABASE_URL` in your host's
environment variables, then run `npx prisma db push` against it once.
