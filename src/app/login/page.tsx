'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const roleFromAuthMetadata = (authUser: { user_metadata?: { role?: unknown } | null }) => {
    const role = authUser.user_metadata?.role;
    return role === 'shipper' || role === 'driver' || role === 'logistics_company' || role === 'storage_provider'
      ? role
      : 'shipper';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key || url.includes('placeholder')) {
      setError('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (local) or Vercel → Project → Settings → Environment Variables (deploy), then redeploy.');
      return;
    }
    setLoading(true);
    let cancelled = false;
    const AUTH_TIMEOUT_MS = 25000;
    const timeoutId = setTimeout(() => {
      cancelled = true;
      setLoading(false);
      setError('Sign-in is taking too long. Check your connection and try again.');
    }, AUTH_TIMEOUT_MS);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Sign-in is taking too long. Check your connection and try again.')), AUTH_TIMEOUT_MS)
    );
    try {
      const { data, error: signInError } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeoutPromise,
      ]);
      if (cancelled) return;
      clearTimeout(timeoutId);
      if (signInError) throw new Error(signInError.message);
      if (!data.user) throw new Error('No user returned');

      setUser({
        id: data.user.id,
        email: data.user.email ?? null,
        phone: data.user.phone ?? null,
        role: roleFromAuthMetadata(data.user),
        verificationStatus: 'pending',
        trustScore: 3,
      });

      void Promise.resolve(
        supabase
          .from('profiles')
          .select('id, email, phone, role, verification_status, trust_score')
          .eq('id', data.user.id)
          .maybeSingle()
      ).then(({ data: profile }) => {
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email ?? data.user?.email ?? null,
            phone: profile.phone ?? null,
            role: profile.role ?? 'shipper',
            verificationStatus: profile.verification_status ?? 'pending',
            trustScore: profile.trust_score ?? 3,
          });
        }
      }).catch(() => {});

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    } finally {
      if (!cancelled) clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <Link href="/" className="mb-8 text-center text-xl font-bold text-frex-primary">
        FREX
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-3"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-3"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-frex-primary py-3 text-white disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link href="/register" className="text-frex-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
