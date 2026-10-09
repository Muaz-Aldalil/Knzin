'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { ApiError, getApiBaseUrl } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

interface GoogleIdentityButtonProps {
  className?: string;
  redirectUrl?: string;
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
  mockEmail?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: string;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
              locale?: string;
            }
          ) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
        };
      };
    };
  }
}

const DEFAULT_CLIENT_ID = '118096304294-3vikmbr2diolhadj2q6lbo4647umueav.apps.googleusercontent.com';

export default function GoogleIdentityButton({
  className = '',
  redirectUrl,
  onSuccess,
  onError,
  mockEmail,
}: GoogleIdentityButtonProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { verifyGoogleCredential } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      if (!response.credential) return;

      setIsLoading(true);
      try {
        await verifyGoogleCredential(response.credential);
        if (onSuccess) {
          onSuccess();
        }
      } catch (err: unknown) {
        let msg = isRtl
          ? 'فشل تسجيل الدخول باستخدام حساب Google. يرجى المحاولة مرة أخرى.'
          : 'Failed to sign in with Google. Please try again.';

        if (err instanceof ApiError && err.message) {
          msg = err.message;
        }
        if (onError) {
          onError(msg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isRtl, onError, onSuccess, verifyGoogleCredential]
  );

  // Initialize and render Google Identity Services button
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupGsi = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;
      if (initializedRef.current) return;

      initializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        context: 'signin',
      });

      // Render official Google button
      const isDark = document.documentElement.classList.contains('dark');

      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 350,
        locale: locale,
      });

      setIsGsiLoaded(true);
    };

    // If script already loaded
    if (window.google?.accounts?.id) {
      setupGsi();
      return;
    }

    // Check if script tag already in DOM
    let script = document.getElementById('google-gsi-client') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setupGsi();
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', setupGsi);
    }

    return () => {
      if (script) {
        script.removeEventListener('load', setupGsi);
      }
    };
  }, [clientId, handleCredentialResponse, locale]);

  // Fallback direct click handler (uses GIS prompt or redirect flow if GSI fails)
  const handleFallbackClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
      return;
    }

    setIsLoading(true);
    const backendUrl = getApiBaseUrl();
    let url = `${backendUrl}/auth/google/redirect`;

    const params = new URLSearchParams();
    if (mockEmail) {
      params.set('mock_email', mockEmail);
    }
    if (redirectUrl) {
      params.set('redirect', redirectUrl);
    }

    const query = params.toString();
    if (query) {
      url += `?${query}`;
    }

    window.location.href = url;
  };

  return (
    <div className={`relative w-full flex flex-col items-center justify-center ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-xs flex items-center justify-center rounded-xl z-20 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-xs font-semibold text-content-primary">
            {isRtl ? 'جارِ التحقق من حساب Google...' : 'Verifying Google Account...'}
          </span>
        </div>
      )}

      {/* Official GSI Button Mount Target */}
      <div
        ref={containerRef}
        className={`w-full flex justify-center min-h-[44px] ${!isGsiLoaded ? 'hidden' : ''}`}
      />

      {/* Beautiful Fallback Button while script loads or if blocked by ad-blocker */}
      {!isGsiLoaded && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-surface-secondary hover:bg-surface-elevated border border-border-subtle text-content-primary font-semibold text-sm transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isRtl ? 'المتابعة باستخدام Google' : 'Continue with Google'}</span>
        </button>
      )}
    </div>
  );
}
