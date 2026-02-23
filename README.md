# FREX – On-Demand Freight & Logistics Platform

FREX connects shippers with drivers, logistics companies, and storage providers. Built for South Africa (ZAR) with international scalability.

## Repo structure

| Path | Stack | Purpose |
|------|--------|---------|
| `apps/api` | Node.js, Express, TypeScript, Prisma | REST API, auth, bookings, payments, tracking |
| `apps/web` | Next.js 14, TypeScript, Tailwind | Shipper / Driver / Logistics / Storage / Admin dashboards |
| `apps/mobile` | React Native (Expo), TypeScript | iOS & Android apps |
| `packages/shared` | TypeScript | Shared types, constants, i18n, ZAR/currency |
| `packages/database` | Prisma | Schema, migrations, client |

## Phase 1 MVP (current)

- [x] Monorepo + shared types
- [x] Auth (email/phone OTP, JWT, roles: shipper, driver, logistics, storage)
- [x] User profiles and verification status
- [x] Booking flow (create, match, accept, pickup, delivery)
- [x] Basic payment/escrow flow
- [x] Real-time tracking (WebSocket)
- [x] Two-way ratings

## Quick start

```bash
# Install
pnpm install

# Env (copy and fill)
cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env
# Set DATABASE_URL in both to your PostgreSQL URL.

# DB
pnpm db:generate
pnpm db:migrate

# Run API + Web
pnpm dev
# Or separately:
pnpm dev:api    # http://localhost:4000
pnpm dev:web    # http://localhost:3000
pnpm dev:mobile # Expo (add apps/mobile/assets/icon.png and splash.png for Expo)
```

## Env (API)

- `DATABASE_URL` – PostgreSQL connection string
- `REDIS_URL` – Redis (optional for MVP)
- `JWT_SECRET` – Auth signing secret
- `PORT` – default 4000

## Tech alignment with spec

- **Currency**: ZAR base; multi-currency in `packages/shared`.
- **Roles**: Shipper, Driver, Logistics Company, Storage Provider.
- **Pricing**: Base R14–24/km, load classes, add-ons (stairs, white-glove, etc.) in shared constants and API.
- **Trust score, subscriptions, insurance, ads**: Backend types and routes stubbed; full implementation in Phase 2–4.
