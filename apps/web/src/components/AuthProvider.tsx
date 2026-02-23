'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, getToken } from '@/lib/api';

type User = {
  id: string;
  email: string | null;
  phone: string | null;
  role: string;
  verificationStatus: string;
  trustScore: number;
};

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  setToken: (t: string | null) => void;
  logout: () => void;
}>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = (token: string | null) => {
    if (typeof window === 'undefined') return;
    if (token) localStorage.setItem('frex_token', token);
    else localStorage.removeItem('frex_token');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((data: unknown) => setUser(data as User))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
