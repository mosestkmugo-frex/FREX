'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { bookingsApi, type BookingDetail } from '@/lib/api';

export default function TrackingPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    bookingsApi
      .get(id)
      .then((data) => setBooking(data))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
        Select a booking from your dashboard to track it.
      </div>
    );
  }
  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (!booking) return <p className="text-red-600">Booking not found.</p>;

  const steps = ['booked', 'driver_en_route', 'pickup', 'in_transit', 'delivery', 'completed'];
  const currentIndex = steps.indexOf(booking.status);
  const pickup = booking.pickupAddress ?? null;
  const dropoff = booking.dropoffAddress ?? null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Track delivery</h1>
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold">{booking.reference}</p>
        <p className="text-slate-500">
          {pickup?.line1}, {pickup?.city} to {dropoff?.line1}, {dropoff?.city}
        </p>
        {booking.driver && (
          <p className="mt-2 text-sm">Driver: {booking.driver.email || 'Assigned'}</p>
        )}
        <div className="mt-6 flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center">
              <div
                className={'h-3 w-3 rounded-full ' + (i <= currentIndex ? 'bg-frex-primary' : 'bg-slate-200')}
              />
              <span className="ml-1 text-xs capitalize">{step.replace('_', ' ')}</span>
              {i < steps.length - 1 && <span className="mx-2 text-slate-300">-</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
