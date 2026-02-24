'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { bookingsApi, type BookingRow } from '@/lib/api';

export default function ShipperDashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi
      .list()
      .then((data) => setBookings(data.filter((b) => b.reference)))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);


  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Shipper dashboard</h1>
      <div className="mb-6 flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm text-slate-500">Trust score</p>
          <p className="text-2xl font-semibold text-frex-primary">{user?.trustScore?.toFixed(1) ?? '—'}</p>
        </div>
        <Link
          href="/dashboard/shipper/book"
          className="ml-auto rounded-lg bg-frex-primary px-6 py-3 text-white hover:bg-frex-secondary"
        >
          Book load
        </Link>
      </div>
      <section>
        <h2 className="mb-4 text-lg font-semibold">Your deliveries</h2>
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : bookings.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
            No bookings yet. Book your first load to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium">{b.reference}</p>
                  <p className="text-sm text-slate-500">
                    {b.pickupAddress?.line1}, {b.pickupAddress?.city} → {b.dropoffAddress?.line1},{' '}
                    {b.dropoffAddress?.city}
                  </p>
                  <p className="mt-1 text-sm">
                    Status: <span className="font-medium">{b.status}</span>
                    {b.driver && ` · Driver: ${b.driver.email || 'Assigned'}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-frex-primary">
                    {b.totalAmountZar == null ? '—' : `R ${typeof b.totalAmountZar === 'string' ? Number(b.totalAmountZar).toFixed(2) : b.totalAmountZar.toFixed(2)}`}
                  </span>
                  <Link
                    href={`/dashboard/shipper/tracking?id=${b.id}`}
                    className="text-sm text-frex-primary hover:underline"
                  >
                    Track
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
