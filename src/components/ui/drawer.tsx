'use client';

import React, { Fragment } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const drawerVariants = cva(
  [
    'fixed z-50 bg-white dark:bg-neutral-900',
    'shadow-xl border-neutral-200 dark:border-neutral-800',
    'flex flex-col',
    'focus:outline-none',
  ],
  {
    variants: {
      position: {
        left: 'inset-y-0 left-0 border-r w-full max-w-sm',
        right: 'inset-y-0 right-0 border-l w-full max-w-sm',
        top: 'inset-x-0 top-0 border-b h-auto max-h-[80vh]',
        bottom: 'inset-x-0 bottom-0 border-t h-auto max-h-[80vh]',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
        xl: '',
        full: '',
      },
    },
    compoundVariants: [
      // Left/Right drawers
      { position: 'left', size: 'sm', className: 'max-w-xs' },
      { position: 'left', size: 'md', className: 'max-w-sm' },
      { position: 'left', size: 'lg', className: 'max-w-md' },
      { position: 'left', size: 'xl', className: 'max-w-lg' },
      { position: 'left', size: 'full', className: 'max-w-full' },
      { position: 'right', size: 'sm', className: 'max-w-xs' },
      { position: 'right', size: 'md', className: 'max-w-sm' },
      { position: 'right', size: 'lg', className: 'max-w-md' },
      { position: 'right', size: 'xl', className: 'max-w-lg' },
      { position: 'right', size: 'full', className: 'max-w-full' },
      // Top/Bottom drawers
      { position: 'top', size: 'sm', className: 'max-h-[30vh]' },
      { position: 'top', size: 'md', className: 'max-h-[50vh]' },
      { position: 'top', size: 'lg', className: 'max-h-[70vh]' },
      { position: 'top', size: 'xl', className: 'max-h-[80vh]' },
      { position: 'top', size: 'full', className: 'max-h-screen' },
      { position: 'bottom', size: 'sm', className: 'max-h-[30vh]' },
      { position: 'bottom', size: 'md', className: 'max-h-[50vh]' },
      { position: 'bottom', size: 'lg', className: 'max-h-[70vh]' },
      { position: 'bottom', size: 'xl', className: 'max-h-[80vh]' },
      { position: 'bottom', size: 'full', className: 'max-h-screen' },
    ],
    defaultVariants: {
      position: 'right',
      size: 'md',
    },
  }
);

const slideAnimations = {
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  },
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  },
  top: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
  },
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
};

interface DrawerProps extends VariantProps<typeof drawerVariants> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  children: React.ReactNode;
  className?: string;
}

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  position = 'right',
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  children,
  className,
}) => {
  const animation = slideAnimations[position || 'right'];

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
                initial={animation.initial}
                animate={animation.animate}
                exit={animation.exit}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className={cn(drawerVariants({ position, size }), className)}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-start justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
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
                            'rounded-lg p-2 -mr-2',
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
                <div className="flex-1 overflow-y-auto p-4">{children}</div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
};

Drawer.displayName = 'Drawer';

// Drawer Footer Component
interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

const DrawerFooter: React.FC<DrawerFooterProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 p-4',
        'border-t border-neutral-200 dark:border-neutral-800',
        'bg-neutral-50 dark:bg-neutral-900/50',
        'shrink-0',
        className
      )}
    >
      {children}
    </div>
  );
};

DrawerFooter.displayName = 'DrawerFooter';

export { Drawer, DrawerFooter, drawerVariants };
