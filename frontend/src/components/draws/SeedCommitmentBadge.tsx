'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Lock, ShieldCheck, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface SeedCommitmentBadgeProps {
  commitmentHash?: string | null;
  revealedSeed?: string | null;
  className?: string;
  isDetailed?: boolean;
}

export function SeedCommitmentBadge({
  commitmentHash,
  revealedSeed,
  className = '',
  isDetailed = false,
}: SeedCommitmentBadgeProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!commitmentHash && !revealedSeed) {
    return null;
  }

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRevealed = !!revealedSeed;

  return (
    <div
      className={`inline-flex flex-col rounded-xl border text-xs transition-all ${
        isRevealed
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold'
      } ${className}`}
      data-testid="seed-commitment-badge"
    >
      <div
        onClick={() => isDetailed && setExpanded(!expanded)}
        className={`flex items-center gap-2 px-2.5 py-1 ${isDetailed ? 'cursor-pointer' : ''}`}
      >
        {isRevealed ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : (
          <Lock className="w-3.5 h-3.5 text-brand-gold shrink-0" />
        )}

        <span className="font-semibold text-[11px] truncate">
          {isRevealed
            ? isAr
              ? 'نزاهة حسابية مثبتة (SHA-256)'
              : 'Cryptographically Verified'
            : isAr
            ? 'التزام مشفر مسبق (SHA-256)'
            : 'Pre-Committed Seed'}
        </span>

        {commitmentHash && (
          <span className="font-mono text-[10px] opacity-80 hidden sm:inline">
            {commitmentHash.slice(0, 8)}...
          </span>
        )}

        {commitmentHash && (
          <button
            type="button"
            onClick={(e) => handleCopy(commitmentHash, e)}
            title={isAr ? 'نسخ البصمة' : 'Copy Hash'}
            className="p-0.5 rounded hover:bg-white/10"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        )}

        {isDetailed && (
          <span className="shrink-0 text-content-muted">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        )}
      </div>

      {/* Expanded Proof Details */}
      {isDetailed && expanded && (
        <div className="p-3 border-t border-border-subtle/40 bg-surface-card/60 space-y-2 text-[11px]">
          {commitmentHash && (
            <div>
              <span className="text-content-secondary block text-[10px]">
                {isAr ? 'بصمة الالتزام المنشورة مسبقاً:' : 'Pre-published Commitment Hash:'}
              </span>
              <span className="font-mono text-[10px] text-brand-gold break-all block">
                {commitmentHash}
              </span>
            </div>
          )}

          {revealedSeed && (
            <div>
              <span className="text-emerald-400 font-bold block text-[10px]">
                {isAr ? 'بذرة الخادم المكشوفة:' : 'Revealed Server Seed:'}
              </span>
              <span className="font-mono text-[10px] text-emerald-300 break-all block">
                {revealedSeed}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
