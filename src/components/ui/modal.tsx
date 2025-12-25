'use client';

import React, { Fragment } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const modalSizeVariants = cva(
  [
    'relative w-full',
    'bg-white dark:bg-neutral-900',
    'rounded-xl shadow-xl',
    'border border-neutral-200 dark:border-neutral-800',
    'max-h-[85vh] overflow-hidden',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

interface ModalProps extends VariantProps<typeof modalSizeVariants> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size,
  showCloseButton = true,
  closeOnOverlayClick = true,
  children,
  className,
}) => {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={closeOnOverlayClick ? onClose : undefined}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                  'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
                  'focus:outline-none',
                  modalSizeVariants({ size }),
                  className
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-start justify-between p-6 pb-0">
                    <div>
                      {title && (
                        <DialogPrimitive.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          {title}
                        </DialogPrimitive.Title>
                      )}
                      {description && (
                        <DialogPrimitive.Description className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          {description}
                        </DialogPrimitive.Description>
                      )}
                    </div>
                    {showCloseButton && (
                      <DialogPrimitive.Close asChild>
                        <button
                          className={cn(
                            'rounded-lg p-2 -mr-2 -mt-2',
                            'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300',
                            'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                            'transition-colors duration-150',
                            'focus:outline-none focus:ring-2 focus:ring-brand-500'
                          )}
                          aria-label="Close"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </DialogPrimitive.Close>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto">{children}</div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
};

Modal.displayName = 'Modal';

// Modal Footer Component
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',
        'pt-4 border-t border-neutral-200 dark:border-neutral-800',
        className
      )}
    >
      {children}
    </div>
  );
};

ModalFooter.displayName = 'ModalFooter';

export { Modal, ModalFooter, modalSizeVariants };
