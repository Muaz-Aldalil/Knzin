'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert, ArrowLeft, ArrowRight, X, RotateCcw } from 'lucide-react';
import QuizStep from './QuizStep';
import PersonalizationBadge from './PersonalizationBadge';

export interface QuizAnswers {
  experience_level: string;
  learning_goal: string;
  weekly_hours: string;
}

interface AntiPiracyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (answers: QuizAnswers) => void;
  initialAnswers?: QuizAnswers | null;
  userEmail?: string;
}

export default function AntiPiracyModal({
  isOpen,
  onClose,
  onComplete,
  initialAnswers,
  userEmail,
}: AntiPiracyModalProps) {
  const t = useTranslations('quiz');

  const [step, setStep] = useState<number>(1);
  const [experienceLevel, setExperienceLevel] = useState<string>(
    initialAnswers?.experience_level || 'beginner'
  );
  const [learningGoal, setLearningGoal] = useState<string>(
    initialAnswers?.learning_goal || 'launch_workshop'
  );
  const [weeklyHours, setWeeklyHours] = useState<string>(
    initialAnswers?.weekly_hours || '6_to_10'
  );

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
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

  const handleReset = () => {
    setStep(1);
    setExperienceLevel('beginner');
    setLearningGoal('launch_workshop');
    setWeeklyHours('6_to_10');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-start mb-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة الاختبار</span>
            </button>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('step', { current: step, total: 3 })}</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-3">
            {t('title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('subtitle')}
          </p>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <QuizStep
            question={t('q1')}
            options={[
              { id: 'beginner', label: t('q1_opt1') },
              { id: 'intermediate', label: t('q1_opt2') },
              { id: 'advanced', label: t('q1_opt3') },
            ]}
            selectedValue={experienceLevel}
            onSelect={setExperienceLevel}
          />
        )}

        {/* Step 2 */}
        {step === 2 && (
          <QuizStep
            question={t('q2')}
            options={[
              { id: 'launch_workshop', label: t('q2_opt1') },
              { id: 'job_placement', label: t('q2_opt2') },
              { id: 'freelancing', label: t('q2_opt3') },
            ]}
            selectedValue={learningGoal}
            onSelect={setLearningGoal}
          />
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <QuizStep
              question={t('q3')}
              options={[
                { id: '2_to_5', label: t('q3_opt1') },
                { id: '6_to_10', label: t('q3_opt2') },
                { id: 'more_than_10', label: t('q3_opt3') },
              ]}
              selectedValue={weeklyHours}
              onSelect={setWeeklyHours}
            />

            <PersonalizationBadge email={userEmail} className="mt-4" />
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
