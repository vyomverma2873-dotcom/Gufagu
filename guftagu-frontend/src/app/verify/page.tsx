'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Video, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('otpEmail');
    if (!storedEmail) {
      router.push('/login');
      return;
    }
    setEmail(storedEmail);
    inputRefs.current[0]?.focus();
  }, [router]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newOtp.every((d) => d) && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpCode: string) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.verifyOTP(email, otpCode);
      const { token, user, isNewUser } = response.data;

      login(token, user);
      sessionStorage.removeItem('otpEmail');

      if (user.needsOnboarding) {
        router.push('/onboard');
      } else {
        router.push('/chat');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authApi.sendOTP(email);
      setResendCountdown(60);
      setError('');
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

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
          <h1 className="text-3xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-zinc-400">
            We sent a 6-digit code to{' '}
            <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white focus:border-violet-500 focus:outline-none transition-colors"
                disabled={isLoading}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center mb-4">{error}</p>
          )}

          <Button
            onClick={() => handleVerify(otp.join(''))}
            className="w-full"
            size="lg"
            isLoading={isLoading}
            disabled={otp.some((d) => !d)}
          >
            Verify
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Didn't receive the code?{' '}
              {resendCountdown > 0 ? (
                <span className="text-zinc-400">Resend in {resendCountdown}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-violet-400 hover:text-violet-300"
                >
                  Resend
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
