'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Copy, Edit, Users, Video, Calendar, Check } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDate, formatUserId } from '@/lib/utils';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const copyUserId = () => {
    if (user?.userId) {
      navigator.clipboard.writeText(user.userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Profile Card */}
        <div className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-800/80 rounded-2xl overflow-hidden">
          {/* Cover */}
          <div className="h-24 bg-gradient-to-r from-neutral-800 to-neutral-700" />
          
          {/* Profile info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-10">
              <Avatar
                src={user.profilePicture}
                alt={user.displayName || user.username || ''}
                size="xl"
                className="w-20 h-20 border-4 border-neutral-900 rounded-xl"
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold text-white">
                    {user.displayName || user.username}
                  </h1>
                  {user.isPremium && (
                    <span className="px-2 py-0.5 bg-white/10 text-white text-xs rounded">Pro</span>
                  )}
                </div>
                <p className="text-sm text-neutral-400">@{user.username}</p>
              </div>

              <Link href="/profile/edit">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>

            {/* User ID Card */}
            <div className="mt-6 p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Your ID</p>
                  <p className="text-lg font-mono text-white tracking-wider">
                    {formatUserId(user.userId)}
                  </p>
                </div>
                <button
                  onClick={copyUserId}
                  className="p-2.5 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 mt-2">Share this ID to receive friend requests</p>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="mt-5 text-sm text-neutral-300 leading-relaxed">{user.bio}</p>
            )}

            {/* Stats Grid */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="p-4 bg-neutral-800/40 border border-neutral-700/50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Video className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-xl font-semibold text-white">{user.totalMatches}</span>
                </div>
                <p className="text-xs text-neutral-500">Matches</p>
              </div>
              <div className="p-4 bg-neutral-800/40 border border-neutral-700/50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-xl font-semibold text-white">{user.friendsCount}</span>
                </div>
                <p className="text-xs text-neutral-500">Friends</p>
              </div>
              <div className="p-4 bg-neutral-800/40 border border-neutral-700/50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                </div>
                <p className="text-xs text-neutral-500">Since {formatDate(user.joinDate, { month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Interests */}
            {user.interests && user.interests.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-medium text-neutral-500 mb-2">Interests</h3>
                <div className="flex flex-wrap gap-1.5">
                  {user.interests.map((interest, index) => (
                    <span key={index} className="px-2.5 py-1 bg-neutral-800/60 border border-neutral-700/50 text-neutral-300 text-xs rounded-lg">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
