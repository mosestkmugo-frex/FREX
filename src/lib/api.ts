/**
 * Client-side API: calls Next.js API routes (which use Supabase server-side).
 * Auth is handled by Supabase via cookies; fetch sends cookies automatically.
 */

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'same-origin',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json();
}

export const bookingsApi = {
  list: () => api<BookingRow[]>('/api/bookings'),
  listAvailable: () => api<BookingRow[]>('/api/bookings?available=true'),
  get: (id: string) => api<BookingDetail>(`/api/bookings/${id}`),
  create: (body: CreateBookingBody) =>
    api<BookingDetail & { priceBreakdown?: unknown }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  accept: (id: string) =>
    api<BookingRow>(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'accept' }),
    }),
  updateStatus: (id: string, status: string) =>
    api<BookingRow>(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'status', status }),
    }),
};

export type BookingRow = {
  id: string;
  reference: string;
  status: string;
  totalAmountZar?: number | string;
  platformFeeZar?: number | string;
  driverEarningsZar?: number | string;
  pickupAddress?: { line1: string; city: string } | null;
  dropoffAddress?: { line1: string; city: string } | null;
  driver?: { id: string; email: string | null } | null;
};

export type BookingDetail = BookingRow & {
  pickupAddress?: { line1: string; city: string } | null;
  dropoffAddress?: { line1: string; city: string } | null;
  items?: unknown[];
};

export type CreateBookingBody = {
  pickup: { line1: string; line2?: string; city: string; country?: string };
  dropoff: { line1: string; line2?: string; city: string; country?: string };
  items: Array<{
    type: string;
    weightKg: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    declaredValueZar: number;
    description?: string;
    photos?: string[];
  }>;
  declaredValueZar: number;
  routeType?: 'urban' | 'intercity' | 'rural';
  preferredVehicleType?: string;
  scheduledAt?: string;
};
