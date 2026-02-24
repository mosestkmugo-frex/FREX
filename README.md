# FREX – On-Demand Freight & Logistics Platform

FREX connects shippers with drivers, logistics companies, and storage providers. Built for South Africa (ZAR) with international scalability.

**Stack:** Next.js 14, TypeScript, Supabase (Auth + Postgres + Realtime), Tailwind CSS. Single app (no separate API or mobile projects).

## Project structure

| Path | Purpose |
|------|--------|
| `src/` | Next.js app (pages, API routes, components) |
| `src/app/api/` | API routes (bookings, auth via Supabase) |
| `src/lib/supabase/` | Supabase client (browser, server, middleware) |
| `packages/shared` | Shared types, constants, pricing (ZAR) |
| `supabase/migrations/` | Database schema and RLS |

## Quick start

1. **Create a Supabase project** at [supabase.com](https://supabase.com). Get your project URL and anon key.

2. **Env:**
   ```bash
   cp .env.example .env.local
   # Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **Database:** In the Supabase SQL Editor, run the migration:
   - Open **SQL Editor** → New query → paste contents of `supabase/migrations/20250224000001_initial_schema.sql` → Run.
   - If the trigger `on_auth_user_created` fails (permissions), create the profile from your app on first sign-in or add a small API route that upserts `profiles` using the service role key.

4. **Auth:** In Supabase Dashboard → Authentication → Providers, enable Email. (Optional: disable “Confirm email” for faster local testing.)

5. **Install and run:**
   ```bash
   pnpm install
   pnpm dev
   ```
   App: [http://localhost:3000](http://localhost:3000).

## Env variables

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon (public) key  
- `SUPABASE_SERVICE_ROLE_KEY` – (Optional) For admin/server-only actions  

## Features (MVP)

- Auth (Supabase): sign up / sign in, roles (shipper, driver, logistics, storage)
- Profiles and verification status
- Booking flow: create (with pricing), list, accept (driver), status updates
- Tracking view
- Shared pricing and ZAR constants in `packages/shared`

## Tech notes

- **Auth:** Supabase Auth with email/password. A trigger creates a row in `public.profiles` on signup with `role` from metadata.
- **Data:** All tables use RLS. Web app uses the Supabase client (cookies) and Next.js API routes for server-side logic (e.g. pricing, booking create).
- **Real-time:** Can be added via Supabase Realtime on `bookings` or `tracking_events` for live tracking.
