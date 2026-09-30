'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { WhatsAppFallbackDialog } from '@/components/layout/WhatsAppFallbackDialog';

export function FloatingWhatsAppButton() {
  const locale = useLocale();
  const t = useTranslations('whatsapp');
  const [isFallbackOpen, setIsFallbackOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const configuredUrl = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_URL;

    if (!configuredUrl || configuredUrl.trim() === '') {
      setIsFallbackOpen(true);
      return;
    }

    const greeting = t('prefilledGreeting');
    const separator = configuredUrl.includes('?') ? '&' : '?';
    const finalUrl = `${configuredUrl.trim()}${separator}text=${encodeURIComponent(greeting)}`;

    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={t('buttonLabel')}
        className="fixed bottom-6 end-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-lg hover:shadow-2xl shadow-[#25D366]/30 hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-[#25D366]/40 cursor-pointer group"
      >
        {/* WhatsApp Brand SVG */}
        <svg
          className="w-7 h-7 fill-current transition-transform duration-200 group-hover:scale-110"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.176.2-.352.226-.653.075s-1.272-.469-2.423-1.496c-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.352.452-.528.15-.176.2-.301.301-.502.101-.2.05-.377-.025-.528-.075-.15-.678-1.633-.929-2.238-.244-.589-.493-.509-.678-.519-.176-.009-.377-.01-.578-.01s-.528.075-.804.377c-.276.301-1.055 1.03-1.055 2.513s1.08 2.915 1.231 3.116c.15.201 2.125 3.245 5.148 4.551.719.311 1.28.497 1.718.636.722.23 1.378.197 1.898.12.578-.087 1.78-.728 2.031-1.431.251-.703.251-1.306.176-1.431-.075-.125-.276-.201-.578-.351zM12.04 2C6.516 2 2.028 6.488 2.028 12.012c0 1.942.556 3.754 1.517 5.29L2 22l4.832-1.516a9.96 9.96 0 0 0 5.208 1.456c5.524 0 10.012-4.488 10.012-10.012S17.564 2 12.04 2zm0 18.272c-1.603 0-3.093-.45-4.37-1.232l-.313-.192-2.871.9 1.052-2.733-.211-.336a8.232 8.232 0 0 1-1.268-4.667c0-4.57 3.719-8.288 8.288-8.288 4.57 0 8.288 3.718 8.288 8.288 0 4.57-3.718 8.288-8.288 8.288z" />
        </svg>

        {/* Online Status Dot */}
        <span className="absolute top-1 end-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white"></span>
        </span>
      </button>

      {/* Offline In-App Fallback Dialog */}
      <WhatsAppFallbackDialog
        isOpen={isFallbackOpen}
        onClose={() => setIsFallbackOpen(false)}
      />
    </>
  );
}
