'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, ShieldAlert, Award, ArrowLeft, ArrowRight, X } from 'lucide-react';

export interface QuizAnswers {
  experience_level: string;
  learning_goal: string;
  weekly_hours: string;
}

interface AntiPiracyQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (answers: QuizAnswers) => void;
  initialAnswers?: QuizAnswers | null;
}

export default function AntiPiracyQuizModal({
  isOpen,
  onClose,
  onComplete,
  initialAnswers,
}: AntiPiracyQuizModalProps) {
  const t = useTranslations('quiz');
  const [step, setStep] = useState<number>(1);
  const [experienceLevel, setExperienceLevel] = useState<string>(initialAnswers?.experience_level || 'beginner');
  const [learningGoal, setLearningGoal] = useState<string>(initialAnswers?.learning_goal || 'launch_workshop');
  const [weeklyHours, setWeeklyHours] = useState<string>(initialAnswers?.weekly_hours || '6_to_10');
  const [isFinished, setIsFinished] = useState<boolean>(!!initialAnswers);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsFinished(true);
      onComplete({
        experience_level: experienceLevel,
        learning_goal: learningGoal,
        weekly_hours: weeklyHours,
      });
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Close Button (Logical End Corner) */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Pinned Header */}
        <div className="p-6 pb-2 shrink-0 text-start">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-light text-primary text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-primary" />
            <span>{t('step', { current: step, total: 3 })}</span>
          </div>
          <h3 className="text-lg font-bold text-secondary dark:text-white">
            {t('title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('subtitle')}
          </p>
        </div>

        {/* Scrollable Questions Area */}
        <div className="px-6 py-2 overflow-y-auto flex-1">
          {/* Step 1: Experience Level */}
          {step === 1 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block text-start">
                {t('q1')}
              </label>
              <div className="space-y-2">
                {[
                  { id: 'beginner', label: t('q1_opt1') },
                  { id: 'intermediate', label: t('q1_opt2') },
                  { id: 'advanced', label: t('q1_opt3') },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExperienceLevel(opt.id)}
                    className={`w-full text-start p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                      experienceLevel === opt.id
                        ? 'border-primary bg-primary-light/60 dark:bg-blue-950/40 text-primary dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {experienceLevel === opt.id && (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Learning Goal */}
          {step === 2 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block text-start">
                {t('q2')}
              </label>
              <div className="space-y-2">
                {[
                  { id: 'launch_workshop', label: t('q2_opt1') },
                  { id: 'job_placement', label: t('q2_opt2') },
                  { id: 'freelancing', label: t('q2_opt3') },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLearningGoal(opt.id)}
                    className={`w-full text-start p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                      learningGoal === opt.id
                        ? 'border-primary bg-primary-light/60 dark:bg-blue-950/40 text-primary dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {learningGoal === opt.id && (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Weekly Commitment */}
          {step === 3 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block text-start">
                {t('q3')}
              </label>
              <div className="space-y-2">
                {[
                  { id: '2_to_5', label: t('q3_opt1') },
                  { id: '6_to_10', label: t('q3_opt2') },
                  { id: 'more_than_10', label: t('q3_opt3') },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setWeeklyHours(opt.id)}
                    className={`w-full text-start p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                      weeklyHours === opt.id
                        ? 'border-primary bg-primary-light/60 dark:bg-blue-950/40 text-primary dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {weeklyHours === opt.id && (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Watermark preview badge */}
              <div className="mt-4 p-3 rounded-lg bg-success-light text-emerald-900 border border-success/30 flex items-center gap-2 text-xs">
                <Award className="w-4 h-4 text-success shrink-0" />
                <span className="font-semibold">{t('watermarkStamp')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Action Controls */}
        <div className="p-6 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
              <span>{t('prev')}</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/25 transition-all active:scale-95"
          >
            <span>{step === 3 ? t('submit') : t('next')}</span>
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
