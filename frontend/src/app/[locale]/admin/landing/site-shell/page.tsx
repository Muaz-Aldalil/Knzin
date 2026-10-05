'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { SiteShellSectionContent, TickerAnnouncementItem, HowItWorksStepItem } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { Globe, Loader2, Plus, Trash2, MessageSquare, BookOpen, ScrollText } from 'lucide-react';

export default function AdminSiteShellCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent, sectionData } =
    useAdminCmsSection<SiteShellSectionContent>('site_shell');

  const [formData, setFormData] = useState<SiteShellSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = <K extends keyof SiteShellSectionContent>(
    field: K,
    value: SiteShellSectionContent[K]
  ) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!formData) return;
    await updateContent(formData);
  };

  // Ticker helpers
  const handleAddTickerItem = () => {
    if (!formData) return;
    const newItem: TickerAnnouncementItem = {
      id: `ticker-${Date.now()}`,
      type: 'bulletin',
      highlight_label_ar: 'تنبيه جديد',
      highlight_label_en: 'New Alert',
      text_ar: 'نص التنبيه الإداري الجديد للنشاط المباشر',
      text_en: 'New administrative live ticker announcement text',
    };
    handleChange('ticker_announcements', [...formData.ticker_announcements, newItem]);
  };

  const handleRemoveTickerItem = (idx: number) => {
    if (!formData) return;
    const next = [...formData.ticker_announcements];
    next.splice(idx, 1);
    handleChange('ticker_announcements', next);
  };

  const handleUpdateTickerItem = (
    idx: number,
    field: keyof TickerAnnouncementItem,
    val: string
  ) => {
    if (!formData) return;
    const next = [...formData.ticker_announcements];
    next[idx] = { ...next[idx], [field]: val };
    handleChange('ticker_announcements', next);
  };

  if (isLoading || !formData) {
    return (
      <AdminGuard requiredCapability="manage_platform_settings">
        <div className="p-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
          <p className="text-xs text-content-secondary">
            {isAr ? 'جارِ تحميل إعدادات الواجهة العامة...' : 'Loading site shell configuration...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'الهيكل العام للمنصة (Site Shell & Global)' : 'Site Shell & Global Elements'}
        description={
          isAr
            ? 'التحكم المركزي في الشريط العلوي، شريط النشاط المباشر، زر الدعم الفني، ونافذة كيف يعمل كَنزين.'
            : 'Central control for the global header, live activity ticker, WhatsApp support button, and How It Works guide.'
        }
        icon={Globe}
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        updatedAt={sectionData?.updated_at}
        onSave={handleSave}
      >
        {/* 1. Global Activity Ticker */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-5">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div>
              <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-brand-gold" />
                <span>{isAr ? 'شريط النشاط والإعلانات المباشر (Activity Ticker)' : 'Live Activity Ticker'}</span>
              </h2>
              <p className="text-xs text-content-secondary mt-0.5">
                {isAr ? 'الشريط الإخباري المتحرك أعلى جميع صفحات الموقع.' : 'The animated news ticker bar pinned below top navigation.'}
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-content-primary">
              <input
                type="checkbox"
                checked={formData.ticker_enabled}
                onChange={(e) => handleChange('ticker_enabled', e.target.checked)}
                className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold"
              />
              <span>{isAr ? 'تفعيل الشريط' : 'Enable Ticker'}</span>
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-content-primary">
                {isAr ? 'عناصر الإعلانات النشطة' : 'Active Announcement Items'}
              </span>
              <button
                type="button"
                onClick={handleAddTickerItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary hover:bg-surface-elevated text-xs font-semibold text-brand-gold border border-border-subtle transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة إعلان' : 'Add Item'}</span>
              </button>
            </div>

            {formData.ticker_announcements.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-content-muted">#{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTickerItem(idx)}
                    className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'حذف' : 'Remove'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      {isAr ? 'وسم التمييز (عربي)' : 'Badge Label (AR)'}
                    </label>
                    <input
                      type="text"
                      value={item.highlight_label_ar}
                      onChange={(e) => handleUpdateTickerItem(idx, 'highlight_label_ar', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      {isAr ? 'وسم التمييز (إنجليزي)' : 'Badge Label (EN)'}
                    </label>
                    <input
                      type="text"
                      value={item.highlight_label_en}
                      onChange={(e) => handleUpdateTickerItem(idx, 'highlight_label_en', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      {isAr ? 'نص الإعلان (عربي)' : 'Announcement Text (AR)'}
                    </label>
                    <input
                      type="text"
                      value={item.text_ar}
                      onChange={(e) => handleUpdateTickerItem(idx, 'text_ar', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      {isAr ? 'نص الإعلان (إنجليزي)' : 'Announcement Text (EN)'}
                    </label>
                    <input
                      type="text"
                      value={item.text_en}
                      onChange={(e) => handleUpdateTickerItem(idx, 'text_en', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. WhatsApp Support Launcher */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-5">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div>
              <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                <span>{isAr ? 'زر الدعم الفني عبر واتساب (Floating WhatsApp)' : 'WhatsApp Support Launcher'}</span>
              </h2>
              <p className="text-xs text-content-secondary mt-0.5">
                {isAr ? 'الزر العائم أسفل الشاشة للتواصل المباشر مع خدمة عملاء كَنزين.' : 'The floating launcher in the bottom corner for visitor support.'}
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-content-primary">
              <input
                type="checkbox"
                checked={formData.whatsapp_enabled}
                onChange={(e) => handleChange('whatsapp_enabled', e.target.checked)}
                className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold"
              />
              <span>{isAr ? 'تفعيل الزر' : 'Enable Button'}</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'رابط واتساب للدعم (WhatsApp URL)' : 'WhatsApp Support URL'}
              </label>
              <input
                type="text"
                placeholder="https://wa.me/9647701234567"
                value={formData.whatsapp_url}
                onChange={(e) => handleChange('whatsapp_url', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary font-mono"
              />
              <span className="text-[11px] text-content-muted mt-1 block">
                {isAr
                  ? 'اتركه فارغاً لعرض نافذة الدعم البديلة للزوار تلقائياً.'
                  : 'Leave empty to display the automated in-app fallback contact dialog.'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'رسالة الترحيب التلقائية (عربي)' : 'Prefilled Greeting (AR)'}
                </label>
                <textarea
                  rows={2}
                  value={formData.whatsapp_greeting_ar}
                  onChange={(e) => handleChange('whatsapp_greeting_ar', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'رسالة الترحيب التلقائية (إنجليزي)' : 'Prefilled Greeting (EN)'}
                </label>
                <textarea
                  rows={2}
                  value={formData.whatsapp_greeting_en}
                  onChange={(e) => handleChange('whatsapp_greeting_en', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Footer Copyright & Legal Disclaimers */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'تذييل الموقع والنصوص القانونية (Footer & Legal)' : 'Footer & Legal Disclaimers'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'حقوق النشر (عربي)' : 'Copyright Text (AR)'}
              </label>
              <input
                type="text"
                value={formData.footer_copyright_ar}
                onChange={(e) => handleChange('footer_copyright_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'حقوق النشر (إنجليزي)' : 'Copyright Text (EN)'}
              </label>
              <input
                type="text"
                value={formData.footer_copyright_en}
                onChange={(e) => handleChange('footer_copyright_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'إخلاء المسؤولية القانوني (عربي)' : 'Legal Disclaimer (AR)'}
              </label>
              <textarea
                rows={3}
                value={formData.footer_disclaimer_ar}
                onChange={(e) => handleChange('footer_disclaimer_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'إخلاء المسؤولية القانوني (إنجليزي)' : 'Legal Disclaimer (EN)'}
              </label>
              <textarea
                rows={3}
                value={formData.footer_disclaimer_en}
                onChange={(e) => handleChange('footer_disclaimer_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>
        </div>
      </CmsFormLayout>
    </AdminGuard>
  );
}
