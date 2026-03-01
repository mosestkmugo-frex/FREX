'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type User = {
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
  logout: () => Promise<void>;
}>(null!);

const AUTH_TIMEOUT_MS = 8000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const fallbackUser = (authUser: SupabaseUser): User => ({
    id: authUser.id,
    email: authUser.email ?? null,
    phone: authUser.phone ?? null,
    role: 'shipper',
    verificationStatus: 'pending',
    trustScore: 3,
  });

  const fetchProfile = async (authUser: SupabaseUser): Promise<User> => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Profile fetch timeout')), AUTH_TIMEOUT_MS)
    );
    try {
      const { data: profile } = await Promise.race([
        supabase
          .from('profiles')
          .select('id, email, phone, role, verification_status, trust_score')
          .eq('id', authUser.id)
          .maybeSingle(),
        timeoutPromise,
      ]);
      if (profile) {
        return {
          id: profile.id,
          email: profile.email ?? authUser.email ?? null,
          phone: profile.phone ?? null,
          role: profile.role ?? 'shipper',
          verificationStatus: profile.verification_status ?? 'pending',
          trustScore: profile.trust_score ?? 3,
        };
      }
    } catch {
      // Timeout or error – use fallback
    }
    // No profile yet – ensure one is created (e.g. after signup or if API failed)
    fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'shipper' }),
      credentials: 'same-origin',
    }).catch(() => {});
    return fallbackUser(authUser);
  };

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
    }, 8000);

    const init = async () => {
      try {
        const getUserPromise = supabase.auth.getUser();
        const getUserTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth init timeout')), AUTH_TIMEOUT_MS)
        );
        const { data: { user: authUser } } = await Promise.race([getUserPromise, getUserTimeout]);
        if (cancelled) return;
        if (!authUser) {
          setUser(null);
          setLoading(false);
          return;
        }
        const u = await fetchProfile(authUser);
        if (cancelled) return;
        setUser(u);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      try {
        const u = await fetchProfile(session.user);
        setUser(u);
      } catch {
        setUser(fallbackUser(session.user));
      }
    });
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
