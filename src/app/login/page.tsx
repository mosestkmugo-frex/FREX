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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw new Error(signInError.message);
      if (!data.user) throw new Error('No user returned');

      // Set user immediately so we can redirect; AuthProvider will sync profile from session
      setUser({
        id: data.user.id,
        email: data.user.email ?? null,
        phone: data.user.phone ?? null,
        role: 'shipper',
        verificationStatus: 'pending',
        trustScore: 3,
      });

      // Fetch profile in background (don't block redirect); update if we get it in time
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

      const dash = '/dashboard';
      router.push(dash);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
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
