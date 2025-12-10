'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ban, Clock, AlertTriangle, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

interface BanDetails {
  type: 'temporary' | 'permanent';
  reason: string;
  banUntil: string | null;
  remainingMs: number | null;
  bannedBy: string;
  description: string | null;
}

// Ban reason labels
const REASON_LABELS: Record<string, string> = {
  'inappropriate_content': 'Inappropriate Content',
  'harassment': 'Harassment',
  'spam': 'Spam',
  'multiple_reports': 'Multiple Reports',
  'admin_discretion': 'Admin Discretion',
  'underage': 'Underage User',
  'impersonation': 'Impersonation',
  'terms_violation': 'Terms of Service Violation',
  'other': 'Policy Violation'
};

export default function BannedPage() {
  const router = useRouter();
  const [banDetails, setBanDetails] = useState<BanDetails | null>(null);
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Get ban details from session storage
    const storedBanDetails = sessionStorage.getItem('banDetails');
    const storedEmail = sessionStorage.getItem('bannedEmail');

    if (!storedBanDetails) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(storedBanDetails);
      setBanDetails(parsed);
      setEmail(storedEmail || '');
    } catch {
      router.push('/login');
    }
  }, [router]);

  // Countdown timer for temporary bans
  useEffect(() => {
    if (!banDetails || banDetails.type === 'permanent' || !banDetails.banUntil) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const banEnd = new Date(banDetails.banUntil!).getTime();
      const diff = banEnd - now;

      if (diff <= 0) {
        setIsExpired(true);
        setCountdown(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [banDetails]);

  const handleRetryLogin = async () => {
    setIsRetrying(true);
    // Clear ban details and redirect to login
    sessionStorage.removeItem('banDetails');
    sessionStorage.removeItem('bannedEmail');
    router.push('/login');
  };

  if (!banDetails) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const formattedReason = REASON_LABELS[banDetails.reason] || banDetails.reason;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <Ban className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Account Banned</h1>
          <p className="text-zinc-400">Your access to Guftagu has been restricted</p>
        </div>

        {/* Ban Details Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Alert Banner */}
          <div className="bg-red-500/20 border-b border-red-500/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">
                {banDetails.type === 'permanent' 
                  ? 'Your account has been permanently banned.'
                  : isExpired 
                    ? 'Your ban has expired! You can try logging in again.'
                    : 'Your account has been temporarily banned.'}
              </p>
            </div>
          </div>

          {/* Countdown Timer (for temporary bans) */}
          {banDetails.type === 'temporary' && !isExpired && countdown && (
            <div className="px-6 py-6 border-b border-zinc-800 bg-zinc-800/30">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-3">
                <Clock className="w-4 h-4" />
                <span>Time remaining until unban</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{countdown.days}</div>
                  <div className="text-xs text-zinc-500">Days</div>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{countdown.hours}</div>
                  <div className="text-xs text-zinc-500">Hours</div>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{countdown.minutes}</div>
                  <div className="text-xs text-zinc-500">Minutes</div>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{countdown.seconds}</div>
                  <div className="text-xs text-zinc-500">Seconds</div>
                </div>
              </div>
            </div>
          )}

          {/* Ban Expired Message */}
          {isExpired && (
            <div className="px-6 py-6 border-b border-zinc-800 bg-emerald-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-emerald-400 font-medium">Ban Expired!</p>
                  <p className="text-zinc-400 text-sm">Your ban period has ended. Click the button below to try logging in again.</p>
                </div>
              </div>
            </div>
          )}

          {/* Ban Information */}
          <div className="px-6 py-6 space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-zinc-500 text-sm">Account</span>
              <span className="text-white text-sm font-medium">{email}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-zinc-500 text-sm">Ban Type</span>
              <span className={`text-sm font-medium ${banDetails.type === 'permanent' ? 'text-red-400' : 'text-amber-400'}`}>
                {banDetails.type === 'permanent' ? 'Permanent' : 'Temporary'}
              </span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-zinc-500 text-sm">Reason</span>
              <span className="text-white text-sm font-medium text-right max-w-[60%]">{formattedReason}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-zinc-500 text-sm">Banned By</span>
              <span className="text-white text-sm">{banDetails.bannedBy}</span>
            </div>
            
            {banDetails.banUntil && (
              <div className="flex justify-between items-start">
                <span className="text-zinc-500 text-sm">Expires</span>
                <span className="text-white text-sm">
                  {new Date(banDetails.banUntil).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
            
            {banDetails.description && (
              <div className="pt-3 border-t border-zinc-800">
                <span className="text-zinc-500 text-sm block mb-2">Additional Notes</span>
                <p className="text-zinc-300 text-sm bg-zinc-800/50 rounded-lg p-3">
                  {banDetails.description}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-800/30">
            {isExpired ? (
              <Button 
                onClick={handleRetryLogin}
                className="w-full"
                isLoading={isRetrying}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Logging In Again
              </Button>
            ) : (
              <div className="space-y-3">
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                
                <a 
                  href="mailto:vyomverma2873@gmail.com?subject=Ban%20Appeal%20Request"
                  className="block"
                >
                  <Button variant="primary" className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Appeal This Ban
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-sm">
            If you believe this ban was issued in error, please contact us at{' '}
            <a href="mailto:vyomverma2873@gmail.com" className="text-violet-400 hover:text-violet-300">
              vyomverma2873@gmail.com
            </a>
          </p>
        </div>

        {/* Policy Links */}
        <p className="text-center text-xs text-zinc-600 mt-4">
          Please review our{' '}
          <Link href="/terms" className="text-zinc-500 hover:text-zinc-400">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-zinc-500 hover:text-zinc-400">
            Community Guidelines
          </Link>
        </p>
      </div>
    </div>
  );
}
