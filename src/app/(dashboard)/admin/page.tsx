'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  TrendingUp,
  Building2,
  Shield,
  Settings,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  ChevronRight,
  UserPlus,
  Activity,
  Globe,
  Clock,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EnterpriseDataTable } from '@/components/features';
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
const mockOrgStats = {
  totalUsers: 156,
  activeWorkers: 89,
  activeClients: 45,
  admins: 12,
  totalJobs: 234,
  activeJobs: 67,
  monthlySpend: 89450,
  avgReliability: 91,
};

const mockDepartments = [
  { id: '1', name: 'Engineering', members: 45, activeJobs: 23, budget: 45000 },
  { id: '2', name: 'Design', members: 18, activeJobs: 12, budget: 18000 },
  { id: '3', name: 'Marketing', members: 22, activeJobs: 8, budget: 12000 },
  { id: '4', name: 'Operations', members: 15, activeJobs: 5, budget: 8000 },
];

const mockRecentActivity = [
  { user: 'Sarah M.', action: 'completed job', target: 'API Integration', time: '2 hours ago' },
  { user: 'John D.', action: 'posted job', target: 'Frontend Development', time: '3 hours ago' },
  { user: 'Admin', action: 'added user', target: 'Emily R.', time: '5 hours ago' },
  { user: 'Mike T.', action: 'approved payment', target: '$2,500', time: '1 day ago' },
  { user: 'Lisa K.', action: 'updated policy', target: 'Remote Work', time: '1 day ago' },
];

const mockTeamMembers = [
  { 
    id: '1', 
    name: 'Sarah Mitchell', 
    email: 'sarah@company.com',
    role: 'worker',
    department: 'Engineering',
    status: 'active',
    reliability: 98,
    joinedAt: '2023-06-15'
  },
  { 
    id: '2', 
    name: 'James Chen', 
    email: 'james@company.com',
    role: 'client',
    department: 'Design',
    status: 'active',
    reliability: 95,
    joinedAt: '2023-07-20'
  },
  { 
    id: '3', 
    name: 'Emily Davis', 
    email: 'emily@company.com',
    role: 'worker',
    department: 'Marketing',
    status: 'active',
    reliability: 92,
    joinedAt: '2023-08-10'
  },
  { 
    id: '4', 
    name: 'Michael Brown', 
    email: 'michael@company.com',
    role: 'enterprise_admin',
    department: 'Operations',
    status: 'active',
    reliability: 100,
    joinedAt: '2023-05-01'
  },
];

export default function EnterpriseAdminPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'departments'>('overview');

  const roleColors = {
    worker: 'bg-blue-100 text-blue-700',
    client: 'bg-purple-100 text-purple-700',
    enterprise_admin: 'bg-amber-100 text-amber-700',
  };

  const teamColumns = [
    {
      key: 'name',
      header: 'Member',
      sortable: true,
      render: (value: string, row: typeof mockTeamMembers[0]) => (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>{value.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (value: string) => (
        <Badge variant="secondary" className={roleColors[value as keyof typeof roleColors]}>
          {value.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
    },
    {
      key: 'reliability',
      header: 'Reliability',
      sortable: true,
      render: (value: number) => (
        <span className={`font-medium ${value >= 90 ? 'text-green-600' : value >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
          {value}%
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      ),
    },
  ];

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Enterprise Console
              </h1>
              <p className="text-muted-foreground text-sm">
                Acme Corporation • Enterprise Plan
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'departments', label: 'Departments', icon: Building2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-semibold mt-1">{mockOrgStats.totalUsers}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{mockOrgStats.activeWorkers} workers</span>
                  <span>{mockOrgStats.activeClients} clients</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Jobs</p>
                    <p className="text-2xl font-semibold mt-1">{mockOrgStats.activeJobs}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {mockOrgStats.totalJobs} total jobs
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Spend</p>
                    <p className="text-2xl font-semibold mt-1">
                      ${mockOrgStats.monthlySpend.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-xs text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Reliability</p>
                    <p className="text-2xl font-semibold mt-1">{mockOrgStats.avgReliability}%</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Across all workers
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Department Overview */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">Departments</CardTitle>
                    <CardDescription>Overview by department</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    View all
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockDepartments.map((dept) => (
                      <div
                        key={dept.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{dept.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {dept.members} members • {dept.activeJobs} active jobs
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${dept.budget.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">monthly budget</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity Feed */}
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentActivity.map((activity, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">{activity.user}</span>{' '}
                            {activity.action}{' '}
                            <span className="text-primary">{activity.target}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Global Metrics */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Global Workforce Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { region: 'North America', workers: 45, percentage: 35 },
                    { region: 'Europe', workers: 38, percentage: 30 },
                    { region: 'Asia Pacific', workers: 32, percentage: 25 },
                    { region: 'Other', workers: 12, percentage: 10 },
                  ].map((region) => (
                    <div key={region.region} className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium">{region.region}</p>
                      <p className="text-2xl font-semibold mt-1">{region.workers}</p>
                      <div className="mt-2">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${region.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{region.percentage}% of workforce</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* Users Tab */}
      {selectedTab === 'users' && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage your organization's users</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EnterpriseDataTable
                data={mockTeamMembers}
                columns={teamColumns}
                searchable
                searchPlaceholder="Search team members..."
                selectable
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Departments Tab */}
      {selectedTab === 'departments' && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Departments</CardTitle>
                  <CardDescription>Manage departments and budgets</CardDescription>
                </div>
                <Button size="sm">
                  <Building2 className="w-4 h-4 mr-2" />
                  Add Department
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDepartments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-6 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{dept.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {dept.members} team members
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Active Jobs</p>
                        <p className="text-xl font-semibold mt-1">{dept.activeJobs}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Monthly Budget</p>
                        <p className="text-xl font-semibold mt-1">${dept.budget.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Avg. Reliability</p>
                        <p className="text-xl font-semibold mt-1 text-green-600">
                          {Math.floor(85 + Math.random() * 15)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
