'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Smartphone, Wallet, ShieldCheck, CheckCircle2 } from 'lucide-react';

export type PaymentGatewayType = 'zaincash' | 'asiahawala' | 'simulator';

interface PaymentGatewaySelectorProps {
  selectedGateway: PaymentGatewayType;
  onSelectGateway: (gateway: PaymentGatewayType) => void;
  amountIqd: number;
  disabled?: boolean;
}

export default function PaymentGatewaySelector({
  selectedGateway,
  onSelectGateway,
  amountIqd,
  disabled = false,
}: PaymentGatewaySelectorProps) {
  const t = useTranslations('payment');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const formattedAmount = amountIqd.toLocaleString();

  const isSimulatorAllowed = 
    process.env.NODE_ENV !== 'production' || 
    process.env.NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATOR === 'true';

  const gateways = [
    {
      id: 'zaincash' as PaymentGatewayType,
      title: t('zaincash'),
      description: t('zaincashDesc'),
      badge: isRtl ? 'المحفظة الأولى' : 'Most Popular',
      colorClasses: {
        border: 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-500/60',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        iconBg: 'bg-emerald-600 text-white',
        ring: 'ring-2 ring-emerald-500',
      },
      icon: Wallet,
    },
    {
      id: 'asiahawala' as PaymentGatewayType,
      title: t('asiahawala'),
      description: t('asiahawalaDesc'),
      badge: isRtl ? 'آسيا سيل' : 'Asia Cell',
      colorClasses: {
        border: 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-500/60',
        badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
        iconBg: 'bg-indigo-600 text-white',
        ring: 'ring-2 ring-indigo-500',
      },
      icon: Smartphone,
    },
    ...(isSimulatorAllowed ? [
      {
        id: 'simulator' as PaymentGatewayType,
        title: t('simulator'),
        description: t('simulatorDesc'),
        badge: isRtl ? 'تجريبي' : 'Sandbox',
        colorClasses: {
          border: 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-500/60',
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
          iconBg: 'bg-amber-600 text-white',
          ring: 'ring-2 ring-amber-500',
        },
        icon: ShieldCheck,
      },
    ] : []),
  ];

  return (
    <div className="space-y-3" role="radiogroup" aria-label={t('gatewaySelectorTitle')}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {t('gatewaySelectorTitle')}
        </label>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          {formattedAmount} {isRtl ? 'د.ع' : 'IQD'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {gateways.map((gw) => {
          const isSelected = selectedGateway === gw.id;
          const Icon = gw.icon;

          return (
            <div
              key={gw.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={disabled ? -1 : 0}
              onClick={() => !disabled && onSelectGateway(gw.id)}
              onKeyDown={(e) => {
                if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
                  e.preventDefault();
                  onSelectGateway(gw.id);
                }
              }}
              className={`relative flex items-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? `${gw.colorClasses.border} ${gw.colorClasses.ring} shadow-sm`
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${gw.colorClasses.iconBg} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="mr-3 ml-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {gw.title}
                  </span>
                  {gw.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${gw.colorClasses.badge}`}>
                      {gw.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {gw.description}
                </p>
              </div>

              <div className="shrink-0 flex items-center justify-center">
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50 duration-150" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
        {t('gatewaySelectorHelp')}
      </p>
    </div>
  );
}
