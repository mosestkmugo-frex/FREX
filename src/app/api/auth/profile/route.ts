import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type UserRole = 'shipper' | 'driver' | 'logistics_company' | 'storage_provider';

/**
 * Creates or updates the profile for the currently signed-in user.
 * Uses the service role so it works even when the DB trigger fails.
 * Call this after signUp so the profile exists.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
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
