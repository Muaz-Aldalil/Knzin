'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAdminCourses } from '@/hooks/admin/useAdminCourses';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { OutcomeItem } from '@/types/admin';
import { useAdminFeedback } from '@/components/admin/AdminFeedbackContext';
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  DollarSign,
  Ticket,
  Sparkles,
  Loader2,
  ImageIcon,
  Upload,
  X,
  AlertTriangle,
} from 'lucide-react';
import { normalizeImageUrl } from '@/lib/image';
import { uploadAdminImage } from '@/lib/api/media';
import { isSafeMediaUrl, sanitizeMediaUrl, validateMediaUrlInput } from '@/lib/safe-url';

export default function CreateCoursePage() {
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === 'ar';
  const { showError, showWarning, showSuccess } = useAdminFeedback();

  const { createCourse, isCreating } = useAdminCourses();

  // General info
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageError, setCoverImageError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  // Local image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showWarning(isAr ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, WebP).' : 'Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showWarning(isAr ? 'حجم الصورة كبير جداً. الحد الأقصى هو 10 ميغابايت.' : 'Image file is too large. Max size is 10MB.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const data = await uploadAdminImage(file, 'courses');
      if (data?.url) {
        setCoverImageUrl(data.url);
        setCoverImageError(null);
        setPreviewError(false);
        showSuccess(isAr ? 'تم رفع صورة الغلاف بنجاح.' : 'Cover image uploaded successfully.');
      }
    } catch (err: any) {
      console.error(err);
      showError(err?.message || (isAr ? 'فشل رفع الصورة.' : 'Failed to upload image.'));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Pricing & subscription
  const [priceDollars, setPriceDollars] = useState('10.00');
  const [promotionalTickets, setPromotionalTickets] = useState('15');
  const [displayPriceLabel, setDisplayPriceLabel] = useState('13,000 د.ع');

  // Descriptions
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [curriculumSummaryAr, setCurriculumSummaryAr] = useState('');
  const [curriculumSummaryEn, setCurriculumSummaryEn] = useState('');

  // Outcomes builder
  const [outcomes, setOutcomes] = useState<OutcomeItem[]>([
    {
      title_ar: 'إتقان المهارات العملية',
      title_en: 'Practical Skill Mastery',
      desc_ar: 'تطبيق مباشر وفق المعايير المهنية المعاصرة.',
      desc_en: 'Direct hands-on execution following modern professional standards.',
    },
  ]);

  const handlePriceChange = (val: string) => {
    setPriceDollars(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      const iqd = Math.round(parsed * 1300);
      setDisplayPriceLabel(`${iqd.toLocaleString('en-US')} د.ع`);
      // Auto-suggest proportional tickets (e.g. 1.5 tickets per dollar)
      setPromotionalTickets(String(Math.max(1, Math.round(parsed * 1.5))));
    }
  };

  const handleAddOutcome = () => {
    setOutcomes((prev) => [
      ...prev,
      {
        title_ar: '',
        title_en: '',
        desc_ar: '',
        desc_en: '',
      },
    ]);
  };

  const handleRemoveOutcome = (idx: number) => {
    setOutcomes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleOutcomeChange = (idx: number, field: keyof OutcomeItem, val: string) => {
    setOutcomes((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr.trim() || !titleEn.trim()) {
      showWarning(isAr ? 'يرجى إدخال عنوان الدورة باللغتين العربية والإنجليزية.' : 'Please enter course title in Arabic and English.');
      return;
    }

    if (coverImageUrl.trim()) {
      const valRes = validateMediaUrlInput(coverImageUrl, isAr);
      if (!valRes.isValid) {
        setCoverImageError(valRes.error);
        showError(valRes.error || (isAr ? 'رابط صورة الغلاف غير آمن أو غير صالح.' : 'Cover image URL is unsafe or invalid.'));
        return;
      }
    }

    const priceCents = Math.round(parseFloat(priceDollars || '0') * 100);

    const validOutcomes = outcomes.filter((o) => o.title_ar.trim() || o.title_en.trim());

    try {
      const created = await createCourse({
        title_ar: titleAr.trim(),
        title_en: titleEn.trim(),
        slug: slug.trim() || undefined,
        description_ar: descAr.trim() || titleAr.trim(),
        description_en: descEn.trim() || titleEn.trim(),
        cover_image_url: coverImageUrl.trim() || undefined,
        bundle_price_cents: priceCents,
        bundle_promotional_tickets: parseInt(promotionalTickets, 10) || 15,
        display_price_label: displayPriceLabel.trim() || undefined,
        is_active: true,
        curriculum_summary_ar: curriculumSummaryAr.trim() || undefined,
        curriculum_summary_en: curriculumSummaryEn.trim() || undefined,
        outcomes: validOutcomes.length > 0 ? validOutcomes : undefined,
      });

      router.push(`/${locale}/admin/courses/${created.id}`);
    } catch (err: any) {
      console.error(err);
      showError(
        err?.message ||
          (isAr
            ? 'حدث خطأ أثناء حفظ الدورة. يرجى التحقق من الحقول والمحاولة مجدداً.'
            : 'Error creating course. Please check fields and try again.')
      );
    }
  };

  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <div className="space-y-6 max-w-4xl mx-auto pb-12" data-testid="admin-create-course-page">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/admin/courses`}
              className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-content-secondary hover:text-content-primary transition-colors"
            >
              <BackIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-content-primary flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                <span>{isAr ? 'إضافة دورة تدريبية جديدة' : 'Create New Course'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-content-secondary mt-0.5">
                {isAr
                  ? 'أدخل بيانات الدورة الأساسية، التسعير، ومخرجات المنهاج، ثم تابع لإضافة الأجزاء والوسائط.'
                  : 'Enter course details, pricing, and curriculum outcomes, then proceed to configure lessons and media.'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: General Info */}
          <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-content-primary pb-2 border-b border-border-subtle">
              {isAr ? 'المعلومات الأساسية' : 'General Information'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'عنوان الدورة (بالعربية) *' : 'Course Title (Arabic) *'}
                </label>
                <input
                  type="text"
                  required
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="مثال: دورة العناية وتلميع السيارات المتقدمة"
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'عنوان الدورة (بالإنجليزية) *' : 'Course Title (English) *'}
                </label>
                <input
                  type="text"
                  required
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. Advanced Auto Detailing Course"
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'المعرف الفريد (Slug - اختياري)' : 'Custom Slug (Optional)'}
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. auto-detailing"
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm font-mono text-content-primary focus:outline-hidden focus:border-primary transition-colors"
                />
                <span className="text-[11px] text-content-muted mt-1 block">
                  {isAr ? 'يتم توليده تلقائياً من العنوان إذا ترك فارغاً.' : 'Auto-generated from title if left empty.'}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-content-secondary">
                    {isAr ? 'صورة الغلاف (Cover Image)' : 'Cover Image'}
                  </label>
                  <span className="text-[11px] text-content-muted">
                    {isAr ? 'رفع من الجهاز أو إدخال رابط' : 'Upload from device or URL'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={coverImageUrl}
                      onChange={(e) => {
                        const normalized = normalizeImageUrl(e.target.value);
                        setCoverImageUrl(normalized);
                        const valRes = validateMediaUrlInput(normalized, isAr);
                        setCoverImageError(valRes.error);
                        setPreviewError(false);
                      }}
                      placeholder={isAr ? 'أدخل رابط الصورة https://... أو ارفع من جهازك' : 'https://... or upload from device'}
                      className={`w-full px-3.5 py-2.5 pe-8 bg-surface-elevated border rounded-xl text-sm font-mono text-content-primary focus:outline-hidden transition-colors ${
                        coverImageError ? 'border-rose-500 focus:border-rose-500' : 'border-border-subtle focus:border-primary'
                      }`}
                    />
                    {coverImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImageUrl('');
                          setCoverImageError(null);
                          setPreviewError(false);
                        }}
                        className="absolute end-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-content-muted hover:text-content-primary hover:bg-surface transition-colors cursor-pointer"
                        title={isAr ? 'مسح الرابط' : 'Clear'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileSelect}
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-bold text-content-primary hover:text-primary transition-colors cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
                    title={isAr ? 'رفع صورة من جهازك المحلي' : 'Upload image from local device'}
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>{isAr ? 'جاري الرفع...' : 'Uploading...'}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-primary" />
                        <span>{isAr ? 'رفع من الجهاز' : 'Upload Image'}</span>
                      </>
                    )}
                  </button>
                </div>

                {coverImageError && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{coverImageError}</span>
                  </div>
                )}

                {coverImageUrl && !coverImageError && isSafeMediaUrl(coverImageUrl) && (
                  <div className="mt-2.5 flex items-center gap-3 p-2.5 bg-surface-elevated/60 border border-border-subtle rounded-xl">
                    <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-slate-900 border border-border-subtle shrink-0 flex items-center justify-center">
                      {!previewError ? (
                        <img
                          src={sanitizeMediaUrl(coverImageUrl)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={() => setPreviewError(true)}
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-content-muted" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-content-primary block truncate">
                        {previewError
                          ? (isAr ? 'تعذر تحميل الصورة من الرابط' : 'Failed to preview image')
                          : (isAr ? 'معاينة الغلاف' : 'Cover image preview')}
                      </span>
                      <span className="text-[10px] text-content-muted font-mono block truncate" dir="ltr">
                        {coverImageUrl}
                      </span>
                    </div>
                  </div>
                )}

                <span className="text-[11px] text-content-muted mt-1.5 block">
                  {isAr
                    ? 'يمكنك رفع صورة مباشرة من جهازك (PNG, JPG, WebP) أو إدخال رابط صورة خارجي.'
                    : 'You can upload an image from your device (PNG, JPG, WebP) or paste an external URL.'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Pricing & Promotional Tickets */}
          <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-content-primary pb-2 border-b border-border-subtle flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? 'التسعير والتذاكر الترويجية' : 'Pricing & Promotional Raffle Tickets'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'سعر الاشتراك الكامل بالدولار ($) *' : 'Full Bundle Price (USD $) *'}
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-content-muted font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={priceDollars}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-full ps-9 pe-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm font-bold text-content-primary focus:outline-hidden focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الملصق المعروض بالدينار العراقي' : 'IQD Display Label'}
                </label>
                <input
                  type="text"
                  value={displayPriceLabel}
                  onChange={(e) => setDisplayPriceLabel(e.target.value)}
                  placeholder="13,000 د.ع"
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm font-bold text-content-primary focus:outline-hidden focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'تذاكر السحب الترويجية الممنوحة *' : 'Promotional Raffle Tickets *'}
                </label>
                <div className="relative">
                  <Ticket className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-amber-400" />
                  <input
                    type="number"
                    min="0"
                    required
                    value={promotionalTickets}
                    onChange={(e) => setPromotionalTickets(e.target.value)}
                    className="w-full ps-10 pe-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm font-bold text-amber-400 focus:outline-hidden focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Course Description & Curriculum Summary */}
          <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-content-primary pb-2 border-b border-border-subtle">
              {isAr ? 'وصف الدورة ومنهاج التعلم' : 'Course Description & Curriculum Overview'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف العام (بالعربية) *' : 'Full Description (Arabic) *'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  placeholder="اكتب وصفاً جذاباً وتفصيلياً للدورة يوضح القيمة المهنية..."
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-primary transition-colors leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف العام (بالإنجليزية) *' : 'Full Description (English) *'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  placeholder="Enter a compelling and detailed description of the course..."
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-primary transition-colors leading-relaxed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'ملخص المنهاج التفصيلي (بالعربية)' : 'Curriculum Summary (Arabic)'}
                </label>
                <textarea
                  rows={3}
                  value={curriculumSummaryAr}
                  onChange={(e) => setCurriculumSummaryAr(e.target.value)}
                  placeholder="ملخص محتويات المنهج المتقدم..."
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'ملخص المنهاج التفصيلي (بالإنجليزية)' : 'Curriculum Summary (English)'}
                </label>
                <textarea
                  rows={3}
                  value={curriculumSummaryEn}
                  onChange={(e) => setCurriculumSummaryEn(e.target.value)}
                  placeholder="Overview of the modular curriculum..."
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Card 4: What You Will Master (Learning Outcomes) */}
          <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-content-primary">
                  {isAr ? 'ما ستتقنه في هذا المنهاج (مخرجات التدريب)' : 'What You Will Master (Learning Outcomes)'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddOutcome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-bold text-primary transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة مخرج جديد' : 'Add Outcome'}</span>
              </button>
            </div>

            <div className="space-y-4">
              {outcomes.map((outcome, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-surface-elevated/50 border border-border-subtle rounded-xl space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">
                      {isAr ? `المخرج #${idx + 1}` : `Outcome #${idx + 1}`}
                    </span>
                    {outcomes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOutcome(idx)}
                        className="text-content-muted hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={outcome.title_ar}
                      onChange={(e) => handleOutcomeChange(idx, 'title_ar', e.target.value)}
                      placeholder={isAr ? 'عنوان المخرج (بالعربية)' : 'Outcome Title (Arabic)'}
                      className="w-full px-3 py-2 bg-surface-card border border-border-subtle rounded-lg text-xs text-content-primary focus:outline-hidden focus:border-primary"
                    />
                    <input
                      type="text"
                      value={outcome.title_en}
                      onChange={(e) => handleOutcomeChange(idx, 'title_en', e.target.value)}
                      placeholder={isAr ? 'عنوان المخرج (بالإنجليزية)' : 'Outcome Title (English)'}
                      className="w-full px-3 py-2 bg-surface-card border border-border-subtle rounded-lg text-xs text-content-primary focus:outline-hidden focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <textarea
                      rows={2}
                      value={outcome.desc_ar}
                      onChange={(e) => handleOutcomeChange(idx, 'desc_ar', e.target.value)}
                      placeholder={isAr ? 'تفاصيل المخرج والمهارات العملية (بالعربية)' : 'Outcome Details (Arabic)'}
                      className="w-full px-3 py-2 bg-surface-card border border-border-subtle rounded-lg text-xs text-content-primary focus:outline-hidden focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      value={outcome.desc_en}
                      onChange={(e) => handleOutcomeChange(idx, 'desc_en', e.target.value)}
                      placeholder={isAr ? 'تفاصيل المخرج والمهارات العملية (بالإنجليزية)' : 'Outcome Details (English)'}
                      className="w-full px-3 py-2 bg-surface-card border border-border-subtle rounded-lg text-xs text-content-primary focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={`/${locale}/admin/courses`}
              className="px-5 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-sm font-semibold text-content-secondary transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Link>

            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors shadow-xs disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري إنشاء الدورة...' : 'Creating Course...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isAr ? 'حفظ ومتابعة إلى الأجزاء والوسائط' : 'Save & Continue to Lessons'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminGuard>
  );
}
