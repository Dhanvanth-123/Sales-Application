# Parthasarathy CNC

CNC precision-components sales history & manufacturing intelligence platform.
("CALIPER" is the internal codename; `@caliper/*` is the package namespace.)

**All phases of the implementation plan are built (Phases 0–6).**

- **Phase 0 — Foundation** — monorepo, full DB schema, seed, self-managed JWT auth.
- **Phase 1 — Part history (R1, R5)** — parts/customers/sales/quotations/labour/operations,
  the aggregated **dossier**, filterable+paginated parts grid with URL-synced filters.
- **Phase 2 — Pricing & PVC (R2, R6)** — price changes (NEW/REVISION/PVC) written
  atomically with the audit row, master price list, cross-part change history.
- **Phase 3 — Cycle time & quality (R1, R4, R6)** — audited cycle-time revisions &
  quality records; FAI, pilot/production lots, FOPA register, PDCA board.
- **Phase 4 — Reporting & export (R3, R7)** — customer-/month-wise reports + dashboard
  KPIs/charts; CSV/XLSX/PDF export of every tabular view.
- **Phase 5 — Hardening (R6)** — filterable audit UI, per-IP/per-user rate limiting,
  **append-only `audit_log`** enforced by a DB trigger, admin user/role management.
- **Phase 6 — Files & notifications** — attachment upload/download via MinIO presigned
  URLs; transactional notifications (price changes, FAI failures) via SMTP/log.

## Stack

| Layer    | Tech                                                   |
| -------- | ------------------------------------------------------ |
| Web      | React 18 · Vite · TypeScript · TanStack Query · Zustand · Tailwind |
| API      | NestJS 11 · Prisma 6 · PostgreSQL 16                   |
| Shared   | Zod schemas + types (`packages/shared`)                |
| Auth     | Self-managed JWT (RS256 access + rotating refresh), Argon2id |
| Tooling  | pnpm workspaces · Turborepo · Docker Compose           |

## Layout

```
caliper/
├─ apps/
│  ├─ web/   # React + Vite SPA
│  └─ api/   # NestJS service (Prisma schema, audit scaffold, auth, health)
├─ packages/
│  └─ shared/  # Zod schemas + TS types shared by web & api
├─ docker-compose.yml
└─ turbo.json
```

## Quick start (local dev)

Prerequisites: Node ≥ 20, pnpm 11, Docker.

```bash
# 1. install
pnpm install

# 2. start infra (Postgres, Redis, MinIO)
docker compose up -d postgres redis minio

# 3. configure the API env + generate JWT keys
cp apps/api/.env.example apps/api/.env       # then set REFRESH_TOKEN_SECRET
pnpm --filter @caliper/api keys:gen          # writes apps/api/secrets/*.pem

# 4. build shared types, run migrations, seed, create the attachments bucket
pnpm --filter @caliper/shared build
pnpm --filter @caliper/api db:migrate        # tables + append-only audit trigger
pnpm --filter @caliper/api db:seed           # 6 parts, 3 customers, full history
node apps/api/scripts/ensure-bucket.mjs      # MinIO bucket for attachments

# 5. configure the web env
cp apps/web/.env.example apps/web/.env

# 6. run both apps
pnpm dev
```

- API → http://localhost:4100  (`GET /healthz`, `GET /readyz`)
- Web → http://localhost:5173

> Host ports are offset from the usual defaults (API 4100, Postgres 5433, Redis 6380,
> MinIO 9100/9101, Web 8081) so CALIPER can run alongside other local stacks. Adjust
> in `docker-compose.yml` + `apps/*/.env` if you prefer the standard ports.

### Demo logins (password `Caliper@123`)

| Email                   | Role    |
| ----------------------- | ------- |
| admin@caliper.local     | ADMIN   |
| sales@caliper.local     | SALES   |
| costing@caliper.local   | COSTING |
| quality@caliper.local   | QUALITY |
| viewer@caliper.local    | VIEWER  |

## What's implemented (Phase 0)

- **Monorepo** — pnpm workspaces + Turborepo; shared Zod/type contract.
- **Database** — full §5 schema (all entities, enums, indexes, append-only `audit_log`).
- **Seed** — representative parts with sales, quotations, price/cycle history,
  inspection, lots, quality, FOPA, PDCA.
- **Auth (Option A)** — `POST /auth/login`, `/auth/refresh` (rotating), `/auth/logout`,
  `GET /me`; RS256 access tokens, Argon2id hashing, global JWT + RBAC guards.
- **Audit scaffold (R6)** — request-context (AsyncLocalStorage), Prisma audit
  extension, and a read-only `GET /audit`. The same-transaction enforcement and
  append-only DB grant land in Phases 2–3 / 5 per the roadmap.
- **SPA** — login form (shared Zod schema), in-memory access token with transparent
  refresh, protected dashboard.
- **Ops** — Docker Compose (infra + full stack), Dockerfiles, GitHub Actions CI.

## What's implemented (Phase 1)

- **API** — `customers`, `parts` (list with filter/sort/pagination, create, patch,
  the `:id/dossier` aggregate, nested labour & operations), `sales`, `quotations`.
  Money/Date serialized to `number`/ISO; computed fields (sale value, labour cost/pc,
  lot PPM, price Δ%, win rate, summary KPIs).
- **SPA** — Parts grid with global filter bar (search/customer/status) **synced to the
  URL** (shareable, survives refresh — R5); tabbed part **dossier** (Overview, Sales,
  Cost & Labour, Operations, Quotations, Inspection & Lots, Cycle Time, Pricing,
  Quality & CI) with a date-range drill-down; role-gated create flows (new part, add
  sale/quotation/labour/operation). Pricing/cycle/quality sections are read-only here —
  their write flows land in Phases 2–3.

## Roadmap

Phases 2–6 (pricing/PVC + audit, cycle time & quality/CI, reports/export, RBAC + audit
UI, SSO/files/notifications) follow the implementation plan §13.

## Security notes

- Never commit `.env` or `secrets/` — both are gitignored. Commit only `.env.example`.
- `REFRESH_TOKEN_SECRET` must be a strong random value (≥ 16 chars; use 64-byte hex).
- The append-only `audit_log` DB grant (`apps/api/prisma/sql/audit_append_only.sql`)
  is applied in Phase 5 once a least-privilege app role exists.
