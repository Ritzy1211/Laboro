/**
 * Component-specific type definitions
 */

import { ReactNode } from 'react';
import type { UserRole, Priority, JobStatus, TaskStatus, SkillLevel, NotificationType } from './index';

// Common Component Props
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

export interface WithLoadingProps {
  isLoading?: boolean;
}

export interface WithErrorProps {
  error?: string | null;
}

// Button Component Types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

// Input Component Types
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends BaseComponentProps {
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  size?: InputSize;
  disabled?: boolean;
  required?: boolean;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
}

// Modal & Drawer Types
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

export interface DrawerProps extends ModalProps {
  position?: DrawerPosition;
}

// Navigation Types
export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  badge?: string | number;
  children?: NavItem[];
  roles?: UserRole[];
  disabled?: boolean;
}

export interface SidebarSection {
  id: string;
  title?: string;
  items: NavItem[];
  roles?: UserRole[];
}

// Table Types
export interface TableColumn<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectedRows?: string[];
  onSelectionChange?: (ids: string[]) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnId: string) => void;
}

// Badge & Tag Types
export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';

export interface BadgeProps extends BaseComponentProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

// Avatar Types
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt: string;
  size?: AvatarSize;
  fallback?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

// Skill Tag Types
export interface SkillTagProps extends BaseComponentProps {
  name: string;
  level?: SkillLevel;
  verified?: boolean;
  endorsements?: number;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}

// Reliability Score Types
export interface ReliabilityScoreProps extends BaseComponentProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  breakdown?: {
    onTime: number;
    quality: number;
    communication: number;
    completion: number;
  };
}

// Time Zone Types
export interface TimeZoneDisplayProps extends BaseComponentProps {
  timezone: string;
  showOffset?: boolean;
  showTime?: boolean;
  format?: '12h' | '24h';
}

export interface TimeZoneOverlapProps extends BaseComponentProps {
  timezones: string[];
  highlightOverlap?: boolean;
  workingHoursStart?: number;
  workingHoursEnd?: number;
}

// Availability Scheduler Types
export interface AvailabilitySchedulerProps extends BaseComponentProps {
  value: {
    timezone: string;
    schedule: {
      day: string;
      enabled: boolean;
      slots: { start: string; end: string }[];
    }[];
  };
  onChange: (schedule: AvailabilitySchedulerProps['value']) => void;
  readOnly?: boolean;
  showTimezone?: boolean;
}

// Notification Types (Component)
export interface ToastProps {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Status Badge Mapping
export const statusVariantMap: Record<JobStatus | TaskStatus, BadgeVariant> = {
  draft: 'default',
  open: 'info',
  in_progress: 'warning',
  review: 'brand',
  completed: 'success',
  cancelled: 'error',
  todo: 'default',
  done: 'success',
};

export const priorityVariantMap: Record<Priority, BadgeVariant> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

// Form Types
export interface FormFieldProps {
  name: string;
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

// Pagination Types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  siblingsCount?: number;
}

// Empty State Types
export interface EmptyStateProps extends BaseComponentProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Stats Card Types
export interface StatCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}
