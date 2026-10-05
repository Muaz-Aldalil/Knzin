import React from 'react';
import { setRequestLocale } from 'next-intl/server';
import { Separator } from '@/components/ui/separator';
import { DrawsArena } from '@/components/draws/DrawsArena';
import { WinnerKycCard } from '@/components/compliance/WinnerKycCard';
import { LegalShieldCmsSection } from '@/components/compliance/LegalShieldCmsSection';
import { RaffleArenaCmsContent } from '@/components/draws/RaffleArenaCmsContent';

export default async function RafflePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16">
      {/* 3-Tier Promotional Draws Arena with Live Countdowns & Hall of Fame (Feature 003) */}
      <DrawsArena />

      <Separator className="my-8" />

      {/* CMS Driven Transparency, Perks & FAQ */}
      <RaffleArenaCmsContent />

      {/* Canonical Legal Shield Section (CMS managed with canonical fallback) */}
      <LegalShieldCmsSection />

      {/* Winner KYC Legal Compliance & National ID Claim Requirement (US6) */}
      <WinnerKycCard variant="standalone" />
    </div>
  );
}
