'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore, selectToasts } from '@/stores';
import type { NotificationType } from '@/types';

const toastIcons: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-success-500" />,
  error: <AlertCircle className="h-5 w-5 text-error-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning-500" />,
  info: <Info className="h-5 w-5 text-info-500" />,
  job: <Info className="h-5 w-5 text-brand-500" />,
  payment: <Info className="h-5 w-5 text-success-500" />,
  system: <Info className="h-5 w-5 text-neutral-500" />,
};

const toastStyles: Record<NotificationType, string> = {
  success: 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-950',
  error: 'border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-950',
  warning: 'border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-950',
  info: 'border-info-200 dark:border-info-800 bg-info-50 dark:bg-info-950',
  job: 'border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950',
  payment: 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-950',
  system: 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900',
};

const ToastContainer: React.FC = () => {
  const toasts = useNotificationStore(selectToasts);
  const dismissToast = useNotificationStore((state) => state.dismissToast);

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'pointer-events-auto',
              'w-full max-w-sm',
              'rounded-lg border shadow-lg',
              'p-4',
              toastStyles[toast.type]
            )}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0">{toastIcons[toast.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {toast.message}
                  </p>
                )}
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className="mt-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className={cn(
                  'shrink-0 rounded-md p-1 -mr-1 -mt-1',
                  'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300',
                  'hover:bg-black/5 dark:hover:bg-white/5',
                  'transition-colors duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500'
                )}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

ToastContainer.displayName = 'ToastContainer';

export { ToastContainer };
