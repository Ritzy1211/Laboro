/**
 * Core type definitions for LABORO platform
 */

// User & Auth Types
export type UserRole = 'worker' | 'client' | 'enterprise_admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  timezone: string;
  locale: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkerProfile extends User {
  role: 'worker';
  skills: Skill[];
  hourlyRate?: number;
  currency: string;
  availability: AvailabilitySchedule;
  reliabilityScore: number;
  completedJobs: number;
  totalEarnings: number;
  verificationStatus: VerificationStatus;
  bio?: string;
  portfolio?: PortfolioItem[];
}

export interface ClientProfile extends User {
  role: 'client';
  company?: Company;
  jobsPosted: number;
  totalSpent: number;
  paymentMethods: PaymentMethod[];
}

export interface EnterpriseAdmin extends User {
  role: 'enterprise_admin';
  company: Company;
  permissions: Permission[];
  managedTeams: string[];
}

// Company Types
export interface Company {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  size: CompanySize;
  website?: string;
  description?: string;
  verified: boolean;
  createdAt: string;
}

export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

// Skill & Verification Types
export interface Skill {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
  verified: boolean;
  endorsements: number;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface VerificationStatus {
  identity: boolean;
  email: boolean;
  phone: boolean;
  payment: boolean;
  background: boolean;
  skills: string[]; // verified skill IDs
}

// Availability & Scheduling Types
export interface AvailabilitySchedule {
  timezone: string;
  weeklyHours: number;
  schedule: DaySchedule[];
  exceptions: ScheduleException[];
}

export interface DaySchedule {
  day: DayOfWeek;
  enabled: boolean;
  slots: TimeSlot[];
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;   // HH:mm format
}

export interface ScheduleException {
  date: string;
  available: boolean;
  slots?: TimeSlot[];
  reason?: string;
}

// Job & Task Types
export interface Job {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  priority: Priority;
  clientId: string;
  assignedWorkerId?: string;
  requiredSkills: Skill[];
  budget: Budget;
  deadline?: string;
  estimatedHours?: number;
  actualHours?: number;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export type JobStatus = 'draft' | 'open' | 'in_progress' | 'review' | 'completed' | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Budget {
  type: 'fixed' | 'hourly';
  amount: number;
  currency: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface Task {
  id: string;
  jobId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeId?: string;
  dueDate?: string;
  completedAt?: string;
  order: number;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

// Payment & Billing Types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  last4?: string;
  brand?: string;
  isDefault: boolean;
  expiresAt?: string;
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  dueDate: string;
  paidAt?: string;
  items: InvoiceItem[];
  clientId: string;
  workerId: string;
  jobId: string;
  createdAt: string;
}

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing';

// Permission Types
export interface Permission {
  resource: string;
  actions: PermissionAction[];
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

// Portfolio Types
export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  skills: string[];
  createdAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'job' | 'payment' | 'system';

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter Types
export interface JobFilters {
  status?: JobStatus[];
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  priority?: Priority[];
  search?: string;
}

export interface WorkerFilters {
  skills?: string[];
  minRate?: number;
  maxRate?: number;
  minScore?: number;
  timezone?: string[];
  availability?: 'available_now' | 'available_this_week';
  search?: string;
}

// Time Zone Types
export interface TimezoneInfo {
  name: string;
  offset: number;
  offsetString: string;
  abbreviation: string;
  isDST: boolean;
}

export interface TimezoneOverlap {
  startHour: number;
  endHour: number;
  overlapHours: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}
