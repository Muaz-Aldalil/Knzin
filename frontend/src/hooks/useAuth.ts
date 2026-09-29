'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  authProvider: string;
  isVerified?: boolean;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync auth state from localStorage
  const syncAuth = useCallback(() => {
    if (typeof window === 'undefined') return;

    const savedToken = localStorage.getItem('knzin_auth_token');
    const savedUser = localStorage.getItem('knzin_user');

    setToken(savedToken);

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    syncAuth();

    const handleStorageChange = () => {
      syncAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncAuth]);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem('knzin_auth_token', newToken);
    localStorage.setItem('knzin_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    window.dispatchEvent(new Event('storage'));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('knzin_auth_token');
    localStorage.removeItem('knzin_user');
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event('storage'));
  }, []);

  return {
    token,
    user,
    isLoggedIn: !!token && !!user,
    isLoading,
    login,
    logout,
  };
}
