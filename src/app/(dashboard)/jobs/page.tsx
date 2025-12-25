'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign,
  Briefcase,
  Star,
  ChevronDown,
  X,
  Grid,
  List,
  SlidersHorizontal
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

// Mock job data
const mockJobs = [
  {
    id: '1',
    title: 'Senior React Developer for E-commerce Platform',
    description: 'We are looking for an experienced React developer to help build a modern e-commerce platform. The ideal candidate has experience with Next.js, TypeScript, and payment integrations.',
    client: { name: 'TechCorp Inc.', avatar: null, verified: true },
    budget: { type: 'hourly', min: 60, max: 80, currency: 'USD' },
    skills: ['React', 'TypeScript', 'Next.js', 'Stripe', 'PostgreSQL'],
    location: 'Remote',
    timezone: 'America/New_York',
    postedAt: '2024-01-15T10:00:00Z',
    deadline: '2024-02-15',
    applicants: 12,
    status: 'open',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Full Stack Engineer - SaaS Product',
    description: 'Join our team to build innovative SaaS solutions. We need someone who can work across the stack and help us scale our infrastructure.',
    client: { name: 'StartupXYZ', avatar: null, verified: true },
    budget: { type: 'fixed', amount: 8000, currency: 'USD' },
    skills: ['Node.js', 'React', 'AWS', 'Docker', 'MongoDB'],
    location: 'Remote',
    timezone: 'Europe/London',
    postedAt: '2024-01-14T14:30:00Z',
    deadline: '2024-03-01',
    applicants: 23,
    status: 'open',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Mobile App UI/UX Designer',
    description: 'Design beautiful and intuitive mobile interfaces for our fitness app. Must have experience with iOS and Android design patterns.',
    client: { name: 'FitLife App', avatar: null, verified: false },
    budget: { type: 'fixed', amount: 5000, currency: 'USD' },
    skills: ['Figma', 'UI Design', 'Mobile Design', 'Prototyping'],
    location: 'Remote',
    timezone: 'America/Los_Angeles',
    postedAt: '2024-01-13T09:00:00Z',
    deadline: '2024-02-01',
    applicants: 31,
    status: 'open',
    priority: 'medium',
  },
  {
    id: '4',
    title: 'Backend Python Developer',
    description: 'Build robust APIs and data pipelines for our analytics platform. Experience with FastAPI and data processing is essential.',
    client: { name: 'DataFlow Systems', avatar: null, verified: true },
    budget: { type: 'hourly', min: 50, max: 70, currency: 'USD' },
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
    location: 'Remote',
    timezone: 'Asia/Singapore',
    postedAt: '2024-01-12T16:00:00Z',
    deadline: '2024-02-28',
    applicants: 18,
    status: 'open',
    priority: 'high',
  },
  {
    id: '5',
    title: 'DevOps Engineer - Cloud Infrastructure',
    description: 'Set up and maintain our cloud infrastructure on AWS. Must have experience with Kubernetes, Terraform, and CI/CD pipelines.',
    client: { name: 'CloudScale Tech', avatar: null, verified: true },
    budget: { type: 'hourly', min: 70, max: 100, currency: 'USD' },
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux'],
    location: 'Remote',
    timezone: 'Europe/Berlin',
    postedAt: '2024-01-11T11:00:00Z',
    deadline: '2024-02-20',
    applicants: 8,
    status: 'open',
    priority: 'urgent',
  },
];

const skillOptions = [
  'React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 
  'Kubernetes', 'PostgreSQL', 'MongoDB', 'Figma', 'UI Design'
];

export default function JobsSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 200]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'recent' | 'budget' | 'applicants'>('recent');

  const filteredJobs = useMemo(() => {
    return mockJobs.filter(job => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesDescription = job.description.toLowerCase().includes(query);
        const matchesSkills = job.skills.some(skill => skill.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDescription && !matchesSkills) return false;
      }

      // Skills filter
      if (selectedSkills.length > 0) {
        const hasMatchingSkill = selectedSkills.some(skill => 
          job.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
        );
        if (!hasMatchingSkill) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      }
      if (sortBy === 'applicants') {
        return a.applicants - b.applicants; // Fewer applicants = better opportunity
      }
      return 0;
    });
  }, [searchQuery, selectedSkills, sortBy]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const formatBudget = (budget: typeof mockJobs[0]['budget']) => {
    if (budget.type === 'hourly') {
      return `$${budget.min}-${budget.max}/hr`;
    }
    return `$${budget.amount?.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-amber-100 text-amber-600',
    urgent: 'bg-red-100 text-red-600',
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
        <h1 className="text-2xl font-semibold text-foreground">Find Jobs</h1>
        <p className="text-muted-foreground mt-1">
          Discover opportunities that match your skills
        </p>
      </motion.div>

      {/* Search & Filters Bar */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title, skill, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {selectedSkills.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedSkills.length}
                    </Badge>
                  )}
                </Button>

                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className="rounded-r-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className="rounded-l-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                </div>

                <select
                  className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                >
                  <option value="recent">Most Recent</option>
                  <option value="budget">Highest Budget</option>
                  <option value="applicants">Fewest Applicants</option>
                </select>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t"
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {skillOptions.map((skill) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                            selectedSkills.includes(skill)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-foreground border-border hover:border-primary/50'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedSkills.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSkills([])}
                      className="text-muted-foreground"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear filters
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Count */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredJobs.length}</span> jobs
        </p>
      </motion.div>

      {/* Job Listings */}
      <motion.div
        variants={containerVariants}
        className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'}
      >
        {filteredJobs.map((job) => (
          <motion.div key={job.id} variants={itemVariants}>
            <Link href={`/jobs/${job.id}`}>
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="secondary" 
                          className={priorityColors[job.priority as keyof typeof priorityColors]}
                        >
                          {job.priority}
                        </Badge>
                        {job.client.verified && (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                    </div>
                    <span className="text-lg font-semibold text-primary whitespace-nowrap">
                      {formatBudget(job.budget)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {job.description}
                  </p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.skills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{job.skills.length - 5}
                      </Badge>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[10px]">
                            {job.client.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{job.client.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{job.applicants} applied</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(job.postedAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredJobs.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search query
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSkills([]);
                }}
              >
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Load More */}
      {filteredJobs.length > 0 && (
        <motion.div variants={itemVariants} className="text-center">
          <Button variant="outline">
            Load More Jobs
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
