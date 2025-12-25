'use client';

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  [
    'w-full',
    'bg-white dark:bg-neutral-900',
    'border border-neutral-300 dark:border-neutral-700',
    'text-neutral-900 dark:text-neutral-100',
    'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50 dark:disabled:bg-neutral-800',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-3.5 text-sm rounded-lg',
        lg: 'h-12 px-4 text-base rounded-lg',
      },
      hasError: {
        true: 'border-error-500 focus:ring-error-500',
      },
      hasLeftElement: {
        true: 'pl-10',
      },
      hasRightElement: {
        true: 'pr-10',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      size,
      label,
      error,
      hint,
      leftElement,
      rightElement,
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftElement && (
            <div className="absolute left-0 top-0 h-full flex items-center pl-3 pointer-events-none text-neutral-400">
              {leftElement}
            </div>
          )}
          
          <input
            type={type}
            id={inputId}
            ref={ref}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            className={cn(
              inputVariants({
                size,
                hasError,
                hasLeftElement: !!leftElement,
                hasRightElement: !!rightElement,
              }),
              className
            )}
            {...props}
          />
          
          {rightElement && (
            <div className="absolute right-0 top-0 h-full flex items-center pr-3 text-neutral-400">
              {rightElement}
            </div>
          )}
        </div>

        {(error || hint) && (
          <p
            id={error ? `${inputId}-error` : `${inputId}-hint`}
            className={cn(
              'mt-1.5 text-sm',
              error ? 'text-error-600 dark:text-error-400' : 'text-neutral-500'
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
