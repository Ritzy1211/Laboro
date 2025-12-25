import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  
  // Role Checks
  hasRole: (role: UserRole) => boolean;
  isWorker: () => boolean;
  isClient: () => boolean;
  isEnterpriseAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        accessToken: null,
        refreshToken: null,

        // Actions
        setUser: (user) =>
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
            error: null,
          }),

        setTokens: (accessToken, refreshToken) =>
          set({ accessToken, refreshToken }),

        setLoading: (isLoading) => set({ isLoading }),

        setError: (error) => set({ error, isLoading: false }),

        login: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            // API call would go here
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
              throw new Error('Invalid credentials');
            }

            const data = await response.json();
            set({
              user: data.user,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Login failed',
              isLoading: false,
            });
            throw error;
          }
        },

        logout: () => {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        },

        refreshAuth: async () => {
          const { refreshToken } = get();
          if (!refreshToken) {
            set({ isAuthenticated: false, isLoading: false });
            return;
          }

          try {
            const response = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
              throw new Error('Token refresh failed');
            }

            const data = await response.json();
            set({
              user: data.user,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch {
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },

        updateUser: (updates) =>
          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
          })),

        // Role Checks
        hasRole: (role) => get().user?.role === role,
        isWorker: () => get().user?.role === 'worker',
        isClient: () => get().user?.role === 'client',
        isEnterpriseAdmin: () => get().user?.role === 'enterprise_admin',
        isSuperAdmin: () => get().user?.role === 'super_admin',
      }),
      {
        name: 'laboro-auth',
        partialize: (state) => ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Selectors for optimized re-renders
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectUserRole = (state: AuthState) => state.user?.role;
