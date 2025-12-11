'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.sendOTP(email);
      // Store email for verify page
      sessionStorage.setItem('otpEmail', email);
      router.push('/verify');
    } catch (err: any) {
      const errorData = err.response?.data;
      
      // Check if user is banned
      if (errorData?.error === 'account_banned' && errorData?.banDetails) {
        // Store ban details and redirect to banned page
        sessionStorage.setItem('banDetails', JSON.stringify(errorData.banDetails));
        sessionStorage.setItem('bannedEmail', email);
        router.push('/banned');
        return;
      }
      
      setError(errorData?.message || errorData?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white via-neutral-100 to-neutral-200 flex items-center justify-center shadow-lg overflow-hidden">
              {/* Premium overlapping speech bubbles */}
              <svg viewBox="0 0 32 32" className="w-9 h-9" fill="none">
                {/* Back bubble - slightly offset */}
                <path 
                  d="M8 6C6.89543 6 6 6.89543 6 8V15C6 16.1046 6.89543 17 8 17H9V20L12 17H18C19.1046 17 20 16.1046 20 15V8C20 6.89543 19.1046 6 18 6H8Z" 
                  className="fill-neutral-400"
                />
                {/* Front bubble - overlapping */}
                <path 
                  d="M14 10C12.8954 10 12 10.8954 12 12V19C12 20.1046 12.8954 21 14 21H20L24 25V21H24C25.1046 21 26 20.1046 26 19V12C26 10.8954 25.1046 10 24 10H14Z" 
                  className="fill-neutral-800"
                />
                {/* Subtle accent dots on front bubble */}
                <circle cx="16" cy="15.5" r="1" className="fill-white/90" />
                <circle cx="19" cy="15.5" r="1" className="fill-white/90" />
                <circle cx="22" cy="15.5" r="1" className="fill-white/90" />
              </svg>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Guftagu</h1>
          <p className="text-zinc-400">Enter your email to get started</p>
        </div>

        {/* Form */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5" />}
              error={error}
              required
            />

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Continue with Email
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              We'll send you a one-time code to verify your email.
              <br />
              No password needed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-zinc-500 mt-8">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-zinc-400 hover:text-zinc-300">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-zinc-400 hover:text-zinc-300">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
