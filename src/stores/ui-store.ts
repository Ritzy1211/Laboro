import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type ModalType = 
  | 'createJob'
  | 'editJob'
  | 'createTask'
  | 'editProfile'
  | 'inviteUser'
  | 'confirmDelete'
  | 'paymentMethod'
  | 'feedback'
  | 'settings'
  | null;

type DrawerType =
  | 'notifications'
  | 'jobDetails'
  | 'workerProfile'
  | 'filters'
  | 'help'
  | null;

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Modal
  activeModal: ModalType;
  modalData: Record<string, unknown> | null;
  
  // Drawer
  activeDrawer: DrawerType;
  drawerData: Record<string, unknown> | null;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Loading States
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Command Palette
  commandPaletteOpen: boolean;
  
  // Breakpoints
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  openModal: (type: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  
  openDrawer: (type: DrawerType, data?: Record<string, unknown>) => void;
  closeDrawer: () => void;
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  
  setBreakpoints: (isMobile: boolean, isTablet: boolean, isDesktop: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial State
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeModal: null,
      modalData: null,
      activeDrawer: null,
      drawerData: null,
      theme: 'system',
      globalLoading: false,
      loadingMessage: null,
      commandPaletteOpen: false,
      isMobile: false,
      isTablet: false,
      isDesktop: true,

      // Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      openModal: (type, data = null) =>
        set({ activeModal: type, modalData: data }),
      
      closeModal: () =>
        set({ activeModal: null, modalData: null }),

      openDrawer: (type, data = null) =>
        set({ activeDrawer: type, drawerData: data }),
      
      closeDrawer: () =>
        set({ activeDrawer: null, drawerData: null }),

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (typeof window !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          
          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light';
            root.classList.add(systemTheme);
          } else {
            root.classList.add(theme);
          }
        }
      },

      setGlobalLoading: (globalLoading, loadingMessage = null) =>
        set({ globalLoading, loadingMessage }),

      setCommandPaletteOpen: (commandPaletteOpen) =>
        set({ commandPaletteOpen }),
      
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      setBreakpoints: (isMobile, isTablet, isDesktop) =>
        set({ isMobile, isTablet, isDesktop }),
    }),
    { name: 'UIStore' }
  )
);

// Selectors
export const selectSidebarOpen = (state: UIState) => state.sidebarOpen;
export const selectActiveModal = (state: UIState) => state.activeModal;
export const selectActiveDrawer = (state: UIState) => state.activeDrawer;
export const selectTheme = (state: UIState) => state.theme;
export const selectIsMobile = (state: UIState) => state.isMobile;
