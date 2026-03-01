'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

const SERVICES = [
  {
    title: 'On-demand freight',
    description: 'Book loads instantly. Connect with verified drivers for urban, intercity, and rural deliveries.',
    icon: '🚚',
  },
  {
    title: 'Driver network',
    description: 'Accept jobs, track earnings, and grow your business. Flexible schedules for independent drivers.',
    icon: '👤',
  },
  {
    title: 'Logistics management',
    description: 'Manage your fleet, assign drivers, and track deliveries from a single dashboard.',
    icon: '📦',
  },
  {
    title: 'Storage & warehousing',
    description: 'List space or find storage. Connect shippers with storage providers across the region.',
    icon: '🏭',
  },
];

const STATS = [
  { value: '—', label: 'Active drivers' },
  { value: '—', label: 'Deliveries completed' },
  { value: '—', label: 'Shippers served' },
  { value: '—', label: 'Loads this month' },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
          : '/dashboard';
    router.replace(dashboard);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-frex-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-frex-primary">
            FREX
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-slate-600 hover:text-frex-primary">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-frex-primary px-4 py-2 text-white hover:bg-frex-secondary"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200 bg-white px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            On-demand freight,{' '}
            <span className="text-frex-primary">all in one platform</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Connect with drivers, logistics companies, and storage providers. Book loads, track deliveries, and scale your business.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-frex-primary px-6 py-3 font-medium text-white hover:bg-frex-secondary"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Stats placeholder */}
      <section className="border-b border-slate-200 bg-slate-100/50 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-frex-primary sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Services we offer
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            Whether you need to ship, drive, manage a fleet, or offer storage – FREX connects you with the right partners.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-frex-primary/30 hover:shadow-md"
              >
                <div className="text-3xl">{service.icon}</div>
                <h3 className="mt-4 font-semibold text-slate-900">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 bg-frex-primary px-4 py-16 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-teal-100">
            Create an account and start shipping or driving today.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-medium text-frex-primary hover:bg-slate-100"
          >
            Sign up free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-slate-500">
          © {new Date().getFullYear()} FREX. Freight & logistics platform.
        </div>
      </footer>
    </div>
  );
}
