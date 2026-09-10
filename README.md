# Homebrew

A multi-tenant recipe book for regional homebrew chapters. Save beers, let
original and final gravity compute ABV, override that figure when you have a
measured value, and share a recipe with another member of your chapter.

## What it does

- **Recipes** — name, style, batch size, original and final gravity, ABV, IBU, colour, notes
- **ABV from gravity** — `(OG − FG) × 131.25`, stored as a generated column. An override never hides the calculation
- **Chapters** — members are partitioned by region; the database enforces the boundary
- **Sharing** — search chapter members by name and share read-only, never across chapters
- **GDPR** — consent at signup, JSON export, account deletion, 12-month audit retention
- **Observability** — JSON logs, optional OpenTelemetry, `/api/health`

## Requirements

- Node.js 24 LTS
- Docker (for PostgreSQL 18.6)

## Getting started

```bash
cp .env.example .env
```

Replace every `change-me` value. Generate secrets with:

```bash
openssl rand -base64 32
```

```bash
docker compose up -d db && npm ci && npm run db:migrate && npm run db:seed
npm run dev
```

Open http://localhost:3000 and create an account. In development the verification
link is printed in the server log.

## Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply migrations, then RLS policies |
| `npm run db:seed` | Seed chapters and style ranges |
| `npm run db:prune` | Enforce the retention schedule |
| `npm run test:unit` | ABV and unit conversion |
| `npm run test:integration` | Tenant isolation and ABV SQL/TS parity |
| `npm run test:e2e` | Browser journey |
| `npm run audit:ci` | Fail on high/critical advisories |

## Kubernetes

```bash
kubectl apply -k deploy/k8s/overlays/dev    # 1 replica, no HPA, no patch CronJob
kubectl apply -k deploy/k8s/overlays/prod   # HPA 2–10, PDB, 3-instance Postgres
```

The auto-patch GitHub workflow is gated by the repository variable
`ENABLE_AUTO_PATCH` (default unset / off). Dependabot opens PRs only.

## GDPR

See `docs/gdpr/` for the ROPA, retention schedule, breach runbook and sub-processors.
