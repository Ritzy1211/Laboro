'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Menu,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Moon,
  Sun,
  Command,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useUIStore, useNotificationStore } from '@/stores';

interface GlobalHeaderProps {
  className?: string;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ className }) => {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, setTheme, toggleSidebar, toggleCommandPalette } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const openDrawer = useUIStore((state) => state.openDrawer);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        'h-16 px-4 lg:px-6',
        'flex items-center justify-between gap-4',
        'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl',
        'border-b border-neutral-200 dark:border-neutral-800',
        className
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className="lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="hidden sm:block text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            LABORO
          </span>
        </Link>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-xl hidden md:block">
        <button
          onClick={toggleCommandPalette}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2',
            'bg-neutral-100 dark:bg-neutral-800 rounded-lg',
            'text-neutral-500 dark:text-neutral-400 text-sm',
            'hover:bg-neutral-200 dark:hover:bg-neutral-700',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand-500'
          )}
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <div className="ml-auto flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-neutral-700 rounded border border-neutral-300 dark:border-neutral-600">
              <Command className="h-3 w-3 inline" />
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-neutral-700 rounded border border-neutral-300 dark:border-neutral-600">
              K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Mobile Search */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Search"
          onClick={toggleCommandPalette}
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Help */}
        <Button variant="ghost" size="icon-sm" aria-label="Help">
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
          onClick={() => openDrawer('notifications')}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-error-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 p-1.5 rounded-lg',
                'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-brand-500'
              )}
            >
              <Avatar
                src={user?.avatar}
                alt={user?.displayName || 'User'}
                size="sm"
                status="online"
              />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {user?.role?.replace('_', ' ') || 'Guest'}
                </p>
              </div>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className={cn(
                'min-w-[200px] p-1.5',
                'bg-white dark:bg-neutral-900',
                'border border-neutral-200 dark:border-neutral-800',
                'rounded-lg shadow-lg',
                'animate-in fade-in-0 zoom-in-95',
                'z-50'
              )}
              sideOffset={8}
              align="end"
            >
              <DropdownMenu.Item asChild>
                <Link
                  href="/profile"
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md',
                    'text-sm text-neutral-700 dark:text-neutral-300',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    'cursor-pointer outline-none'
                  )}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <Link
                  href="/settings"
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md',
                    'text-sm text-neutral-700 dark:text-neutral-300',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    'cursor-pointer outline-none'
                  )}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />

              <DropdownMenu.Item
                onClick={logout}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md',
                  'text-sm text-error-600 dark:text-error-400',
                  'hover:bg-error-50 dark:hover:bg-error-950',
                  'cursor-pointer outline-none'
                )}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
};

GlobalHeader.displayName = 'GlobalHeader';

export { GlobalHeader };
