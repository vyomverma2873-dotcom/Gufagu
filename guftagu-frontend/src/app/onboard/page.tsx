'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Video, User, Check, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { userApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { debounce } from '@/lib/utils';

export default function OnboardPage() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, updateUser, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && !user.needsOnboarding) {
      router.push('/chat');
    }
  }, [isAuthenticated, user, router]);

  const checkUsername = debounce(async (value: string) => {
    if (value.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const response = await userApi.checkUsername(value);
      setIsAvailable(response.data.available);
    } catch {
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  }, 500);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(value);
    setIsAvailable(null);
    checkUsername(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await userApi.setUsername(username, displayName || username);
      updateUser({
        username: response.data.user.username,
        displayName: response.data.user.displayName,
        needsOnboarding: false,
      });
      router.push('/chat');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set username');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 mb-6">
            <Video className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-zinc-400">Choose a username to get started</p>
        </div>

        {/* User ID Display */}
        {user?.userId && (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-zinc-400 mb-1">Your unique ID</p>
            <p className="text-2xl font-bold font-mono text-violet-400 tracking-wider">
              {user.userId.slice(0, 3)}-{user.userId.slice(3)}
            </p>
            <p className="text-xs text-zinc-500 mt-2">Share this ID to receive friend requests</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Username</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={handleUsernameChange}
                  className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  minLength={3}
                  maxLength={20}
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-5 h-5" />
                </div>
                {username.length >= 3 && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {isChecking ? (
                      <div className="w-5 h-5 border-2 border-zinc-600 border-t-violet-500 rounded-full animate-spin" />
                    ) : isAvailable === true ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : isAvailable === false ? (
                      <X className="w-5 h-5 text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>
              {isAvailable === false && (
                <p className="mt-1 text-sm text-red-400">Username is already taken</p>
              )}
              <p className="mt-1 text-xs text-zinc-500">3-20 characters, letters, numbers, and underscores only</p>
            </div>

            <Input
              label="Display Name (optional)"
              placeholder="How should we call you?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={!username || username.length < 3 || isAvailable === false}
            >
              Continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
