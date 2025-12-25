'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

interface ReliabilityBreakdown {
  onTime: number;
  quality: number;
  communication: number;
  completion: number;
}

interface ReliabilityScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  breakdown?: ReliabilityBreakdown;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  className?: string;
}

const sizeClasses = {
  sm: {
    badge: 'h-6 px-2 text-xs',
    star: 'h-3 w-3',
    ring: 'w-14 h-14',
    ringStroke: 3,
  },
  md: {
    badge: 'h-8 px-3 text-sm',
    star: 'h-4 w-4',
    ring: 'w-20 h-20',
    ringStroke: 4,
  },
  lg: {
    badge: 'h-10 px-4 text-base',
    star: 'h-5 w-5',
    ring: 'w-24 h-24',
    ringStroke: 5,
  },
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-success-600 dark:text-success-400';
  if (score >= 75) return 'text-brand-600 dark:text-brand-400';
  if (score >= 60) return 'text-warning-600 dark:text-warning-400';
  return 'text-error-600 dark:text-error-400';
};

const getScoreLabel = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Improvement';
};

const getScoreRingColor = (score: number): string => {
  if (score >= 90) return '#10b981'; // success
  if (score >= 75) return '#5568f2'; // brand
  if (score >= 60) return '#f59e0b'; // warning
  return '#ef4444'; // error
};

const ReliabilityScoreBadge: React.FC<ReliabilityScoreBadgeProps> = ({
  score,
  showLabel = false,
  size = 'md',
  breakdown,
  trend,
  trendValue,
  className,
}) => {
  const classes = sizeClasses[size];
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const badgeContent = (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        'bg-neutral-100 dark:bg-neutral-800',
        getScoreColor(score),
        classes.badge,
        className
      )}
    >
      <Star className={cn(classes.star, 'fill-current')} />
      <span>{score.toFixed(1)}</span>
      {showLabel && (
        <span className="text-neutral-500 dark:text-neutral-400 font-normal">
          / 100
        </span>
      )}
      {trend && (
        <TrendIcon
          className={cn(
            'h-3 w-3',
            trend === 'up' && 'text-success-500',
            trend === 'down' && 'text-error-500',
            trend === 'stable' && 'text-neutral-400'
          )}
        />
      )}
    </div>
  );

  if (!breakdown) {
    return badgeContent;
  }

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{badgeContent}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className={cn(
              'z-50 p-4 w-64',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-800',
              'rounded-lg shadow-lg',
              'animate-in fade-in-0 zoom-in-95'
            )}
            sideOffset={8}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Reliability Score
                </span>
                <span className={cn('text-lg font-bold', getScoreColor(score))}>
                  {score.toFixed(1)}
                </span>
              </div>

              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {getScoreLabel(score)}
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <BreakdownItem label="On-Time Delivery" value={breakdown.onTime} />
                <BreakdownItem label="Work Quality" value={breakdown.quality} />
                <BreakdownItem label="Communication" value={breakdown.communication} />
                <BreakdownItem label="Task Completion" value={breakdown.completion} />
              </div>

              {trend && trendValue !== undefined && (
                <div className="flex items-center gap-1 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <TrendIcon
                    className={cn(
                      'h-3 w-3',
                      trend === 'up' && 'text-success-500',
                      trend === 'down' && 'text-error-500',
                      trend === 'stable' && 'text-neutral-400'
                    )}
                  />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
                    {Math.abs(trendValue)}% from last month
                  </span>
                </div>
              )}
            </div>
            <Tooltip.Arrow className="fill-white dark:fill-neutral-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

// Helper component for breakdown items
const BreakdownItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-neutral-600 dark:text-neutral-400">{label}</span>
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            value >= 90 && 'bg-success-500',
            value >= 75 && value < 90 && 'bg-brand-500',
            value >= 60 && value < 75 && 'bg-warning-500',
            value < 60 && 'bg-error-500'
          )}
        />
      </div>
      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 w-8">
        {value}%
      </span>
    </div>
  </div>
);

ReliabilityScoreBadge.displayName = 'ReliabilityScoreBadge';

// Circular Progress Variant
interface ReliabilityScoreCircleProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const ReliabilityScoreCircle: React.FC<ReliabilityScoreCircleProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className,
}) => {
  const classes = sizeClasses[size];
  const radius = size === 'sm' ? 24 : size === 'md' ? 36 : 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className={cn('relative', classes.ring)}>
        <svg className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={classes.ringStroke}
            className="text-neutral-200 dark:text-neutral-700"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke={getScoreRingColor(score)}
            strokeWidth={classes.ringStroke}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', getScoreColor(score), size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-base')}>
            {score.toFixed(0)}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
};

ReliabilityScoreCircle.displayName = 'ReliabilityScoreCircle';

export { ReliabilityScoreBadge, ReliabilityScoreCircle };
