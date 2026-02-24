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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const fetchProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, phone, role, verification_status, trust_score')
      .eq('id', authUser.id)
      .single();
    if (!profile) return null;
    return {
      id: profile.id,
      email: profile.email ?? authUser.email ?? null,
      phone: profile.phone ?? null,
      role: profile.role ?? 'shipper',
      verificationStatus: profile.verification_status ?? 'pending',
      trustScore: profile.trust_score ?? 3,
    };
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      const u = await fetchProfile(authUser);
      setUser(u);
      setLoading(false);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      const u = await fetchProfile(session.user);
      setUser(u);
    });
    return () => subscription.unsubscribe();
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
