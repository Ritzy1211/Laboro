'use client';

import React from 'react';
import { Check, Award, Star } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { SkillLevel } from '@/types';

const skillTagVariants = cva(
  [
    'inline-flex items-center gap-1.5',
    'px-2.5 py-1',
    'text-sm font-medium',
    'rounded-lg',
    'border',
    'transition-all duration-150',
  ],
  {
    variants: {
      level: {
        beginner: 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300',
        intermediate: 'bg-info-50 dark:bg-info-950/50 border-info-200 dark:border-info-800 text-info-700 dark:text-info-300',
        advanced: 'bg-brand-50 dark:bg-brand-950/50 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300',
        expert: 'bg-warning-50 dark:bg-warning-950/50 border-warning-200 dark:border-warning-800 text-warning-700 dark:text-warning-300',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-sm',
        false: '',
      },
    },
    defaultVariants: {
      level: 'intermediate',
      interactive: false,
    },
  }
);

const levelIcons: Record<SkillLevel, React.ReactNode> = {
  beginner: null,
  intermediate: <Star className="h-3.5 w-3.5" />,
  advanced: <Star className="h-3.5 w-3.5 fill-current" />,
  expert: <Award className="h-3.5 w-3.5" />,
};

interface SkillTagProps extends VariantProps<typeof skillTagVariants> {
  name: string;
  level?: SkillLevel;
  verified?: boolean;
  endorsements?: number;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

const SkillTag: React.FC<SkillTagProps> = ({
  name,
  level = 'intermediate',
  verified = false,
  endorsements,
  removable = false,
  onRemove,
  onClick,
  className,
}) => {
  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      onClick={onClick}
      className={cn(
        skillTagVariants({ level, interactive: !!onClick }),
        className
      )}
    >
      {levelIcons[level]}
      <span>{name}</span>
      {verified && (
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-success-500 text-white">
          <Check className="h-2.5 w-2.5" />
        </span>
      )}
      {endorsements !== undefined && endorsements > 0 && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          +{endorsements}
        </span>
      )}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 -mr-1 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={`Remove ${name}`}
        >
          <span className="sr-only">Remove</span>
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 3l6 6M9 3l-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </Component>
  );
};

SkillTag.displayName = 'SkillTag';

// Skill Tag Group
interface SkillTagGroupProps {
  skills: Array<{
    id: string;
    name: string;
    level?: SkillLevel;
    verified?: boolean;
    endorsements?: number;
  }>;
  max?: number;
  onSkillClick?: (skillId: string) => void;
  className?: string;
}

const SkillTagGroup: React.FC<SkillTagGroupProps> = ({
  skills,
  max = 5,
  onSkillClick,
  className,
}) => {
  const visibleSkills = skills.slice(0, max);
  const remainingCount = skills.length - max;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {visibleSkills.map((skill) => (
        <SkillTag
          key={skill.id}
          name={skill.name}
          level={skill.level}
          verified={skill.verified}
          endorsements={skill.endorsements}
          onClick={onSkillClick ? () => onSkillClick(skill.id) : undefined}
        />
      ))}
      {remainingCount > 0 && (
        <Badge variant="default" size="lg">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
};

SkillTagGroup.displayName = 'SkillTagGroup';

// Skill Level Indicator
interface SkillLevelIndicatorProps {
  level: SkillLevel;
  showLabel?: boolean;
  className?: string;
}

const levelLabels: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

const levelProgress: Record<SkillLevel, number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

const SkillLevelIndicator: React.FC<SkillLevelIndicatorProps> = ({
  level,
  showLabel = true,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              i <= Math.ceil(levelProgress[level] / 25)
                ? level === 'expert'
                  ? 'bg-warning-500'
                  : level === 'advanced'
                  ? 'bg-brand-500'
                  : level === 'intermediate'
                  ? 'bg-info-500'
                  : 'bg-neutral-400'
                : 'bg-neutral-200 dark:bg-neutral-700'
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {levelLabels[level]}
        </span>
      )}
    </div>
  );
};

SkillLevelIndicator.displayName = 'SkillLevelIndicator';

export { SkillTag, SkillTagGroup, SkillLevelIndicator, skillTagVariants };
