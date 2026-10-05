'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import HeaderHUD from '@/components/layout/HeaderHUD';
import { ActivityTicker } from '@/components/layout/ActivityTicker';
import { FloatingWhatsAppButton } from '@/components/layout/FloatingWhatsAppButton';
import Footer from '@/components/layout/Footer';

interface SiteFrameProps {
  children: React.ReactNode;
}

export function SiteFrame({ children }: SiteFrameProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.includes('/admin');
  const isAuth = pathname?.includes('/auth/login') || pathname?.includes('/auth/callback');

  if (isAdmin) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <>
      <HeaderHUD />
      <ActivityTicker />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      {!isAuth && <Footer />}
      <FloatingWhatsAppButton />
    </>
  );
}
