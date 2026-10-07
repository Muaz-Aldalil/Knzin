'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check, Link as LinkIcon, Sparkles, Tag } from 'lucide-react';
import { ReferralInfo } from '@/hooks/useAffiliateDashboard';

interface ReferralLinkCardProps {
  referralInfo: ReferralInfo;
}

export function ReferralLinkCard({ referralInfo }: ReferralLinkCardProps) {
  const t = useTranslations('affiliate');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [campaignTag, setCampaignTag] = useState('');

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const getCampaignUrl = () => {
    const cleanTag = campaignTag.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (!cleanTag) return referralInfo.canonical_url;
    const delimiter = referralInfo.canonical_url.includes('?') ? '&' : '?';
    return `${referralInfo.canonical_url}${delimiter}campaign=${encodeURIComponent(cleanTag)}`;
  };

  return (
    <div id="referral" className="scroll-mt-24 bg-surface border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-xs">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <LinkIcon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-content-primary">
            {t('referralLinkCardTitle')}
          </h3>
          <p className="text-xs text-content-secondary">
            {t('subtitle', { rate: '25%' })}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Canonical Link */}
        <div>
          <label className="block text-xs font-semibold text-content-secondary mb-1.5">
            {referralInfo.learner_code ? `Code: ${referralInfo.learner_code}` : t('referralLinkCardTitle')}
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-secondary border border-border-subtle rounded-xl px-4 py-3 text-sm text-content-primary font-mono select-all truncate">
              {referralInfo.canonical_url}
            </div>
            <button
              onClick={() => copyToClipboard(referralInfo.canonical_url, 'canonical')}
              className="inline-flex items-center gap-1.5 px-4 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-all shadow-xs"
              type="button"
            >
              {copiedType === 'canonical' ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>{t('copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t('copyLink')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Vanity URL (if available) */}
        {referralInfo.vanity_url && (
          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
              <span>{t('customSlug')}</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-surface-secondary border border-border-subtle rounded-xl px-4 py-3 text-sm text-content-primary font-mono select-all truncate">
                {referralInfo.vanity_url}
              </div>
              <button
                onClick={() => copyToClipboard(referralInfo.vanity_url!, 'vanity')}
                className="inline-flex items-center gap-1.5 px-4 py-3 bg-surface-elevated hover:bg-surface-secondary text-content-primary border border-border-subtle text-sm font-semibold rounded-xl transition-all"
                type="button"
              >
                {copiedType === 'vanity' ? (
                  <>
                    <Check className="w-4 h-4 text-success" />
                    <span>{t('copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{t('copyLink')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* UTM Campaign Tag Builder */}
        <div className="pt-4 border-t border-border-subtle">
          <label className="block text-xs font-semibold text-content-secondary mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span>{t('campaignBuilder')}</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={campaignTag}
              onChange={(e) => setCampaignTag(e.target.value)}
              placeholder={t('campaignPlaceholder')}
              className="flex-1 bg-surface-secondary border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-content-primary placeholder:text-content-muted focus:outline-hidden focus:border-primary"
            />
            {campaignTag.trim() && (
              <button
                onClick={() => copyToClipboard(getCampaignUrl(), 'campaign')}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-surface-elevated hover:bg-surface-secondary text-content-primary border border-border-subtle text-sm font-semibold rounded-xl transition-all"
                type="button"
              >
                {copiedType === 'campaign' ? (
                  <>
                    <Check className="w-4 h-4 text-success" />
                    <span>{t('copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{t('copyLink')}</span>
                  </>
                )}
              </button>
            )}
          </div>
          {campaignTag.trim() && (
            <div className="mt-2 text-xs font-mono text-content-muted truncate bg-surface-secondary/50 p-2 rounded-lg border border-border-subtle/50">
              {getCampaignUrl()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
