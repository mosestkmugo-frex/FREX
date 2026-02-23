const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_PREFIX = '/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('frex_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const authApi = {
  login: (body: { email?: string; phone?: string; password: string }) =>
    api<{ token: string; user: unknown }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: {
    email?: string;
    phone?: string;
    password: string;
    role: string;
    fullName?: string;
  }) =>
    api<{ token: string; user: unknown }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api<unknown>('/auth/me'),
};

export const bookingsApi = {
  list: () => api<unknown[]>('/bookings'),
  listAvailable: () => api<unknown[]>('/bookings/available'),
  get: (id: string) => api<unknown>(`/bookings/${id}`),
  create: (body: unknown) => api<unknown>('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  accept: (id: string) => api<unknown>(`/bookings/${id}/accept`, { method: 'PATCH' }),
  updateStatus: (id: string, status: string) =>
    api<unknown>(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
