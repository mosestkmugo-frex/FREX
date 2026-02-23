'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingsApi } from '@/lib/api';

type Booking = {
  id: string;
  reference: string;
  status: string;
  driverEarningsZar: string | number;
  driverId: string | null;
  pickupAddress?: { line1: string; city: string };
  dropoffAddress?: { line1: string; city: string };
};

export default function AvailableJobsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    bookingsApi
      .listAvailable()
      .then((data) => setBookings(data as Booking[]))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const accept = async (id: string) => {
    setAccepting(id);
    try {
      await bookingsApi.accept(id);
      router.push('/dashboard/driver');
    } catch {
      setAccepting(null);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Available jobs</h1>
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No available jobs right now. Check back later.
        </p>
      ) : (
        <ul className="space-y-4">
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
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-frex-primary">
                  R {typeof b.driverEarningsZar === 'string' ? b.driverEarningsZar : Number(b.driverEarningsZar).toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => accept(b.id)}
                  disabled={!!accepting}
                  className="rounded-lg bg-frex-primary px-4 py-2 text-white hover:bg-frex-secondary disabled:opacity-50"
                >
                  {accepting === b.id ? 'Accepting…' : 'Accept'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
