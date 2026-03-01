-- Drop the trigger that creates profiles on signup.
-- Profile creation is now done by the app via POST /api/auth/profile (service role).
-- Run this in Supabase SQL Editor if you see "Database error saving new user" on signup.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
