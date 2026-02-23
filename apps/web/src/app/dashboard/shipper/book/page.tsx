'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingsApi } from '@/lib/api';

export default function BookLoadPage() {
  const router = useRouter();
  const [pickup, setPickup] = useState({ line1: '', city: '', country: 'ZA' });
  const [dropoff, setDropoff] = useState({ line1: '', city: '', country: 'ZA' });
  const [declaredValue, setDeclaredValue] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const booking = await bookingsApi.create({
        pickup,
        dropoff,
        items: [
          {
            type: 'general',
            weightKg: 50,
            lengthCm: 100,
            widthCm: 80,
            heightCm: 60,
            declaredValueZar: declaredValue,
          },
        ],
        declaredValueZar: declaredValue,
        routeType: 'urban',
      });
      router.push('/dashboard/shipper?created=' + (booking as { id: string }).id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Book a load</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-6 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <label className="mb-2 block font-medium">Pickup address</label>
          <input
            type="text"
            placeholder="Street address"
            value={pickup.line1}
            onChange={(e) => setPickup((p) => ({ ...p, line1: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-4 py-2"
            required
          />
          <input
            type="text"
            placeholder="City"
            value={pickup.city}
            onChange={(e) => setPickup((p) => ({ ...p, city: e.target.value }))}
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2"
            required
          />
        </div>
        <div>
          <label className="mb-2 block font-medium">Delivery address</label>
          <input
            type="text"
            placeholder="Street address"
            value={dropoff.line1}
            onChange={(e) => setDropoff((d) => ({ ...d, line1: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-4 py-2"
            required
          />
          <input
            type="text"
            placeholder="City"
            value={dropoff.city}
            onChange={(e) => setDropoff((d) => ({ ...d, city: e.target.value }))}
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2"
            required
          />
        </div>
        <div>
          <label className="mb-2 block font-medium">Declared value (ZAR)</label>
          <input
            type="number"
            min={0}
            value={declaredValue}
            onChange={(e) => setDeclaredValue(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-4 py-2"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-frex-primary py-3 text-white disabled:opacity-50"
        >
          {loading ? 'Creating booking...' : 'Get quote and book'}
        </button>
      </form>
    </div>
  );
}
