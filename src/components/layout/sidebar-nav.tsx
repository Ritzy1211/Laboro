'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  Clock,
  CreditCard,
  Settings,
  Shield,
  BarChart3,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  Folder,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore, useUIStore } from '@/stores';
import type { UserRole } from '@/types';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  roles?: UserRole[];
}

interface NavSection {
  id: string;
  title?: string;
  items: NavItem[];
  roles?: UserRole[];
}

// Navigation configuration
const navigationConfig: NavSection[] = [
  {
    id: 'main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
    ],
  },
  {
    id: 'work',
    title: 'Work',
    items: [
      {
        id: 'jobs',
        label: 'Jobs',
        href: '/jobs',
        icon: <Briefcase className="h-5 w-5" />,
        badge: 3,
      },
      {
        id: 'tasks',
        label: 'Tasks',
        href: '/tasks',
        icon: <FileText className="h-5 w-5" />,
      },
      {
        id: 'availability',
        label: 'Availability',
        href: '/availability',
        icon: <Calendar className="h-5 w-5" />,
        roles: ['worker'],
      },
      {
        id: 'timezones',
        label: 'Time Zones',
        href: '/timezones',
        icon: <Globe className="h-5 w-5" />,
      },
    ],
  },
  {
    id: 'people',
    title: 'People',
    items: [
      {
        id: 'workers',
        label: 'Workers',
        href: '/workers',
        icon: <Users className="h-5 w-5" />,
        roles: ['client', 'enterprise_admin'],
      },
      {
        id: 'clients',
        label: 'Clients',
        href: '/clients',
        icon: <Building2 className="h-5 w-5" />,
        roles: ['worker', 'enterprise_admin'],
      },
      {
        id: 'messages',
        label: 'Messages',
        href: '/messages',
        icon: <MessageSquare className="h-5 w-5" />,
        badge: 5,
      },
    ],
  },
  {
    id: 'admin',
    title: 'Administration',
    roles: ['enterprise_admin', 'super_admin'],
    items: [
      {
        id: 'team',
        label: 'Team Management',
        href: '/admin/team',
        icon: <Users className="h-5 w-5" />,
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/admin/analytics',
        icon: <BarChart3 className="h-5 w-5" />,
      },
      {
        id: 'verification',
        label: 'Trust & Verification',
        href: '/admin/verification',
        icon: <Shield className="h-5 w-5" />,
      },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    items: [
      {
        id: 'billing',
        label: 'Billing',
        href: '/billing',
        icon: <CreditCard className="h-5 w-5" />,
      },
      {
        id: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: <Folder className="h-5 w-5" />,
        roles: ['client', 'enterprise_admin'],
      },
    ],
  },
  {
    id: 'settings',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: <Settings className="h-5 w-5" />,
      },
    ],
  },
];

interface SidebarNavProps {
  className?: string;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ className }) => {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed } = useUIStore();
  const isMobile = useUIStore((state) => state.isMobile);

  // Filter navigation based on user role
  const filteredNavigation = useMemo(() => {
    const userRole = user?.role;
    
    return navigationConfig
      .filter((section) => {
        if (!section.roles) return true;
        return userRole && section.roles.includes(userRole);
      })
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!item.roles) return true;
          return userRole && item.roles.includes(userRole);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [user?.role]);

  const sidebarContent = (
    <nav className="flex flex-col h-full">
      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {filteredNavigation.map((section) => (
          <div key={section.id}>
            {section.title && !sidebarCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => isMobile && setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                        'text-sm font-medium',
                        'transition-all duration-150',
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-400'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100',
                        sidebarCollapsed && 'justify-center px-2'
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span className={cn(isActive && 'text-brand-600 dark:text-brand-400')}>
                        {item.icon}
                      </span>
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <Badge variant={isActive ? 'brand' : 'default'} size="sm">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Collapse Toggle (Desktop Only) */}
      {!isMobile && (
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn('w-full', sidebarCollapsed && 'justify-center')}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      )}
    </nav>
  );

  // Mobile Sidebar (Overlay)
  if (isMobile) {
    return (
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                'fixed inset-y-0 left-0 z-50 w-64',
                'bg-white dark:bg-neutral-900',
                'border-r border-neutral-200 dark:border-neutral-800',
                'lg:hidden',
                className
              )}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop Sidebar
  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col',
        'bg-white dark:bg-neutral-900',
        'border-r border-neutral-200 dark:border-neutral-800',
        'transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {sidebarContent}
    </aside>
  );
};

SidebarNav.displayName = 'SidebarNav';

export { SidebarNav };
