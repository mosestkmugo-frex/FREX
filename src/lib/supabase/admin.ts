import { createClient } from '@supabase/supabase-js';

/** Server-only Supabase client with service role (bypasses RLS). Use in API routes for admin actions. */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey);
}
