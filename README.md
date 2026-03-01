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

3. **Database:** In the Supabase SQL Editor, run the migrations (in order):
   - Run `supabase/migrations/20250224000001_initial_schema.sql`.
   - Then run `supabase/migrations/20250224000002_drop_auth_trigger.sql` so signup is not blocked by the DB trigger (profiles are created by the app via the service role instead).

4. **Env:** Set `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard → Settings → API) in `.env.local` and in Vercel. Required for new user signup (profile creation).

5. **Auth:** In Supabase Dashboard → Authentication → Providers, enable Email. (Turn off Confirm email so “Confirm email” users can sign in immediately after sign up.)

6. **Install and run:**
   ```bash
   pnpm install
   pnpm dev
   ```
   App: [http://localhost:3000](http://localhost:3000).

## Env variables

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon (public) key  
- `SUPABASE_SERVICE_ROLE_KEY` – **Required for signup.** Used by `/api/auth/profile` to create the user profile.  

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
