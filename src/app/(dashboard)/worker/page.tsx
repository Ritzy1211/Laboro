'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Star,
  Calendar,
  ChevronRight,
  Search,
  Bell,
  CheckCircle2,
  Circle,
  Target
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ReliabilityScoreBadge } from '@/components/features';
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

// Mock data - replace with real data fetching
const mockStats = {
  activeJobs: 3,
  pendingTasks: 8,
  monthlyEarnings: 4250,
  reliabilityScore: 94,
  completedJobs: 47,
  hoursThisWeek: 32,
};

const mockRecommendedJobs = [
  {
    id: '1',
    title: 'Senior React Developer',
    client: 'TechCorp Inc.',
    budget: { type: 'hourly', amount: 75 },
    skills: ['React', 'TypeScript', 'Node.js'],
    postedAt: '2 hours ago',
    matchScore: 95,
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    client: 'StartupXYZ',
    budget: { type: 'fixed', amount: 5000 },
    skills: ['Next.js', 'PostgreSQL', 'AWS'],
    postedAt: '5 hours ago',
    matchScore: 88,
  },
  {
    id: '3',
    title: 'Frontend Consultant',
    client: 'Enterprise Corp',
    budget: { type: 'hourly', amount: 90 },
    skills: ['React', 'Design Systems', 'Testing'],
    postedAt: '1 day ago',
    matchScore: 82,
  },
];

const mockActiveTasks = [
  {
    id: '1',
    title: 'Implement authentication flow',
    job: 'E-commerce Platform',
    priority: 'high',
    dueDate: 'Tomorrow',
    status: 'in_progress',
  },
  {
    id: '2',
    title: 'Design dashboard components',
    job: 'Analytics Dashboard',
    priority: 'medium',
    dueDate: 'In 3 days',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Code review for PR #234',
    job: 'E-commerce Platform',
    priority: 'low',
    dueDate: 'In 5 days',
    status: 'pending',
  },
];

const mockRecentActivity = [
  { type: 'payment', message: 'Received $750 from TechCorp Inc.', time: '2 hours ago' },
  { type: 'task', message: 'Completed "API Integration" task', time: '5 hours ago' },
  { type: 'message', message: 'New message from Sarah M.', time: '1 day ago' },
  { type: 'job', message: 'Application accepted for "Frontend Dev"', time: '2 days ago' },
];

export default function WorkerDashboardPage() {
  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
    urgent: 'bg-red-500 text-white',
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome & Quick Stats */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Welcome back, Alex
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your work today.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
            <Button size="sm" asChild>
              <Link href="/jobs/search">
                <Search className="w-4 h-4 mr-2" />
                Find Jobs
              </Link>
            </Button>
          </div>
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
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
                <p className="text-2xl font-semibold mt-1">{mockStats.pendingTasks}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
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
                  ${mockStats.monthlyEarnings.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reliability</p>
                <div className="mt-1">
                  <ReliabilityScoreBadge score={mockStats.reliabilityScore} size="lg" />
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Tasks */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Active Tasks</CardTitle>
                <CardDescription>Your current work items</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks">
                  View all
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockActiveTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="mt-0.5">
                      {task.status === 'in_progress' ? (
                        <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        </div>
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{task.job}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={priorityColors[task.priority as keyof typeof priorityColors]}
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {task.dueDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentActivity.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recommended Jobs */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Recommended Jobs</CardTitle>
              <CardDescription>Based on your skills and preferences</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/jobs/search">
                Browse all
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockRecommendedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                        {job.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">{job.client}</p>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-medium">
                      <Target className="w-3 h-3" />
                      {job.matchScore}%
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {job.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {job.budget.type === 'hourly' 
                        ? `$${job.budget.amount}/hr` 
                        : `$${job.budget.amount.toLocaleString()}`}
                    </span>
                    <span className="text-xs text-muted-foreground">{job.postedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Availability & Schedule */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">This Week's Schedule</CardTitle>
              <CardDescription>
                {mockStats.hoursThisWeek} hours scheduled
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/availability">
                <Calendar className="w-4 h-4 mr-2" />
                Manage Availability
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                <div
                  key={day}
                  className={`text-center p-3 rounded-lg border ${
                    index < 5 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-muted/50 border-border'
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground">{day}</p>
                  <p className={`text-lg font-semibold mt-1 ${
                    index < 5 ? 'text-blue-600' : 'text-muted-foreground'
                  }`}>
                    {index < 5 ? '8h' : '-'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
