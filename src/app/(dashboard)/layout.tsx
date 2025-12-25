'use client';

import React from 'react';
import { GlobalHeader } from '@/components/layout/global-header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <GlobalHeader />
      <div className="flex h-[calc(100vh-4rem)]">
        <SidebarNav />
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            'transition-all duration-300'
          )}
        >
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
