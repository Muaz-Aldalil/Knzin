'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ConcludedDrawItem } from '@/types/draws';
import { Trophy, ExternalLink, CheckCircle2, Ticket, MapPin, Calendar } from 'lucide-react';

interface ConcludedDrawsListProps {
  draws: ConcludedDrawItem[];
  className?: string;
}

export function ConcludedDrawsList({ draws, className = '' }: ConcludedDrawsListProps) {
  const t = useTranslations('draws');

  if (!draws || draws.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-muted/20 border border-border">
        <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">{t('emptyConcluded')}</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {draws.map((item) => (
        <div
          key={item.id}
          className="group relative flex flex-col justify-between rounded-2xl bg-card border border-border shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
        >
          <div>
            {/* Prize Thumbnail Header */}
            <div className="relative aspect-16/9 w-full overflow-hidden bg-muted/30">
              <Image
                src={item.prize.image_url}
                alt={item.prize.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className="absolute top-3 start-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-amber-950 shadow-xs">
                  <Trophy className="h-3 w-3" />
                  {item.tier === 'monthly'
                    ? t('tierMonthly')
                    : item.tier === 'daily'
                    ? t('tierDaily')
                    : t('tierHourly')}
                </span>
              </div>

              <div className="absolute bottom-2.5 inset-x-3 text-white text-xs font-bold line-clamp-1">
                {item.prize.title} (${item.prize.valuation_usd.toLocaleString()})
              </div>
            </div>

            {/* Winner Details Body */}
            <div className="p-4 sm:p-5 space-y-3.5 text-start">
              {/* Winning Serial Ticket Badge */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{t('winnerTicketSerial')}</span>
                </div>
                <span className="font-mono font-bold text-sm text-primary tracking-wider">
                  <bdi dir="ltr">{item.winner.winning_ticket_serial}</bdi>
                </span>
              </div>

              {/* Winner Name & Governorate */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('winnerName')}</span>
                  <span className="font-bold text-foreground">{item.winner.masked_name}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('winnerCity')}
                  </span>
                  <span className="font-medium text-foreground">{item.winner.governorate}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('drawnAt')}
                  </span>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    <bdi dir="ltr">
                      {new Date(item.concluded_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </bdi>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Confirmation & Stream Replay Link */}
          <div className="p-4 sm:p-5 pt-0 border-t border-border/40 mt-2 space-y-2">
            <div className="flex items-center justify-between pt-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {item.winner.prize_delivered ? t('prizeDelivered') : t('prizeProcessing')}
              </span>

              {item.broadcast_replay_url && (
                <a
                  href={item.broadcast_replay_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <span>{t('watchReplay')}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
