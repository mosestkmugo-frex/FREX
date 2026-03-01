'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-frex-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    const dashboard =
      user.role === 'shipper'
        ? '/dashboard/shipper'
        : user.role === 'driver'
          ? '/dashboard/driver'
          : user.role === 'logistics_company'
            ? '/dashboard/logistics'
            : user.role === 'storage_provider'
              ? '/dashboard/storage'
              : '/dashboard';
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-2xl font-bold text-frex-primary">FREX</h1>
        <p className="text-sm text-slate-400">v{process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0'}</p>
        <p className="text-slate-600">Signed in as {user.email || user.phone}</p>
        <Link
          href={dashboard}
          className="rounded-lg bg-frex-primary px-6 py-3 text-white hover:bg-frex-secondary"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-3xl font-bold text-frex-primary">FREX</h1>
      <p className="text-sm text-slate-400">v{process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0'}</p>
      <p className="max-w-md text-center text-slate-600">
        On-demand freight. Connect with drivers, logistics companies, and storage – all in one platform.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg border border-frex-primary px-6 py-3 text-frex-primary hover:bg-teal-50"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-frex-primary px-6 py-3 text-white hover:bg-frex-secondary"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
