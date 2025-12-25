'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowRight,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  Tag,
  Globe,
  AlertCircle,
  CheckCircle2,
  X,
  Plus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

// Form steps
const steps = [
  { id: 'details', title: 'Job Details', description: 'Basic information about your job' },
  { id: 'budget', title: 'Budget & Timeline', description: 'Set your budget and deadline' },
  { id: 'skills', title: 'Required Skills', description: 'Skills needed for this job' },
  { id: 'preferences', title: 'Preferences', description: 'Working hours and visibility' },
  { id: 'review', title: 'Review', description: 'Review and publish' },
];

// Common skills for suggestions
const skillSuggestions = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 
  'Python', 'Django', 'PostgreSQL', 'MongoDB', 'AWS',
  'Docker', 'Kubernetes', 'GraphQL', 'REST API', 'Git',
  'UI/UX Design', 'Figma', 'Tailwind CSS', 'Testing', 'DevOps'
];

export default function CreateJobPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budgetType: 'fixed' as 'fixed' | 'hourly',
    budgetAmount: '',
    currency: 'USD',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    skills: [] as string[],
    visibility: 'public' as 'public' | 'private' | 'invite_only',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
  });
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      updateFormData('skills', [...formData.skills, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    updateFormData('skills', formData.skills.filter(s => s !== skill));
  };

  const toggleWorkingDay = (day: number) => {
    if (formData.workingDays.includes(day)) {
      updateFormData('workingDays', formData.workingDays.filter(d => d !== day));
    } else {
      updateFormData('workingDays', [...formData.workingDays, day].sort());
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!formData.title.trim()) newErrors.title = 'Job title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (formData.description.length < 50) newErrors.description = 'Description must be at least 50 characters';
    }

    if (currentStep === 1) {
      if (!formData.budgetAmount) newErrors.budgetAmount = 'Budget is required';
      if (parseFloat(formData.budgetAmount) <= 0) newErrors.budgetAmount = 'Budget must be greater than 0';
    }

    if (currentStep === 2) {
      if (formData.skills.length === 0) newErrors.skills = 'At least one skill is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    // Here you would submit to API
    console.log('Submitting job:', formData);
    // Navigate to jobs list or the new job
    router.push('/jobs');
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/jobs">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">Post a New Job</h1>
        <p className="text-muted-foreground mt-1">
          Fill out the details to find the perfect worker for your project
        </p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs mt-1 text-muted-foreground hidden sm:block">
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 mx-2 transition-colors ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Form Card */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Job Details */}
            {currentStep === 0 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Title</label>
                  <Input
                    placeholder="e.g., Senior React Developer for E-commerce Project"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    error={errors.title}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className={`w-full min-h-[200px] px-3 py-2 rounded-md border text-sm resize-y
                      ${errors.description 
                        ? 'border-destructive focus:ring-destructive' 
                        : 'border-input focus:ring-ring'}
                      bg-background focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    placeholder="Describe the job in detail. Include scope, deliverables, and any specific requirements..."
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {errors.description ? (
                      <p className="text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.description}
                      </p>
                    ) : (
                      <span>Minimum 50 characters</span>
                    )}
                    <span>{formData.description.length} characters</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={formData.category}
                    onChange={(e) => updateFormData('category', e.target.value)}
                  >
                    <option value="">Select a category</option>
                    <option value="web-development">Web Development</option>
                    <option value="mobile-development">Mobile Development</option>
                    <option value="design">Design</option>
                    <option value="writing">Writing & Content</option>
                    <option value="marketing">Marketing</option>
                    <option value="data">Data & Analytics</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}

            {/* Step 2: Budget & Timeline */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateFormData('budgetType', 'fixed')}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        formData.budgetType === 'fixed'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Briefcase className="w-5 h-5 mb-2 text-primary" />
                      <p className="font-medium">Fixed Price</p>
                      <p className="text-xs text-muted-foreground">
                        Pay a fixed amount for the entire project
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFormData('budgetType', 'hourly')}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        formData.budgetType === 'hourly'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Clock className="w-5 h-5 mb-2 text-primary" />
                      <p className="font-medium">Hourly Rate</p>
                      <p className="text-xs text-muted-foreground">
                        Pay by the hour for ongoing work
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {formData.budgetType === 'fixed' ? 'Budget' : 'Hourly Rate'}
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder={formData.budgetType === 'fixed' ? '5000' : '50'}
                        value={formData.budgetAmount}
                        onChange={(e) => updateFormData('budgetAmount', e.target.value)}
                        className="pl-9"
                        error={errors.budgetAmount}
                      />
                    </div>
                    {errors.budgetAmount && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.budgetAmount}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Currency</label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={formData.currency}
                      onChange={(e) => updateFormData('currency', e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deadline</label>
                    <Input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => updateFormData('deadline', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={formData.priority}
                      onChange={(e) => updateFormData('priority', e.target.value as typeof formData.priority)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Skills */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Required Skills</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill(skillInput);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={() => addSkill(skillInput)}
                      disabled={!skillInput.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {errors.skills && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.skills}
                    </p>
                  )}
                </div>

                {/* Selected skills */}
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:bg-muted rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Skill suggestions */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Suggested skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {skillSuggestions
                      .filter(s => !formData.skills.includes(s))
                      .slice(0, 12)
                      .map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="px-2 py-1 text-xs rounded-md border border-border hover:bg-muted transition-colors"
                        >
                          + {skill}
                        </button>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Preferences */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibility</label>
                  <div className="space-y-2">
                    {[
                      { value: 'public', label: 'Public', description: 'Anyone can see and apply' },
                      { value: 'private', label: 'Private', description: 'Only invited workers can see' },
                      { value: 'invite_only', label: 'Invite Only', description: 'Workers must be invited to apply' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.visibility === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          value={option.value}
                          checked={formData.visibility === option.value}
                          onChange={(e) => updateFormData('visibility', e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          formData.visibility === option.value
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}>
                          {formData.visibility === option.value && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred Working Days</label>
                  <div className="flex gap-2">
                    {dayNames.map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkingDay(index)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          formData.workingDays.includes(index)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Working Hours Start</label>
                    <Input
                      type="time"
                      value={formData.workingHoursStart}
                      onChange={(e) => updateFormData('workingHoursStart', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Working Hours End</label>
                    <Input
                      type="time"
                      value={formData.workingHoursEnd}
                      onChange={(e) => updateFormData('workingHoursEnd', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Your Timezone
                  </label>
                  <Input
                    value={formData.timezone}
                    onChange={(e) => updateFormData('timezone', e.target.value)}
                    placeholder="e.g., America/New_York"
                  />
                </div>
              </>
            )}

            {/* Step 5: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{formData.title || 'Untitled Job'}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="font-medium">
                        {formData.currency} {formData.budgetAmount || '0'}
                        {formData.budgetType === 'hourly' && '/hour'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="font-medium">
                        {formData.deadline 
                          ? new Date(formData.deadline).toLocaleDateString() 
                          : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Priority</p>
                      <Badge variant="secondary" className="capitalize">
                        {formData.priority}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Visibility</p>
                      <Badge variant="outline" className="capitalize">
                        {formData.visibility.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                      {formData.skills.length === 0 && (
                        <span className="text-sm text-muted-foreground">No skills specified</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Working Hours</p>
                    <p className="text-sm">
                      {formData.workingHoursStart} - {formData.workingHoursEnd} ({formData.timezone})
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.workingDays.map(d => dayNames[d]).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-4 rounded-lg bg-blue-50 text-blue-800">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Ready to publish?</p>
                    <p className="mt-1 text-blue-700">
                      Once published, your job will be visible to workers based on your visibility settings. 
                      You can edit the job details anytime.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Publish Job
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
}
