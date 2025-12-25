import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Notification, NotificationType } from '@/types';
import { generateId } from '@/lib/utils';

interface NotificationState {
  // Notifications Panel
  notifications: Notification[];
  unreadCount: number;
  
  // Toast Notifications
  toasts: Toast[];
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Toast Actions
  showToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  
  // Convenience Methods
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

interface Toast {
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

const DEFAULT_TOAST_DURATION = 5000;

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      // Initial State
      notifications: [],
      unreadCount: 0,
      toasts: [],

      // Notification Actions
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: generateId('notif'),
          createdAt: new Date().toISOString(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          };
        });
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      // Toast Actions
      showToast: (toast) => {
        const id = generateId('toast');
        const newToast: Toast = {
          ...toast,
          id,
          duration: toast.duration ?? DEFAULT_TOAST_DURATION,
        };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-dismiss
        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            get().dismissToast(id);
          }, newToast.duration);
        }

        return id;
      },

      dismissToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      clearToasts: () => {
        set({ toasts: [] });
      },

      // Convenience Methods
      success: (title, message) => {
        return get().showToast({ type: 'success', title, message });
      },

      error: (title, message) => {
        return get().showToast({ type: 'error', title, message, duration: 8000 });
      },

      warning: (title, message) => {
        return get().showToast({ type: 'warning', title, message });
      },

      info: (title, message) => {
        return get().showToast({ type: 'info', title, message });
      },
    }),
    { name: 'NotificationStore' }
  )
);

// Selectors
export const selectNotifications = (state: NotificationState) => state.notifications;
export const selectUnreadCount = (state: NotificationState) => state.unreadCount;
export const selectToasts = (state: NotificationState) => state.toasts;
