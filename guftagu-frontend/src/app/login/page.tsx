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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white to-neutral-200 flex items-center justify-center shadow-lg overflow-hidden">
              {/* Chat bubble inspired logo */}
              <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
                {/* Main chat bubble */}
                <path 
                  d="M6 8C6 6.89543 6.89543 6 8 6H24C25.1046 6 26 6.89543 26 8V18C26 19.1046 25.1046 20 24 20H12L7 25V20H8C6.89543 20 6 19.1046 6 18V8Z" 
                  className="fill-neutral-800"
                />
                {/* Three dots representing conversation */}
                <circle cx="11" cy="13" r="1.5" className="fill-white" />
                <circle cx="16" cy="13" r="1.5" className="fill-white" />
                <circle cx="21" cy="13" r="1.5" className="fill-white" />
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
