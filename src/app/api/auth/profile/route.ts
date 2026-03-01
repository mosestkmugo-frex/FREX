import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

type UserRole = 'shipper' | 'driver' | 'logistics_company' | 'storage_provider';

/**
 * Creates or updates the profile for the signed-in user.
 * Accepts either session cookies or Authorization: Bearer <access_token> (for right-after signUp when cookies aren't set yet).
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let authUser: { id: string; email?: string | null; phone?: string | null } | null = null;

  if (accessToken) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    authUser = user;
  }
  if (!authUser) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    authUser = user;
  }
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' },
      { status: 500 }
    );
  }

  let body: { role?: string; fullName?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is ok; we'll use defaults
  }
  const role = (body.role as UserRole) || 'shipper';
  const fullName = body.fullName || '';

  const admin = createAdminClient();
  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: authUser.id,
      email: authUser.email ?? null,
      phone: authUser.phone ?? null,
      role,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    console.error('Profile upsert error:', profileError);
    return NextResponse.json(
      { error: 'Database error saving new user', details: profileError.message },
      { status: 500 }
    );
  }

  if (role === 'driver' && fullName) {
    await admin.from('driver_profiles').upsert(
      { user_id: authUser.id, full_name: fullName },
      { onConflict: 'user_id' }
    );
  }

  return NextResponse.json({ ok: true });
}
