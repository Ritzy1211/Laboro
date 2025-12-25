'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/services/auth-service';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};

/**
 * Hook to get current user
 */
export function useCurrentUser() {
  const { isAuthenticated, setUser } = useAuthStore();
  
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      const user = await authService.getCurrentUser();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook for login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();
  
  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response: AuthResponse) => {
      login(response.user, response.accessToken, response.refreshToken);
      queryClient.setQueryData(authKeys.user(), response.user);
    },
  });
}

/**
 * Hook for registration mutation
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();
  
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (response: AuthResponse) => {
      login(response.user, response.accessToken, response.refreshToken);
      queryClient.setQueryData(authKeys.user(), response.user);
    },
  });
}

/**
 * Hook for logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
    onError: () => {
      // Even if logout fails, clear local state
      logout();
      queryClient.clear();
    },
  });
}

/**
 * Hook for password reset request
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset({ email }),
  });
}

/**
 * Hook for password reset confirmation
 */
export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (data: { token: string; password: string }) => 
      authService.confirmPasswordReset(data),
  });
}

/**
 * Hook for changing password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
  });
}

/**
 * Hook for email verification
 */
export function useVerifyEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail({ token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
}

/**
 * Hook for social authentication
 */
export function useSocialAuth() {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();
  
  return useMutation({
    mutationFn: (data: { provider: 'google' | 'github' | 'linkedin'; token: string }) =>
      authService.socialAuth(data),
    onSuccess: (response: AuthResponse) => {
      login(response.user, response.accessToken, response.refreshToken);
      queryClient.setQueryData(authKeys.user(), response.user);
    },
  });
}

/**
 * Hook to check email availability
 */
export function useCheckEmail(email: string, enabled = false) {
  return useQuery({
    queryKey: ['checkEmail', email],
    queryFn: () => authService.checkEmailAvailability(email),
    enabled: enabled && email.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for enabling 2FA
 */
export function useEnable2FA() {
  return useMutation({
    mutationFn: () => authService.enableTwoFactor(),
  });
}

/**
 * Hook for confirming 2FA
 */
export function useConfirm2FA() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (code: string) => authService.confirmTwoFactor(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
}

/**
 * Hook for disabling 2FA
 */
export function useDisable2FA() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (code: string) => authService.disableTwoFactor(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
}
