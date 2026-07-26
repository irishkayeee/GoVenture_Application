/**
 * AuthContext.tsx
 * Persists the logged-in user across the app (and across restarts, via
 * AsyncStorage) so client/admin screens can read the real user instead of
 * hardcoded stand-in data. Populated once on login success (see
 * LoginForm.tsx) and cleared on logout.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthUser = {
  id:        string;
  firstName: string;
  lastName:  string;
  fullName:  string;
  email:     string;
  role:      'admin' | 'client';
};

const STORAGE_KEY = 'goventure_auth_user';

type AuthContextValue = {
  user:      AuthUser | null;
  loading:   boolean;
  login:     (user: AuthUser) => Promise<void>;
  logout:    () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => { if (raw) setUser(JSON.parse(raw)); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (nextUser: AuthUser) => {
    setUser(nextUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
