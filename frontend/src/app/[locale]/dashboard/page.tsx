import React from 'react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LearnerDashboardView } from '@/components/dashboard/LearnerDashboardView';

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isRtl = locale === 'ar';

  return {
    title: isRtl ? 'لوحة تدريبي ودوراتي | كَنزين' : 'My Learning Hub | KNZiN',
    description: isRtl
      ? 'لوحة التدريب المهني الشخصية: متابعة إنجاز الدورات المهنية، استئناف المشاهدة، وتذاكر السحب الترويجية النشطة.'
      : 'Personal vocational learning hub: track course progress, resume watching, and manage active promotional tickets.',
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="min-h-[80vh]">
      <LearnerDashboardView />
    </main>
  );
}
