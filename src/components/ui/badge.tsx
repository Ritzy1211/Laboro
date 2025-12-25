'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1',
    'font-medium',
    'rounded-full',
    'transition-colors duration-150',
  ],
  {
    variants: {
      variant: {
        default: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
        success: 'bg-success-50 dark:bg-success-700/20 text-success-700 dark:text-success-400',
        warning: 'bg-warning-50 dark:bg-warning-700/20 text-warning-700 dark:text-warning-400',
        error: 'bg-error-50 dark:bg-error-700/20 text-error-700 dark:text-error-400',
        info: 'bg-info-50 dark:bg-info-700/20 text-info-700 dark:text-info-400',
        brand: 'bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-400',
        outline: 'bg-transparent border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  size,
  dot = false,
  removable = false,
  onRemove,
  children,
  ...props
}) => {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-success-500',
            variant === 'warning' && 'bg-warning-500',
            variant === 'error' && 'bg-error-500',
            variant === 'info' && 'bg-info-500',
            variant === 'brand' && 'bg-brand-500',
            (variant === 'default' || variant === 'outline') && 'bg-neutral-500'
          )}
        />
      )}
      {children}
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 -mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
          aria-label="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
