'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { authApi } from '@/lib/api';

const ROLES = [
  { value: 'shipper', label: 'Shipper', desc: 'Book loads, track deliveries' },
  { value: 'driver', label: 'Driver', desc: 'Accept jobs, earn money' },
  { value: 'logistics_company', label: 'Logistics Company', desc: 'Manage fleet & drivers' },
  { value: 'storage_provider', label: 'Storage Provider', desc: 'List space, manage inventory' },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('shipper');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters with numbers and special characters');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await authApi.register({
        email: email || undefined,
        password,
        role,
        fullName: role === 'driver' ? fullName : undefined,
      });
      setToken(token);
      setUser(user as Parameters<typeof setUser>[0]);
      const dash =
        role === 'shipper'
          ? '/dashboard/shipper'
          : role === 'driver'
            ? '/dashboard/driver'
            : '/dashboard';
      router.push(dash);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <Link href="/" className="mb-8 text-center text-xl font-bold text-frex-primary">
        FREX
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Create account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Role</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`rounded-lg border p-3 text-left text-sm ${
                  role === r.value
                    ? 'border-frex-primary bg-teal-50 text-frex-primary'
                    : 'border-slate-200'
                }`}
              >
                <span className="font-medium">{r.label}</span>
                <span className="mt-1 block text-xs text-slate-500">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>
        {role === 'driver' && (
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-3"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-3"
        />
        <input
          type="password"
          placeholder="Password (min 8 chars, numbers & symbols)"
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
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="text-frex-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
