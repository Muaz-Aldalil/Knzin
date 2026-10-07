'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAdminCourseDetail } from '@/hooks/admin/useAdminCourses';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminCoursePart, OutcomeItem } from '@/types/admin';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
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
  Layers,
  Video,
  FileText,
  PlayCircle,
  Lock,
  CheckCircle,
  PauseCircle,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Edit,
  Loader2,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function CourseDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const isAr = locale === 'ar';
  const id = params?.id as string;
  const { showSuccess, showError, showWarning } = useAdminFeedback();

  const {
    course,
    isLoading,
    isError,
    refetch,
    updateCourse,
    isUpdating,
    toggleStatus,
    isTogglingStatus,
    deleteCourse,
    isDeleting,
    createPart,
    isCreatingPart,
    updatePart,
    isUpdatingPart,
    deletePart,
    isDeletingPart,
    reorderParts,
    isReorderingParts,
  } = useAdminCourseDetail(id);

  const [activeTab, setActiveTab] = useState<'general' | 'content' | 'outcomes' | 'parts'>('general');

  // Form states for General Info & Pricing
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [priceDollars, setPriceDollars] = useState('10.00');
  const [promotionalTickets, setPromotionalTickets] = useState('15');
  const [displayPriceLabel, setDisplayPriceLabel] = useState('');

  // Form states for Content & Curriculum Summary
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [curriculumSummaryAr, setCurriculumSummaryAr] = useState('');
  const [curriculumSummaryEn, setCurriculumSummaryEn] = useState('');

  // Outcomes builder
  const [outcomes, setOutcomes] = useState<OutcomeItem[]>([]);

  // Part modal states
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<AdminCoursePart | null>(null);
  const [partTitleAr, setPartTitleAr] = useState('');
  const [partTitleEn, setPartTitleEn] = useState('');
  const [partSyllabusAr, setPartSyllabusAr] = useState('');
  const [partSyllabusEn, setPartSyllabusEn] = useState('');
  const [partDuration, setPartDuration] = useState('45');
  const [partIsFree, setPartIsFree] = useState(false);
  const [partVideoUrl, setPartVideoUrl] = useState('');
  const [partPdfUrl, setPartPdfUrl] = useState('');
  const [partPdfTitleAr, setPartPdfTitleAr] = useState('');
  const [partPdfTitleEn, setPartPdfTitleEn] = useState('');
  const [partPriceDollars, setPartPriceDollars] = useState('2.00');
  const [partTickets, setPartTickets] = useState('1');

  // Delete course confirmation
  const [isDeleteCourseOpen, setIsDeleteCourseOpen] = useState(false);

  // Delete part confirmation
  const [partToDelete, setPartToDelete] = useState<AdminCoursePart | null>(null);

  // Sync state when course is loaded
  useEffect(() => {
    if (course) {
      setTitleAr(course.title_ar || '');
      setTitleEn(course.title_en || '');
      setSlug(course.slug || '');
      setCoverImageUrl(course.cover_image_url || '');
      setPriceDollars(((course.bundle_price_cents || 0) / 100).toFixed(2));
      setPromotionalTickets(String(course.bundle_promotional_tickets || 15));
      setDisplayPriceLabel(course.display_price_label || '');

      setDescAr(course.description_ar || '');
      setDescEn(course.description_en || '');
      setCurriculumSummaryAr(course.curriculum_summary_ar || '');
      setCurriculumSummaryEn(course.curriculum_summary_en || '');

      if (course.outcomes && Array.isArray(course.outcomes) && course.outcomes.length > 0) {
        setOutcomes(
          course.outcomes.map((o: any) => ({
            title_ar: o.title_ar || o.title || '',
            title_en: o.title_en || o.title || '',
            desc_ar: o.desc_ar || o.description || '',
            desc_en: o.desc_en || o.description || '',
          }))
        );
      } else {
        setOutcomes([
          {
            title_ar: 'إتقان الصقل الميكانيكي ومعالجة الخدوش',
            title_en: 'Rotary & Dual-Action Paint Correction Mastery',
            desc_ar: 'العمل بأجهزة الروتاري والديوال أكشن واختيار المعاجين المناسبة.',
            desc_en: 'Hands-on correction with rotary and dual-action polishers.',
          },
        ]);
      }
    }
  }, [course]);

  const handlePriceChange = (val: string) => {
    setPriceDollars(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      const iqd = Math.round(parsed * 1300);
      setDisplayPriceLabel(`${iqd.toLocaleString('en-US')} د.ع`);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const priceCents = Math.round(parseFloat(priceDollars || '0') * 100);
      await updateCourse({
        title_ar: titleAr.trim(),
        title_en: titleEn.trim(),
        slug: slug.trim() || undefined,
        cover_image_url: coverImageUrl.trim() || undefined,
        bundle_price_cents: priceCents,
        bundle_promotional_tickets: parseInt(promotionalTickets, 10) || 15,
        display_price_label: displayPriceLabel.trim() || undefined,
      });
      showSuccess(isAr ? 'تم حفظ المعلومات الأساسية والتسعير بنجاح.' : 'General info & pricing saved successfully.');
    } catch (err: any) {
      console.error(err);
      showError(err?.message || (isAr ? 'فشل حفظ التعديلات.' : 'Failed to save changes.'));
    }
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCourse({
        description_ar: descAr.trim(),
        description_en: descEn.trim(),
        curriculum_summary_ar: curriculumSummaryAr.trim() || undefined,
        curriculum_summary_en: curriculumSummaryEn.trim() || undefined,
      });
      showSuccess(isAr ? 'تم حفظ الوصف ومخطط المنهاج بنجاح.' : 'Description & curriculum summary saved successfully.');
    } catch (err: any) {
      console.error(err);
      showError(err?.message || (isAr ? 'فشل حفظ التعديلات.' : 'Failed to save changes.'));
    }
  };

  const handleSaveOutcomes = async () => {
    const valid = outcomes.filter((o) => o.title_ar.trim() || o.title_en.trim());
    try {
      await updateCourse({
        outcomes: valid,
      });
      showSuccess(isAr ? 'تم حفظ مخرجات المنهاج ("ما ستتقنه") بنجاح.' : 'Learning outcomes saved successfully.');
    } catch (err: any) {
      console.error(err);
      showError(err?.message || (isAr ? 'فشل حفظ المخرجات.' : 'Failed to save outcomes.'));
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

  const handleOpenAddPart = () => {
    setEditingPart(null);
    const nextNumber = (course?.parts?.length || 0) + 1;
    setPartTitleAr('');
    setPartTitleEn('');
    setPartSyllabusAr('');
    setPartSyllabusEn('');
    setPartDuration('45');
    // First part defaults to free preview if no parts yet
    setPartIsFree(nextNumber === 1);
    setPartVideoUrl('');
    setPartPdfUrl('');
    setPartPdfTitleAr('');
    setPartPdfTitleEn('');
    setPartPriceDollars('2.00');
    setPartTickets('1');
    setIsPartModalOpen(true);
  };

  const handleOpenEditPart = (part: AdminCoursePart) => {
    setEditingPart(part);
    setPartTitleAr(part.title_ar || '');
    setPartTitleEn(part.title_en || '');
    setPartSyllabusAr(part.syllabus_ar || '');
    setPartSyllabusEn(part.syllabus_en || '');
    setPartDuration(String(part.duration_minutes || 45));
    setPartIsFree(!!part.is_free);
    setPartVideoUrl(part.video_url || '');
    setPartPdfUrl(part.pdf_url || '');
    setPartPdfTitleAr(part.pdf_title_ar || '');
    setPartPdfTitleEn(part.pdf_title_en || '');
    setPartPriceDollars(((part.part_price_cents || 200) / 100).toFixed(2));
    setPartTickets(String(part.part_promotional_tickets || 1));
    setIsPartModalOpen(true);
  };

  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partTitleAr.trim()) {
      showWarning(isAr ? 'يرجى إدخال عنوان الجزء بالعربية.' : 'Please enter part title in Arabic.');
      return;
    }

    const payload: any = {
      title_ar: partTitleAr.trim(),
      title_en: partTitleEn.trim() || partTitleAr.trim(),
      syllabus_ar: partSyllabusAr.trim() || undefined,
      syllabus_en: partSyllabusEn.trim() || undefined,
      duration_minutes: parseInt(partDuration, 10) || 45,
      is_free: partIsFree,
      video_url: partVideoUrl.trim() || null,
      pdf_url: partPdfUrl.trim() || null,
      pdf_title_ar: partPdfTitleAr.trim() || null,
      pdf_title_en: partPdfTitleEn.trim() || null,
      part_price_cents: Math.round(parseFloat(partPriceDollars || '2') * 100),
      part_promotional_tickets: parseInt(partTickets, 10) || 1,
    };

    try {
      if (editingPart) {
        await updatePart({ partId: editingPart.id, data: payload });
        showSuccess(isAr ? 'تم تحديث الجزء التدريبي بنجاح.' : 'Training part updated successfully.');
      } else {
        await createPart(payload);
        showSuccess(isAr ? 'تم إضافة الجزء التدريبي بنجاح.' : 'Training part added successfully.');
      }
      setIsPartModalOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      showError(err?.message || (isAr ? 'فشل حفظ الجزء.' : 'Failed to save part.'));
    }
  };

  const handleMovePart = async (index: number, direction: 'up' | 'down') => {
    if (!course?.parts) return;
    const parts = [...course.parts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= parts.length) return;

    // Swap
    const temp = parts[index];
    parts[index] = parts[targetIndex];
    parts[targetIndex] = temp;

    const orderedIds = parts.map((p) => p.id);
    try {
      await reorderParts(orderedIds);
    } catch (err) {
      console.error(err);
      showError(isAr ? 'فشل إعادة ترتيب الأجزاء.' : 'Failed to reorder parts.');
    }
  };

  const handleDeletePart = async () => {
    if (!partToDelete) return;
    try {
      const res = await deletePart(partToDelete.id);
      showSuccess(res.message || (isAr ? 'تمت معالجة حذف / أرشفة الجزء بأمان.' : 'Part safely deleted/archived.'));
      setPartToDelete(null);
      refetch();
    } catch (err: any) {
      console.error(err);
      showError(err?.message || (isAr ? 'فشل حذف الجزء.' : 'Failed to delete part.'));
    }
  };

  const handleDeleteCourse = async () => {
    try {
      const res = await deleteCourse();
      showSuccess(res.message || (isAr ? 'تمت أرشفة أو حذف الدورة بنجاح.' : 'Course safely deleted/archived.'));
      router.push(`/${locale}/admin/courses`);
    } catch (err: any) {
      console.error(err);
      showError(err?.message || (isAr ? 'فشل حذف الدورة.' : 'Failed to delete course.'));
    }
  };

  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-brand-gold">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-semibold">{isAr ? 'جاري تحميل الدورة...' : 'Loading course...'}</span>
        </div>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-400 font-bold">{isAr ? 'تعذر العثور على الدورة المطلوبة.' : 'Course not found.'}</p>
        <Link
          href={`/${locale}/admin/courses`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated text-xs font-bold text-content-primary"
        >
          <BackIcon className="w-4 h-4" />
          <span>{isAr ? 'العودة لقائمة الدورات' : 'Back to Courses'}</span>
        </Link>
      </div>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <div className="space-y-6 max-w-5xl mx-auto pb-16" data-testid="admin-course-editor-page">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="flex items-start gap-3">
            <Link
              href={`/${locale}/admin/courses`}
              className="p-2 mt-1 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-content-secondary hover:text-content-primary transition-colors"
              title={isAr ? 'العودة' : 'Back'}
            >
              <BackIcon className="w-5 h-5" />
            </Link>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-content-primary">
                  {isAr ? course.title_ar : course.title_en}
                </h1>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                    course.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {course.is_active ? <CheckCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                  <span>{course.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'متوقف مؤقتاً' : 'Paused')}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-content-muted mt-1">
                <span className="font-mono">{course.slug}</span>
                <span>•</span>
                <Link
                  href={`/${locale}/courses/${course.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-brand-gold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isAr ? 'معاينة في الموقع' : 'Public Catalog Preview'}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleStatus()}
              disabled={isTogglingStatus}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 ${
                course.is_active
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              {course.is_active ? <PauseCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
              <span>
                {course.is_active ? (isAr ? 'إيقاف مؤقت' : 'Pause Course') : (isAr ? 'تفعيل ونشر' : 'Activate Course')}
              </span>
            </button>

            <button
              onClick={() => setIsDeleteCourseOpen(true)}
              className="p-2 rounded-xl bg-surface-elevated hover:bg-rose-500/10 border border-border-subtle text-content-muted hover:text-rose-400 transition-colors"
              title={isAr ? 'أرشفة أو حذف الدورة' : 'Archive or Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-2xl border border-border-subtle text-xs sm:text-sm overflow-x-auto">
          {[
            { id: 'general', labelAr: 'المعلومات والتسعير', labelEn: 'General & Pricing', icon: DollarSign },
            { id: 'content', labelAr: 'الوصف ومنهاج التعلم', labelEn: 'Description & Curriculum', icon: BookOpen },
            { id: 'outcomes', labelAr: 'ما ستتقنه (المخرجات)', labelEn: 'What You Will Master', icon: Sparkles },
            {
              id: 'parts',
              labelAr: `الأجزاء والدروس (${course.parts?.length || 0})`,
              labelEn: `Parts & Lessons (${course.parts?.length || 0})`,
              icon: Layers,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-brand-gold text-brand-navy shadow-xs'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: General Info & Pricing */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="space-y-6">
            <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-content-primary pb-2 border-b border-border-subtle">
                {isAr ? 'بيانات الدورة الأساسية' : 'Course Details'}
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
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-brand-gold transition-colors"
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
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-brand-gold transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    {isAr ? 'المعرف الفريد (Slug)' : 'Course Slug'}
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm font-mono text-content-primary focus:outline-hidden focus:border-brand-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    {isAr ? 'رابط صورة الغلاف' : 'Cover Image URL'}
                  </label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm font-mono text-content-primary focus:outline-hidden focus:border-brand-gold transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-content-primary pb-2 border-b border-border-subtle flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>{isAr ? 'التسعير والتذاكر الترويجية' : 'Pricing & Subscription'}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    {isAr ? 'سعر الاشتراك الكامل ($)' : 'Full Bundle Price (USD $)'}
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
                      className="w-full ps-8 pe-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm font-bold text-content-primary focus:outline-hidden focus:border-brand-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    {isAr ? 'الملصق المعروض بالدينار' : 'IQD Display Label'}
                  </label>
                  <input
                    type="text"
                    value={displayPriceLabel}
                    onChange={(e) => setDisplayPriceLabel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm font-bold text-content-primary focus:outline-hidden focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    {isAr ? 'تذاكر السحب الترويجية المجانية' : 'Promotional Raffle Tickets'}
                  </label>
                  <div className="relative">
                    <Ticket className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-amber-400" />
                    <input
                      type="number"
                      min="0"
                      required
                      value={promotionalTickets}
                      onChange={(e) => setPromotionalTickets(e.target.value)}
                      className="w-full ps-9 pe-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm font-bold text-amber-400 focus:outline-hidden focus:border-brand-gold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-gold text-brand-navy font-bold text-sm hover:bg-brand-gold-light transition-colors shadow-xs disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Description & Curriculum Overview */}
        {activeTab === 'content' && (
          <form onSubmit={handleSaveContent} className="space-y-6">
            <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-content-primary pb-2 border-b border-border-subtle">
                {isAr ? 'وصف الدورة الشامل' : 'Full Course Description'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    {isAr ? 'الوصف بالعربية' : 'Arabic Description'}
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-brand-gold leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    {isAr ? 'الوصف بالإنجليزية' : 'English Description'}
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-brand-gold leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-content-primary pb-2 border-b border-border-subtle">
                {isAr ? 'ملخص المنهاج التفصيلي (Detailed Curriculum)' : 'Detailed Curriculum Summary'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    {isAr ? 'ملخص المنهاج بالعربية' : 'Arabic Curriculum Overview'}
                  </label>
                  <textarea
                    rows={4}
                    value={curriculumSummaryAr}
                    onChange={(e) => setCurriculumSummaryAr(e.target.value)}
                    placeholder="مقدمة ومحاور المنهاج التفصيلي..."
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-brand-gold leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">
                    {isAr ? 'ملخص المنهاج بالإنجليزية' : 'English Curriculum Overview'}
                  </label>
                  <textarea
                    rows={4}
                    value={curriculumSummaryEn}
                    onChange={(e) => setCurriculumSummaryEn(e.target.value)}
                    placeholder="Curriculum syllabus overview..."
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-brand-gold leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-gold text-brand-navy font-bold text-sm hover:bg-brand-gold-light transition-colors shadow-xs disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isAr ? 'حفظ المحتوى' : 'Save Content'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: What You Will Master (Learning Outcomes) */}
        {activeTab === 'outcomes' && (
          <div className="space-y-6">
            <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-gold" />
                  <div>
                    <h2 className="text-base font-bold text-content-primary">
                      {isAr ? 'ما ستتقنه في هذا المنهاج' : 'What You Will Master in This Curriculum'}
                    </h2>
                    <p className="text-xs text-content-muted mt-0.5">
                      {isAr
                        ? 'تظهر هذه المخرجات في صفحة تفاصيل الدورة كبطاقات مهارات عملية موجهة للمتعلم.'
                        : 'These outcomes render on the course details page as vocational skill cards.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddOutcome}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-bold text-brand-gold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة مخرج' : 'Add Outcome'}</span>
                </button>
              </div>

              <div className="space-y-4">
                {outcomes.map((outcome, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-surface-elevated/50 border border-border-subtle rounded-xl space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-gold">
                        {isAr ? `المخرج المهني #${idx + 1}` : `Learning Outcome #${idx + 1}`}
                      </span>
                      {outcomes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOutcome(idx)}
                          className="text-content-muted hover:text-rose-400 transition-colors p-1"
                          title={isAr ? 'حذف هذا المخرج' : 'Remove outcome'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-content-muted mb-1">
                          {isAr ? 'العنوان بالعربية' : 'Arabic Title'}
                        </label>
                        <input
                          type="text"
                          value={outcome.title_ar}
                          onChange={(e) => handleOutcomeChange(idx, 'title_ar', e.target.value)}
                          className="w-full px-3 py-2 bg-surface-card border border-border-subtle rounded-lg text-xs text-content-primary focus:outline-hidden focus:border-brand-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-content-muted mb-1">
                          {isAr ? 'العنوان بالإنجليزية' : 'English Title'}
                        </label>
                        <input
                          type="text"
                          value={outcome.title_en}
                          onChange={(e) => handleOutcomeChange(idx, 'title_en', e.target.value)}
                          className="w-full px-3 py-2 bg-surface-card border border-border-subtle rounded-lg text-xs text-content-primary focus:outline-hidden focus:border-brand-gold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-content-muted mb-1">
                          {isAr ? 'الوصف بالعربية' : 'Arabic Description'}
                        </label>
                        <textarea
                          rows={2}
                          value={outcome.desc_ar}
                          onChange={(e) => handleOutcomeChange(idx, 'desc_ar', e.target.value)}
                          className="w-full px-3 py-2 bg-surface-card border border-border-subtle rounded-lg text-xs text-content-primary focus:outline-hidden focus:border-brand-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-content-muted mb-1">
                          {isAr ? 'الوصف بالإنجليزية' : 'English Description'}
                        </label>
                        <textarea
                          rows={2}
                          value={outcome.desc_en}
                          onChange={(e) => handleOutcomeChange(idx, 'desc_en', e.target.value)}
                          className="w-full px-3 py-2 bg-surface-card border border-border-subtle rounded-lg text-xs text-content-primary focus:outline-hidden focus:border-brand-gold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveOutcomes}
                disabled={isUpdating}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-gold text-brand-navy font-bold text-sm hover:bg-brand-gold-light transition-colors shadow-xs disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isAr ? 'حفظ مخرجات المنهاج' : 'Save Learning Outcomes'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: Modular Parts & Lessons */}
        {activeTab === 'parts' && (
          <div className="space-y-6">
            <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
                <div>
                  <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
                    <Layers className="w-5 h-5 text-brand-gold" />
                    <span>{isAr ? 'الأجزاء والدروس التدريبية' : 'Modular Course Parts & Lessons'}</span>
                  </h2>
                  <p className="text-xs text-content-muted mt-0.5">
                    {isAr
                      ? 'يمكنك هنا إضافة الدروس، إدارة روابط الفيديو و ملفات الـ PDF، وضبط نموذج الوصول (معاينة مجانية مقابل اشتراك).'
                      : 'Manage modular parts, video/PDF resources, and configure Free Preview vs. Subscription Access.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddPart}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs hover:bg-brand-gold-light transition-colors shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'إضافة جزء تدريبي جديد' : 'Add New Part'}</span>
                </button>
              </div>

              {/* Parts List */}
              {(!course.parts || course.parts.length === 0) ? (
                <div className="p-12 text-center border-2 border-dashed border-border-subtle rounded-2xl space-y-3">
                  <Layers className="w-8 h-8 text-content-muted mx-auto" />
                  <p className="text-sm font-semibold text-content-secondary">
                    {isAr ? 'لا توجد أجزاء تدريبية في هذه الدورة حتى الآن.' : 'No training parts added yet.'}
                  </p>
                  <button
                    onClick={handleOpenAddPart}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة الجزء الأول الآن' : 'Add First Part Now'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {course.parts.map((part, index) => {
                    const isFirst = index === 0;
                    const isLast = index === course.parts!.length - 1;

                    return (
                      <div
                        key={part.id}
                        className="p-4 bg-surface-elevated/40 border border-border-subtle rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-gold/30 transition-colors"
                      >
                        {/* Left Info */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Part order badge & buttons */}
                          <div className="flex flex-col items-center gap-1">
                            <span className="w-7 h-7 rounded-xl bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-black flex items-center justify-center shrink-0">
                              {part.part_number}
                            </span>
                            <div className="flex flex-col -space-y-1">
                              <button
                                disabled={isFirst || isReorderingParts}
                                onClick={() => handleMovePart(index, 'up')}
                                className="p-0.5 text-content-muted hover:text-brand-gold disabled:opacity-20"
                                title={isAr ? 'تحريك للأعلى' : 'Move Up'}
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={isLast || isReorderingParts}
                                onClick={() => handleMovePart(index, 'down')}
                                className="p-0.5 text-content-muted hover:text-brand-gold disabled:opacity-20"
                                title={isAr ? 'تحريك للأسفل' : 'Move Down'}
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Free vs Subscription badge */}
                              {part.is_free ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <PlayCircle className="w-3 h-3" />
                                  <span>{isAr ? 'معاينة مجانية' : 'Free Preview'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-navy/60 text-content-secondary border border-border-subtle">
                                  <Lock className="w-3 h-3 text-brand-gold" />
                                  <span>{isAr ? 'يتطلب اشتراكاً' : 'Subscription Required'}</span>
                                </span>
                              )}

                              <span className="text-[11px] text-content-muted font-mono">
                                {part.duration_minutes} {isAr ? 'دقيقة' : 'min'}
                              </span>

                              {!part.is_free && (
                                <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                                  <Ticket className="w-3 h-3" />
                                  <span>
                                    {part.part_promotional_tickets} {isAr ? 'تذكرة' : 'ticket'}
                                  </span>
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-content-primary leading-snug">
                              {isAr ? part.title_ar : part.title_en}
                            </h3>

                            {/* Media indicators */}
                            <div className="flex items-center gap-3 pt-1 text-xs">
                              {part.video_url ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400">
                                  <Video className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'فيديو مخصص' : 'Video configured'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-content-muted">
                                  <Video className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'الفيديو الافتراضي' : 'Default video'}</span>
                                </span>
                              )}

                              {part.pdf_url ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'ملف PDF متاح' : 'PDF attached'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-content-muted">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'بدون PDF' : 'No PDF'}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <button
                            onClick={() => handleOpenEditPart(part)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-bold text-brand-gold transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تعديل والوسائط' : 'Edit & Media'}</span>
                          </button>

                          <button
                            onClick={() => setPartToDelete(part)}
                            className="p-1.5 rounded-xl bg-surface-elevated hover:bg-rose-500/10 border border-border-subtle text-content-muted hover:text-rose-400 transition-colors"
                            title={isAr ? 'حذف أو أرشفة الجزء' : 'Delete/Archive Part'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: Add/Edit Part */}
        {isPartModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface-card border border-border-subtle rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-gold" />
                  <span>
                    {editingPart
                      ? isAr
                        ? `تعديل الجزء #${editingPart.part_number}`
                        : `Edit Part #${editingPart.part_number}`
                      : isAr
                      ? 'إضافة جزء تدريبي جديد'
                      : 'Add New Training Part'}
                  </span>
                </h3>
                <button
                  onClick={() => setIsPartModalOpen(false)}
                  className="text-content-muted hover:text-content-primary p-1 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePart} className="space-y-4">
                {/* Titles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      {isAr ? 'عنوان الجزء (بالعربية) *' : 'Part Title (Arabic) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={partTitleAr}
                      onChange={(e) => setPartTitleAr(e.target.value)}
                      placeholder="مثال: الجزء الأول: تشخيص عيوب الطلاء"
                      className="w-full px-3 py-2 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      {isAr ? 'عنوان الجزء (بالإنجليزية)' : 'Part Title (English)'}
                    </label>
                    <input
                      type="text"
                      value={partTitleEn}
                      onChange={(e) => setPartTitleEn(e.target.value)}
                      placeholder="e.g. Part 1: Paint Defect Diagnostics"
                      className="w-full px-3 py-2 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-brand-gold"
                    />
                  </div>
                </div>

                {/* Duration & Access Model Switch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      {isAr ? 'المدة التقديرية (بالدقائق)' : 'Duration (Minutes)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={partDuration}
                      onChange={(e) => setPartDuration(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary focus:outline-hidden focus:border-brand-gold"
                    />
                  </div>

                  {/* Free vs Subscription Toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      {isAr ? 'نموذج الوصول (مجاني أم اشتراك)' : 'Access Control Model'}
                    </label>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={partIsFree}
                          onChange={(e) => setPartIsFree(e.target.checked)}
                          className="w-4 h-4 rounded border-border-subtle accent-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-emerald-400">
                          {isAr ? 'معاينة مجانية للمتعلمين (Free Preview)' : 'Free Preview for all learners'}
                        </span>
                      </label>
                    </div>
                    <span className="text-[11px] text-content-muted mt-1 block">
                      {partIsFree
                        ? isAr
                          ? 'يمكن لأي مستخدم مشاهدة هذا الدرس وتحميل موارده بدون دفع.'
                          : 'Any user can stream and view this lesson without an active subscription.'
                        : isAr
                        ? 'محمي ومتاح فقط للطلاب المشتركين في الدورة.'
                        : 'Requires active course enrollment or subscription.'}
                    </span>
                  </div>
                </div>

                {/* Single Part Purchase Options */}
                {!partIsFree && (
                  <div className="p-3 bg-surface-elevated/40 border border-border-subtle rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-content-muted mb-1">
                        {isAr ? 'سعر شراء هذا الجزء منفرداً ($)' : 'Single Part Price ($)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={partPriceDollars}
                        onChange={(e) => setPartPriceDollars(e.target.value)}
                        className="w-full px-3 py-1.5 bg-surface-card border border-border-subtle rounded-lg text-xs font-bold text-content-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-content-muted mb-1">
                        {isAr ? 'تذاكر السحب الترويجية عند شراء الجزء' : 'Raffle Tickets upon part purchase'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={partTickets}
                        onChange={(e) => setPartTickets(e.target.value)}
                        className="w-full px-3 py-1.5 bg-surface-card border border-border-subtle rounded-lg text-xs font-bold text-amber-400"
                      />
                    </div>
                  </div>
                )}

                {/* Video Resource */}
                <div className="p-4 bg-surface-elevated/30 border border-border-subtle rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-content-primary">
                    <Video className="w-4 h-4 text-brand-gold" />
                    <span>{isAr ? 'إدارة الفيديو والتشغيل المحمي' : 'Video Resource Management'}</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-content-muted mb-1">
                      {isAr ? 'رابط الفيديو المخصص (Video URL / HLS / MP4)' : 'Custom Video URL'}
                    </label>
                    <input
                      type="text"
                      value={partVideoUrl}
                      onChange={(e) => setPartVideoUrl(e.target.value)}
                      placeholder="https://... أو مسار التخزين الداخلي"
                      className="w-full px-3 py-2 bg-surface-card border border-border-subtle rounded-lg text-xs font-mono text-content-primary focus:outline-hidden focus:border-brand-gold"
                    />
                    <span className="text-[10px] text-content-muted mt-1 block">
                      {isAr
                        ? 'إذا ترك فارغاً، سيتم تشغيل فيديو المسار الافتراضي المحدد للمنهاج.'
                        : 'If empty, default course video stream is used.'}
                    </span>
                  </div>
                </div>

                {/* PDF Resource */}
                <div className="p-4 bg-surface-elevated/30 border border-border-subtle rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-content-primary">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>{isAr ? 'ملف الـ PDF المرفق للدرس' : 'PDF Study Guide / Syllabus'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-content-muted mb-1">
                        {isAr ? 'عنوان ملف الـ PDF (بالعربية)' : 'PDF Title (Arabic)'}
                      </label>
                      <input
                        type="text"
                        value={partPdfTitleAr}
                        onChange={(e) => setPartPdfTitleAr(e.target.value)}
                        placeholder="دليل تشخيص عيوب الطلاء.pdf"
                        className="w-full px-3 py-1.5 bg-surface-card border border-border-subtle rounded-lg text-xs text-content-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-content-muted mb-1">
                        {isAr ? 'عنوان ملف الـ PDF (بالإنجليزية)' : 'PDF Title (English)'}
                      </label>
                      <input
                        type="text"
                        value={partPdfTitleEn}
                        onChange={(e) => setPartPdfTitleEn(e.target.value)}
                        placeholder="Defect_Diagnostics_Guide.pdf"
                        className="w-full px-3 py-1.5 bg-surface-card border border-border-subtle rounded-lg text-xs text-content-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-content-muted mb-1">
                      {isAr ? 'رابط ملف الـ PDF' : 'PDF Document URL'}
                    </label>
                    <input
                      type="text"
                      value={partPdfUrl}
                      onChange={(e) => setPartPdfUrl(e.target.value)}
                      placeholder="https://... أو مسار التخزين"
                      className="w-full px-3 py-2 bg-surface-card border border-border-subtle rounded-lg text-xs font-mono text-content-primary focus:outline-hidden focus:border-brand-gold"
                    />
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setIsPartModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-bold text-content-secondary"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={isCreatingPart || isUpdatingPart}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs hover:bg-brand-gold-light transition-colors shadow-xs disabled:opacity-50"
                  >
                    {(isCreatingPart || isUpdatingPart) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{isAr ? 'حفظ بيانات الجزء' : 'Save Part'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Course Confirm Dialog */}
        <ConfirmDialog
          isOpen={isDeleteCourseOpen}
          title={isAr ? 'أرشفة أو حذف الدورة' : 'Archive or Delete Course'}
          description={
            isAr
              ? `هل أنت متأكد من حذف الدورة "${course.title_ar}"؟ إذا كان هناك طلاب مشتركون أو سجلات شراء سابقة، فسيتم إلغاء تفعيل الدورة وأرشفتها لحماية تقدم الطلاب ومنع فقدان البيانات.`
              : `Are you sure you want to delete "${course.title_en}"? If active student enrollments exist, it will be safely deactivated and archived.`
          }
          confirmText={isAr ? 'تأكيد الحذف / الأرشفة' : 'Confirm Archive / Delete'}
          cancelText={isAr ? 'إلغاء' : 'Cancel'}
          isDestructive={true}
          isLoading={isDeleting}
          onConfirm={handleDeleteCourse}
          onClose={() => setIsDeleteCourseOpen(false)}
        />

        {/* Delete Part Confirm Dialog */}
        <ConfirmDialog
          isOpen={!!partToDelete}
          title={isAr ? 'حذف أو تعطيل الجزء التدريبي' : 'Archive or Remove Training Part'}
          description={
            isAr
              ? `هل أنت متأكد من حذف "${partToDelete?.title_ar}"؟ إذا كان هناك طلاب بدأوا دراسة هذا الجزء، فسيتم إيقافه وأرشفته بأمان لحماية سجلات إنجازات الطلاب.`
              : `Are you sure you want to remove "${partToDelete?.title_en}"? If student progress exists, it will be deactivated and archived.`
          }
          confirmText={isAr ? 'تأكيد الحذف / الأرشفة' : 'Confirm'}
          cancelText={isAr ? 'إلغاء' : 'Cancel'}
          isDestructive={true}
          isLoading={isDeletingPart}
          onConfirm={handleDeletePart}
          onClose={() => setPartToDelete(null)}
        />
      </div>
    </AdminGuard>
  );
}
