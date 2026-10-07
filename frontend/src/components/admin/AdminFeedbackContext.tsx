'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { FeedbackDialog, FeedbackType } from './FeedbackDialog';

export interface FeedbackOptions {
  type: FeedbackType;
  title?: string;
  message: string;
  confirmText?: string;
  onClose?: () => void;
}

interface AdminFeedbackContextType {
  showFeedback: (options: FeedbackOptions) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  closeFeedback: () => void;
}

const AdminFeedbackContext = createContext<AdminFeedbackContextType | null>(null);

export function AdminFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: FeedbackType;
    title?: string;
    message: string;
    confirmText?: string;
    callback?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    message: '',
  });

  const showFeedback = useCallback((options: FeedbackOptions) => {
    setDialogState({
      isOpen: true,
      type: options.type,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      callback: options.onClose,
    });
  }, []);

  const closeFeedback = useCallback(() => {
    setDialogState((prev) => {
      if (prev.callback) {
        prev.callback();
      }
      return { ...prev, isOpen: false, callback: undefined };
    });
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showFeedback({ type: 'success', message, title });
  }, [showFeedback]);

  const showError = useCallback((message: string, title?: string) => {
    showFeedback({ type: 'error', message, title });
  }, [showFeedback]);

  const showWarning = useCallback((message: string, title?: string) => {
    showFeedback({ type: 'warning', message, title });
  }, [showFeedback]);

  const showInfo = useCallback((message: string, title?: string) => {
    showFeedback({ type: 'info', message, title });
  }, [showFeedback]);

  return (
    <AdminFeedbackContext.Provider
      value={{
        showFeedback,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        closeFeedback,
      }}
    >
      {children}
      <FeedbackDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        onClose={closeFeedback}
      />
    </AdminFeedbackContext.Provider>
  );
}

export function useAdminFeedback() {
  const context = useContext(AdminFeedbackContext);
  if (!context) {
    throw new Error('useAdminFeedback must be used within an AdminFeedbackProvider');
  }
  return context;
}
