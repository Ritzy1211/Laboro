'use client';

import React from 'react';
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  Clock,
  TrendingUp,
  ArrowRight,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarGroup } from '@/components/ui/avatar';
import { ReliabilityScoreBadge } from '@/components/features/reliability-score-badge';
import { TimeZoneDisplay } from '@/components/features/timezone-visualizer';
import { SkillTagGroup } from '@/components/features/skill-tag-system';
import { useAuthStore } from '@/stores';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isWorker = user?.role === 'worker';
  const isClient = user?.role === 'client';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Dashboard
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Welcome back, {user?.firstName || 'User'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TimeZoneDisplay
            timezone={user?.timezone || 'America/New_York'}
            showTime
          />
          <Button>
            {isWorker ? 'Find Jobs' : 'Post a Job'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isWorker ? 'Active Jobs' : 'Open Jobs'}
          value="12"
          change={{ value: 8, type: 'increase' }}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatCard
          title={isWorker ? 'Earnings This Month' : 'Spent This Month'}
          value="$4,250"
          change={{ value: 12, type: 'increase' }}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Hours Logged"
          value="164"
          change={{ value: 5, type: 'increase' }}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title={isWorker ? 'Reliability Score' : 'Team Members'}
          value={isWorker ? '94.5' : '28'}
          change={{ value: 2, type: 'increase' }}
          icon={isWorker ? <TrendingUp className="h-5 w-5" /> : <Users className="h-5 w-5" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Jobs / Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title={isWorker ? 'Active Jobs' : 'Recent Jobs'}
              description="Your current assignments"
              action={
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              }
            />
            <div className="space-y-4">
              {[
                {
                  id: '1',
                  title: 'Frontend Development - Dashboard Redesign',
                  client: 'TechCorp Inc.',
                  status: 'in_progress',
                  deadline: '2 days',
                  budget: '$2,400',
                },
                {
                  id: '2',
                  title: 'API Integration - Payment Gateway',
                  client: 'FinanceApp',
                  status: 'review',
                  deadline: '5 days',
                  budget: '$1,800',
                },
                {
                  id: '3',
                  title: 'Mobile App UI/UX Design',
                  client: 'StartupXYZ',
                  status: 'in_progress',
                  deadline: '1 week',
                  budget: '$3,200',
                },
              ].map((job) => (
                <div
                  key={job.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg',
                    'bg-neutral-50 dark:bg-neutral-800/50',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    'transition-colors cursor-pointer'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                        {job.title}
                      </h4>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {job.client}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={job.status === 'in_progress' ? 'warning' : 'brand'}
                      size="sm"
                    >
                      {job.status.replace('_', ' ')}
                    </Badge>
                    <div className="text-right">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {job.budget}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Due in {job.deadline}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader
              title="Upcoming Tasks"
              description="Tasks due this week"
            />
            <div className="space-y-3">
              {[
                { title: 'Complete API documentation', status: 'done', due: 'Today' },
                { title: 'Review pull request #234', status: 'in_progress', due: 'Today' },
                { title: 'Deploy staging environment', status: 'todo', due: 'Tomorrow' },
                { title: 'Client meeting - Project review', status: 'todo', due: 'Dec 26' },
              ].map((task, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      task.status === 'done'
                        ? 'bg-success-500 border-success-500'
                        : task.status === 'in_progress'
                        ? 'border-warning-500'
                        : 'border-neutral-300 dark:border-neutral-600'
                    )}
                  >
                    {task.status === 'done' && (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      task.status === 'done'
                        ? 'line-through text-neutral-400'
                        : 'text-neutral-900 dark:text-neutral-100'
                    )}
                  >
                    {task.title}
                  </span>
                  <span className="text-xs text-neutral-500">{task.due}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Profile Card (Worker) */}
          {isWorker && (
            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar
                  src={user?.avatar}
                  alt={user?.displayName || 'User'}
                  size="xl"
                  status="online"
                />
                <h3 className="mt-4 font-semibold text-neutral-900 dark:text-neutral-100">
                  {user?.displayName || 'User Name'}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Full Stack Developer
                </p>
                <div className="mt-4">
                  <ReliabilityScoreBadge
                    score={94.5}
                    showLabel
                    breakdown={{
                      onTime: 96,
                      quality: 94,
                      communication: 92,
                      completion: 95,
                    }}
                  />
                </div>
                <div className="mt-6 w-full">
                  <SkillTagGroup
                    skills={[
                      { id: '1', name: 'React', level: 'expert', verified: true },
                      { id: '2', name: 'TypeScript', level: 'advanced', verified: true },
                      { id: '3', name: 'Node.js', level: 'advanced' },
                    ]}
                    max={3}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Notifications / Alerts */}
          <Card>
            <CardHeader title="Notifications" />
            <div className="space-y-3">
              {[
                {
                  icon: <CheckCircle className="h-4 w-4 text-success-500" />,
                  message: 'Payment of $1,200 received',
                  time: '2 hours ago',
                },
                {
                  icon: <AlertCircle className="h-4 w-4 text-warning-500" />,
                  message: 'Job deadline approaching',
                  time: '5 hours ago',
                },
                {
                  icon: <Calendar className="h-4 w-4 text-brand-500" />,
                  message: 'Meeting scheduled for tomorrow',
                  time: '1 day ago',
                },
              ].map((notification, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                >
                  <div className="mt-0.5">{notification.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">
                      {notification.message}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {notification.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Team Members (Client/Admin) */}
          {!isWorker && (
            <Card>
              <CardHeader
                title="Team Members"
                action={
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                }
              />
              <div className="space-y-3">
                {[
                  { name: 'Alex Johnson', role: 'Lead Developer', status: 'online' as const },
                  { name: 'Sarah Miller', role: 'Designer', status: 'online' as const },
                  { name: 'Mike Chen', role: 'Backend Dev', status: 'away' as const },
                  { name: 'Emily Davis', role: 'QA Engineer', status: 'offline' as const },
                ].map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <Avatar
                      alt={member.name}
                      size="sm"
                      status={member.status}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {member.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
