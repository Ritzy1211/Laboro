import apiClient from './api-client';
import type { User, UserRole } from '@/types';

// Auth request/response types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  companyName?: string;
  timezone?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface SocialAuthRequest {
  provider: 'google' | 'github' | 'linkedin';
  token: string;
  role?: UserRole;
}

// Auth service
export const authService = {
  /**
   * Login with email and password
   */
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data, { requiresAuth: false }),

  /**
   * Register a new user
   */
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data, { requiresAuth: false }),

  /**
   * Logout current user
   */
  logout: () =>
    apiClient.post<void>('/auth/logout'),

  /**
   * Refresh access token
   */
  refreshToken: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }, { requiresAuth: false }),

  /**
   * Get current user profile
   */
  getCurrentUser: () =>
    apiClient.get<User>('/auth/me'),

  /**
   * Request password reset
   */
  requestPasswordReset: (data: ResetPasswordRequest) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', data, { requiresAuth: false }),

  /**
   * Confirm password reset
   */
  confirmPasswordReset: (data: ConfirmResetPasswordRequest) =>
    apiClient.post<{ message: string }>('/auth/reset-password', data, { requiresAuth: false }),

  /**
   * Change password for authenticated user
   */
  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<{ message: string }>('/auth/change-password', data),

  /**
   * Verify email address
   */
  verifyEmail: (data: VerifyEmailRequest) =>
    apiClient.post<{ message: string }>('/auth/verify-email', data, { requiresAuth: false }),

  /**
   * Resend email verification
   */
  resendVerification: () =>
    apiClient.post<{ message: string }>('/auth/resend-verification'),

  /**
   * Social authentication
   */
  socialAuth: (data: SocialAuthRequest) =>
    apiClient.post<AuthResponse>('/auth/social', data, { requiresAuth: false }),

  /**
   * Check if email is available
   */
  checkEmailAvailability: (email: string) =>
    apiClient.get<{ available: boolean }>('/auth/check-email', {
      params: { email },
      requiresAuth: false,
    }),

  /**
   * Enable two-factor authentication
   */
  enableTwoFactor: () =>
    apiClient.post<{ secret: string; qrCode: string }>('/auth/2fa/enable'),

  /**
   * Verify and confirm two-factor authentication
   */
  confirmTwoFactor: (code: string) =>
    apiClient.post<{ backupCodes: string[] }>('/auth/2fa/confirm', { code }),

  /**
   * Disable two-factor authentication
   */
  disableTwoFactor: (code: string) =>
    apiClient.post<void>('/auth/2fa/disable', { code }),

  /**
   * Verify two-factor code during login
   */
  verifyTwoFactor: (code: string, tempToken: string) =>
    apiClient.post<AuthResponse>('/auth/2fa/verify', { code, tempToken }, { requiresAuth: false }),
};

export default authService;
