import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const API_PREFIX = '/api';
const TOKEN_KEY = 'frex_token';

let token: string | null = null;

export async function setAuthToken(t: string | null) {
  token = t;
  if (t) await AsyncStorage.setItem(TOKEN_KEY, t);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function loadAuthToken() {
  if (token) return token;
  token = await AsyncStorage.getItem(TOKEN_KEY);
  return token;
}

export function getAuthToken() {
  return token;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: 'Bearer ' + token }),
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json();
}

export const authApi = {
  login: (body: { email?: string; phone?: string; password: string }) =>
    api<{ token: string; user: { id: string; role: string; email: string | null; phone: string | null } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(body) }
    ),
  register: (body: { email?: string; phone?: string; password: string; role: string; fullName?: string }) =>
    api<{ token: string; user: { id: string; role: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  me: () => api<{ id: string; role: string; email: string | null; phone: string | null; trustScore: number }>('/auth/me'),
};

export const bookingsApi = {
  list: () => api<unknown[]>('/bookings'),
  listAvailable: () => api<unknown[]>('/bookings/available'),
  get: (id: string) => api<unknown>(`/bookings/${id}`),
  create: (body: unknown) => api<unknown>('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  accept: (id: string) => api<unknown>(`/bookings/${id}/accept`, { method: 'PATCH' }),
};
