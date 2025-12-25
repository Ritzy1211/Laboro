'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl',
        // Variants
        variant === 'default' && 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-card',
        variant === 'elevated' && 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-elevated',
        variant === 'bordered' && 'bg-transparent border border-neutral-200 dark:border-neutral-800',
        variant === 'ghost' && 'bg-neutral-50 dark:bg-neutral-900/50',
        // Padding
        padding === 'sm' && 'p-4',
        padding === 'md' && 'p-6',
        padding === 'lg' && 'p-8',
        // Hover
        hoverable && 'transition-shadow duration-200 hover:shadow-lg cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

Card.displayName = 'Card';

// Card Header
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  title,
  description,
  action,
  ...props
}) => {
  return (
    <div
      className={cn('flex items-start justify-between mb-4', className)}
      {...props}
    >
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

// Card Content
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent: React.FC<CardContentProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
};

CardContent.displayName = 'CardContent';

// Card Footer
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

const CardFooter: React.FC<CardFooterProps> = ({
  className,
  bordered = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 mt-4',
        bordered && 'pt-4 border-t border-neutral-200 dark:border-neutral-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

CardFooter.displayName = 'CardFooter';

// Stat Card for dashboards
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  className,
}) => {
  return (
    <Card className={cn('relative', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
            {value}
          </p>
          {change && (
            <p
              className={cn(
                'mt-2 text-sm font-medium flex items-center gap-1',
                change.type === 'increase'
                  ? 'text-success-600 dark:text-success-400'
                  : 'text-error-600 dark:text-error-400'
              )}
            >
              <span>
                {change.type === 'increase' ? '↑' : '↓'} {Math.abs(change.value)}%
              </span>
              <span className="text-neutral-500 dark:text-neutral-400 font-normal">
                vs last period
              </span>
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

StatCard.displayName = 'StatCard';

export { Card, CardHeader, CardContent, CardFooter, StatCard };
