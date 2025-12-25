'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  TrendingUp,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Mock data
const mockStats = {
  activeJobs: 5,
  totalApplications: 23,
  monthlySpending: 12450,
  hiredWorkers: 8,
};

const mockActiveJobs = [
  {
    id: '1',
    title: 'E-commerce Platform Development',
    status: 'in_progress',
    budget: 15000,
    spent: 8500,
    applicants: 12,
    hired: 2,
    deadline: '2024-02-15',
    progress: 56,
  },
  {
    id: '2',
    title: 'Mobile App UI/UX Design',
    status: 'in_progress',
    budget: 5000,
    spent: 2000,
    applicants: 8,
    hired: 1,
    deadline: '2024-02-20',
    progress: 40,
  },
  {
    id: '3',
    title: 'API Integration Project',
    status: 'open',
    budget: 3000,
    spent: 0,
    applicants: 15,
    hired: 0,
    deadline: '2024-03-01',
    progress: 0,
  },
];

const mockTopWorkers = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    avatar: null,
    role: 'Full Stack Developer',
    reliability: 98,
    activeJobs: 2,
    totalEarned: 4500,
  },
  {
    id: '2',
    name: 'James Chen',
    avatar: null,
    role: 'UI/UX Designer',
    reliability: 95,
    activeJobs: 1,
    totalEarned: 2000,
  },
  {
    id: '3',
    name: 'Emily Davis',
    avatar: null,
    role: 'Backend Developer',
    reliability: 92,
    activeJobs: 1,
    totalEarned: 3200,
  },
];

const mockPendingApplications = [
  {
    id: '1',
    worker: { name: 'Alex Thompson', avatar: null, reliability: 94 },
    job: 'API Integration Project',
    proposedRate: 65,
    appliedAt: '2 hours ago',
  },
  {
    id: '2',
    worker: { name: 'Maria Garcia', avatar: null, reliability: 91 },
    job: 'API Integration Project',
    proposedRate: 70,
    appliedAt: '5 hours ago',
  },
  {
    id: '3',
    worker: { name: 'David Kim', avatar: null, reliability: 89 },
    job: 'E-commerce Platform Development',
    proposedRate: 80,
    appliedAt: '1 day ago',
  },
];

export default function ClientDashboardPage() {
  const statusColors = {
    open: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-slate-100 text-slate-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Client Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your projects and hired workers
            </p>
          </div>
          <Button asChild>
            <Link href="/jobs/create">
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-semibold mt-1">{mockStats.activeJobs}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applications</p>
                <p className="text-2xl font-semibold mt-1">{mockStats.totalApplications}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-semibold mt-1">
                  ${mockStats.monthlySpending.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hired Workers</p>
                <p className="text-2xl font-semibold mt-1">{mockStats.hiredWorkers}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Jobs */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Active Jobs</CardTitle>
                <CardDescription>Your ongoing projects</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/jobs">
                  View all
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActiveJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link 
                          href={`/jobs/${job.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {job.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="secondary"
                            className={statusColors[job.status as keyof typeof statusColors]}
                          >
                            {job.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Due {new Date(job.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{job.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          ${job.spent.toLocaleString()} / ${job.budget.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {job.hired} hired
                        </span>
                      </div>
                      {job.applicants > 0 && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>{job.applicants} applicants</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Workers */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Your Team</CardTitle>
                <CardDescription>Currently hired workers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockTopWorkers.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <Avatar size="sm">
                        <AvatarFallback>
                          {worker.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{worker.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {worker.role}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-green-600 font-medium">
                            {worker.reliability}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {worker.activeJobs} jobs
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Applications */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">New Applications</CardTitle>
                  <CardDescription>Review and respond</CardDescription>
                </div>
                <Badge variant="secondary">{mockPendingApplications.length}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockPendingApplications.map((application) => (
                    <div
                      key={application.id}
                      className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar size="sm">
                          <AvatarFallback>
                            {application.worker.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {application.worker.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {application.job}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium">
                              ${application.proposedRate}/hr
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {application.appliedAt}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
                          View
                        </Button>
                        <Button size="sm" className="flex-1 h-7 text-xs">
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-3" asChild>
                  <Link href="/applications">
                    View all applications
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link href="/jobs/create">
                  <Plus className="w-5 h-5" />
                  <span>Post Job</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link href="/workers/search">
                  <Users className="w-5 h-5" />
                  <span>Find Workers</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link href="/messages">
                  <Clock className="w-5 h-5" />
                  <span>Messages</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link href="/billing">
                  <DollarSign className="w-5 h-5" />
                  <span>Billing</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
