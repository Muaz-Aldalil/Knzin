import React from 'react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { TicketsPageView } from '@/components/tickets/TicketsPageView';

interface TicketsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TicketsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isRtl = locale === 'ar';

  return {
    title: isRtl ? 'دفتر تذاكر السحب الترويجية | كَنزين' : 'Promotional Tickets Ledger | KNZiN',
    description: isRtl
      ? 'دفتر تذاكر السحب الترويجية المجانية المكتسبة من دورات كَنزين المهنية، حالة الأهلية للسحب الساعي واليومي والشهري، والعد التنازلي المباشر.'
      : 'Promotional sweepstakes tickets ledger: view your complimentary tickets, draw eligibility, and live countdowns.',
  };
}

export default async function TicketsPage({ params }: TicketsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="min-h-[80vh]">
      <TicketsPageView />
    </main>
  );
}
