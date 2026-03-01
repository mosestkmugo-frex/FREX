'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }
  if (!user) {
    router.replace('/login');
    return null;
  }

  const base = '/dashboard';
  const nav =
    user.role === 'shipper'
      ? [
          { href: `${base}/shipper`, label: 'Dashboard' },
          { href: `${base}/shipper/book`, label: 'Book load' },
          { href: `${base}/shipper/tracking`, label: 'Track' },
        ]
      : user.role === 'driver'
        ? [
            { href: `${base}/driver`, label: 'Dashboard' },
            { href: `${base}/driver/jobs`, label: 'Available jobs' },
          ]
        : [{ href: base, label: 'Dashboard' }];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href={base} className="text-lg font-bold text-frex-primary">
            FREX
          </Link>
          <nav className="flex items-center gap-6">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={
                  pathname === href
                    ? 'font-medium text-frex-primary'
                    : 'text-slate-600 hover:text-frex-primary'
                }
              >
                {label}
              </Link>
            ))}
            <span className="text-sm text-slate-500">{user.email || user.phone}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
