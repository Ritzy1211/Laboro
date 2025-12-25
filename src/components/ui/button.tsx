'use client';

import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium text-sm',
    'rounded-lg',
    'transition-all duration-200 ease-enterprise',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-brand-600 text-white',
          'hover:bg-brand-700',
          'active:bg-brand-800',
          'shadow-sm',
        ],
        secondary: [
          'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
          'border border-neutral-200 dark:border-neutral-700',
          'hover:bg-neutral-50 dark:hover:bg-neutral-700',
          'shadow-sm',
        ],
        ghost: [
          'bg-transparent text-neutral-600 dark:text-neutral-400',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
          'hover:text-neutral-900 dark:hover:text-neutral-100',
        ],
        danger: [
          'bg-error-600 text-white',
          'hover:bg-error-700',
          'active:bg-error-700',
          'shadow-sm',
        ],
        success: [
          'bg-success-600 text-white',
          'hover:bg-success-700',
          'active:bg-success-700',
          'shadow-sm',
        ],
        link: [
          'bg-transparent text-brand-600 dark:text-brand-400',
          'hover:text-brand-700 dark:hover:text-brand-300',
          'hover:underline underline-offset-4',
          'p-0 h-auto',
        ],
        outline: [
          'bg-transparent text-brand-600 dark:text-brand-400',
          'border-2 border-brand-600 dark:border-brand-400',
          'hover:bg-brand-50 dark:hover:bg-brand-950',
        ],
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md',
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-base',
        xl: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
