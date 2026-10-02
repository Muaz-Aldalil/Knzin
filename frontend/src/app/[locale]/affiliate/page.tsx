import React from 'react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AffiliateDashboardView } from '@/components/affiliate/AffiliateDashboardView';

interface AffiliatePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AffiliatePageProps): Promise<Metadata> {
  const { locale } = await params;
  const isRtl = locale === 'ar';

  return {
    title: isRtl ? 'بوابة الشركاء والمسوّقين | كَنزين' : 'Affiliate & Partner Portal | KNZiN',
    description: isRtl
      ? 'بوابة شركاء كَنزين: شارك رابط إحالتك واكسب 25% عمولة مبيعات مباشرة بالإضافة إلى 40% من قيمة الجائزة الكبرى عند فوز المشترك المدعو.'
      : 'KNZiN Affiliate Portal: Share your referral link to earn 25% sales commission and a 40% co-share of the grand prize when your referred student wins.',
  };
}

export default async function AffiliatePage({ params }: AffiliatePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="min-h-[80vh]">
      <AffiliateDashboardView />
    </main>
  );
}
