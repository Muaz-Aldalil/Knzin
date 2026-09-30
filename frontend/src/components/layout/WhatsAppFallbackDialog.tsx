'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { MessageSquareOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLocale } from 'next-intl';

export interface WhatsAppFallbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppFallbackDialog({ isOpen, onClose }: WhatsAppFallbackDialogProps) {
  const t = useTranslations('whatsapp');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const handleGoToFaq = () => {
    onClose();
    // Smooth scroll to #faq with header offset clearance
    const faqElement = document.getElementById('faq');
    if (faqElement) {
      faqElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/${locale}/#faq`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6 bg-surface-primary border border-border-subtle rounded-2xl shadow-xl">
        <DialogHeader className="text-start space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <MessageSquareOff className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-content-primary">
            {t('fallbackTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm text-content-secondary leading-relaxed">
            {t('fallbackDescription')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border-subtle text-content-secondary hover:bg-surface-secondary text-sm font-semibold transition-colors"
          >
            {t('fallbackClose')}
          </button>
          <button
            type="button"
            onClick={handleGoToFaq}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-md shadow-primary/20 transition-colors"
          >
            <span>{t('fallbackFaqCta')}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
