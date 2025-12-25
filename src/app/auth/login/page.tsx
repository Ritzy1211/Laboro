'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Github, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore, useNotificationStore } from '@/stores';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const { error: showError } = useNotificationStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulated login for demo
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // In production, this would call the actual login API
      // await login(email, password);
      
      router.push('/dashboard');
    } catch (error) {
      showError('Login Failed', 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
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
          Welcome back
        </h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Sign in to your account to continue
        </p>
      </div>

      {/* SSO Buttons */}
      <div className="space-y-3">
        <Button
          variant="secondary"
          fullWidth
          className="h-11"
          leftIcon={<Chrome className="h-5 w-5" />}
        >
          Continue with Google
        </Button>
        <Button
          variant="secondary"
          fullWidth
          className="h-11"
          leftIcon={<Github className="h-5 w-5" />}
        >
          Continue with GitHub
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

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
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
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className={cn(
                'w-4 h-4 rounded border-neutral-300 dark:border-neutral-600',
                'text-brand-600 focus:ring-brand-500 focus:ring-offset-0'
              )}
            />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Remember me
            </span>
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={isLoading}
          className="h-11"
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        Don't have an account?{' '}
        <Link
          href="/auth/register"
          className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
        >
          Sign up for free
        </Link>
      </p>

      {/* Enterprise SSO */}
      <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          Enterprise customer?{' '}
          <Link
            href="/auth/sso"
            className="font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Sign in with SSO
          </Link>
        </p>
      </div>
    </div>
  );
}
