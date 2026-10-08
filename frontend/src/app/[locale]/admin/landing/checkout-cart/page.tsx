'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { CheckoutCartSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { ShoppingCart, Loader2 } from 'lucide-react';

export default function AdminCheckoutCartCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent, sectionData } =
    useAdminCmsSection<CheckoutCartSectionContent>('checkout_cart');

  const [formData, setFormData] = useState<CheckoutCartSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = <K extends keyof CheckoutCartSectionContent>(
    field: K,
    value: CheckoutCartSectionContent[K]
  ) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!formData) return;
    await updateContent(formData);
  };

  if (isLoading || !formData) {
    return (
      <AdminGuard requiredCapability="manage_platform_settings">
        <div className="p-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-content-secondary">
            {isAr ? 'جارِ تحميل إعدادات الدفع والسلة...' : 'Loading checkout & cart presentation...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'عناصر السلة والدفع (Checkout & Cart Presentation)' : 'Checkout & Cart Presentation'}
        description={
          isAr
            ? 'التحكم في شارة الأمان والضمان، رسالة إهداء التذاكر المجانية، ورسائل تأكيد نجاح الطلب.'
            : 'Configure security badges, free ticket gift reassurance notices, and post-order celebration copy.'
        }
        icon={ShoppingCart}
        targetRoute="/#catalog"
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        updatedAt={sectionData?.updated_at}
        onSave={handleSave}
      >
        {/* Section Visibility */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-content-primary">
              {isAr ? 'ظهور رسائل الدفع والسلة' : 'Checkout & Cart Promotional Messaging Visibility'}
            </h2>
            <p className="text-xs text-content-secondary mt-1">
              {isAr
                ? 'تفعيل أو إخفاء رسائل الترويج والتطمين الإضافية في السلة والدفع'
                : 'Toggle optional reassurance and celebration banners during checkout flow'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.is_visible}
              onChange={(e) => handleChange('is_visible', e.target.checked)}
            />
            <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border-subtle after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Security & Trust Presentation */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'شارات الأمان والموثوقية (Trust & Security Banner)' : 'Trust & Security Banner'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شارة الأمان (عربي)' : 'Trust Badge (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.trust_badge_ar}
                onChange={(e) => handleChange('trust_badge_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شارة الأمان (إنجليزي)' : 'Trust Badge (English)'}
              </label>
              <input
                type="text"
                value={formData.trust_badge_en}
                onChange={(e) => handleChange('trust_badge_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الضمان (عربي)' : 'Trust Headline (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.trust_headline_ar}
                onChange={(e) => handleChange('trust_headline_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الضمان (إنجليزي)' : 'Trust Headline (English)'}
              </label>
              <input
                type="text"
                value={formData.trust_headline_en}
                onChange={(e) => handleChange('trust_headline_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شرح الضمان والموثوقية (عربي)' : 'Trust Description (Arabic)'}
              </label>
              <textarea
                rows={2}
                value={formData.trust_description_ar}
                onChange={(e) => handleChange('trust_description_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شرح الضمان والموثوقية (إنجليزي)' : 'Trust Description (English)'}
              </label>
              <textarea
                rows={2}
                value={formData.trust_description_en}
                onChange={(e) => handleChange('trust_description_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
        </div>

        {/* Free Ticket Gift Notice */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'رسالة هدية التذاكر المجانية (Free Ticket Gift Notice)' : 'Free Ticket Gift Notice'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'رسالة الإهداء في السحب (عربي)' : 'Ticket Gift Notice (Arabic)'}
              </label>
              <textarea
                rows={3}
                value={formData.ticket_gift_notice_ar}
                onChange={(e) => handleChange('ticket_gift_notice_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'رسالة الإهداء في السحب (إنجليزي)' : 'Ticket Gift Notice (English)'}
              </label>
              <textarea
                rows={3}
                value={formData.ticket_gift_notice_en}
                onChange={(e) => handleChange('ticket_gift_notice_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
        </div>

        {/* Post-Order Celebration & Reassurance */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'رسالة نجاح الطلب والتطمين (Order Celebration)' : 'Order Celebration & Reassurance'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان التهنئة بالطلب (عربي)' : 'Celebration Title (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.order_celebration_title_ar}
                onChange={(e) => handleChange('order_celebration_title_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان التهنئة بالطلب (إنجليزي)' : 'Celebration Title (English)'}
              </label>
              <input
                type="text"
                value={formData.order_celebration_title_en}
                onChange={(e) => handleChange('order_celebration_title_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'تفاصيل التهنئة بالطلب (عربي)' : 'Celebration Description (Arabic)'}
              </label>
              <textarea
                rows={2}
                value={formData.order_celebration_desc_ar}
                onChange={(e) => handleChange('order_celebration_desc_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'تفاصيل التهنئة بالطلب (إنجليزي)' : 'Celebration Description (English)'}
              </label>
              <textarea
                rows={2}
                value={formData.order_celebration_desc_en}
                onChange={(e) => handleChange('order_celebration_desc_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'رسالة تفعيل التذاكر (عربي)' : 'Ticket Reassurance (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.order_ticket_reassurance_ar}
                onChange={(e) => handleChange('order_ticket_reassurance_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'رسالة تفعيل التذاكر (إنجليزي)' : 'Ticket Reassurance (English)'}
              </label>
              <input
                type="text"
                value={formData.order_ticket_reassurance_en}
                onChange={(e) => handleChange('order_ticket_reassurance_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </CmsFormLayout>
    </AdminGuard>
  );
}
