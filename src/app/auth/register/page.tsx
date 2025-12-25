'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Building2, Github, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotificationStore } from '@/stores';
import { cn } from '@/lib/utils';

type AccountType = 'worker' | 'client';

export default function RegisterPage() {
  const router = useRouter();
  const { error: showError, success } = useNotificationStore();
  
  const [accountType, setAccountType] = useState<AccountType>('worker');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      showError('Terms Required', 'Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);

    try {
      // Simulated registration for demo
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      success('Account Created', 'Please check your email to verify your account');
      router.push('/auth/login');
    } catch (error) {
      showError('Registration Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile Logo */}
      <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
          <span className="text-white font-bold text-xl">L</span>
        </div>
        <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          LABORO
        </span>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Create your account
        </h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Start your 14-day free trial. No credit card required.
        </p>
      </div>

      {/* Account Type Toggle */}
      <div className="grid grid-cols-2 gap-3 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
        <button
          type="button"
          onClick={() => setAccountType('worker')}
          className={cn(
            'flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all',
            accountType === 'worker'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          )}
        >
          <User className="h-4 w-4" />
          I'm a Worker
        </button>
        <button
          type="button"
          onClick={() => setAccountType('client')}
          className={cn(
            'flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all',
            accountType === 'client'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          )}
        >
          <Building2 className="h-4 w-4" />
          I'm a Client
        </button>
      </div>

      {/* SSO Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          className="h-10"
          leftIcon={<Chrome className="h-4 w-4" />}
        >
          Google
        </Button>
        <Button
          variant="secondary"
          className="h-10"
          leftIcon={<Github className="h-4 w-4" />}
        >
          GitHub
        </Button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-neutral-50 dark:bg-neutral-950 text-neutral-500">
            or continue with email
          </span>
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            type="text"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Last name"
            type="text"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <Input
          label="Work email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          leftElement={<Mail className="h-4 w-4" />}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          hint="Must be at least 8 characters"
          leftElement={<Lock className="h-4 w-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className={cn(
              'mt-0.5 w-4 h-4 rounded border-neutral-300 dark:border-neutral-600',
              'text-brand-600 focus:ring-brand-500 focus:ring-offset-0'
            )}
          />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            I agree to the{' '}
            <Link href="/terms" className="text-brand-600 dark:text-brand-400 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-brand-600 dark:text-brand-400 hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        <Button
          type="submit"
          fullWidth
          loading={isLoading}
          className="h-11"
        >
          Create account
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
