import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, setAuthToken, loadAuthToken } from '../lib/api';

type User = {
  id: string;
  email: string | null;
  phone: string | null;
  role: string;
  trustScore?: number;
};

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  logout: () => void;
}>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  useEffect(() => {
    loadAuthToken().then((t) => {
      if (!t) {
        setLoading(false);
        return;
      }
      authApi
        .me()
        .then((data) => setUser(data as User))
        .catch(() => {
          setAuthToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
