'use client';

import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, getInitials } from '@/lib/utils';

const avatarVariants = cva(
  [
    'relative inline-flex shrink-0 overflow-hidden rounded-full',
    'bg-neutral-100 dark:bg-neutral-800',
  ],
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-14 w-14 text-lg',
        '2xl': 'h-20 w-20 text-xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const statusVariants = cva(
  'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-neutral-900',
  {
    variants: {
      status: {
        online: 'bg-success-500',
        offline: 'bg-neutral-400',
        busy: 'bg-error-500',
        away: 'bg-warning-500',
      },
      size: {
        xs: 'h-1.5 w-1.5',
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
        xl: 'h-3.5 w-3.5',
        '2xl': 'h-4 w-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt: string;
  fallback?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const Avatar: React.FC<AvatarProps> = ({
  className,
  size,
  src,
  alt,
  fallback,
  status,
  ...props
}) => {
  const initials = fallback || getInitials(alt);

  return (
    <AvatarPrimitive.Root
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      <AvatarPrimitive.Image
        src={src}
        alt={alt}
        className="aspect-square h-full w-full object-cover"
      />
      <AvatarPrimitive.Fallback
        className={cn(
          'flex h-full w-full items-center justify-center',
          'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300',
          'font-medium'
        )}
        delayMs={600}
      >
        {initials}
      </AvatarPrimitive.Fallback>
      {status && (
        <span className={cn(statusVariants({ status, size }))} aria-hidden="true" />
      )}
    </AvatarPrimitive.Root>
  );
};

Avatar.displayName = 'Avatar';

// Avatar Group Component
interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    alt: string;
    fallback?: string;
  }>;
  max?: number;
  size?: VariantProps<typeof avatarVariants>['size'];
  className?: string;
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 4,
  size = 'md',
  className,
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          alt={avatar.alt}
          fallback={avatar.fallback}
          size={size}
          className="ring-2 ring-white dark:ring-neutral-900"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            avatarVariants({ size }),
            'flex items-center justify-center',
            'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
            'ring-2 ring-white dark:ring-neutral-900',
            'font-medium'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarGroup, avatarVariants };
