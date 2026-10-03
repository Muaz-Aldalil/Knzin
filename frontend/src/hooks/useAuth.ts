'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string | null;
  display_name?: string | null;
  authProvider?: string;
  auth_provider?: string;
  isVerified?: boolean;
  is_verified?: boolean;
}

export interface SendOtpResult {
  message: string;
  email: string;
  expires_in_seconds: number;
  dev_code?: string | null;
}

export interface VerifyOtpResult {
  token: string;
  user: AuthUser;
  merge_stats?: {
    merged_orders_count: number;
    deactivated_guests_count: number;
  };
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

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem('knzin_auth_token')) {
        await apiClient('/auth/logout', { method: 'POST' });
      }
    } catch {
      // Ignore network errors on logout to ensure local state is always cleared
    } finally {
      localStorage.removeItem('knzin_auth_token');
      localStorage.removeItem('knzin_user');
      setToken(null);
      setUser(null);
      window.dispatchEvent(new Event('storage'));
    }
  }, []);

  const sendOtp = useCallback(async (email: string): Promise<SendOtpResult> => {
    const res = await apiClient<SendOtpResult>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    return res;
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string): Promise<VerifyOtpResult> => {
    const res = await apiClient<VerifyOtpResult>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      }),
    });

    if (res.token && res.user) {
      login(res.token, res.user);
    }

    return res;
  }, [login]);

  return {
    token,
    user,
    isLoggedIn: !!token && !!user,
    isLoading,
    login,
    logout,
    sendOtp,
    verifyOtp,
  };
}
