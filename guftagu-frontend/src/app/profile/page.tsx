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
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-violet-600 to-purple-600" />
          
          {/* Profile info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
              <Avatar
                src={user.profilePicture}
                alt={user.displayName || user.username || ''}
                size="xl"
                className="w-24 h-24 border-4 border-zinc-900"
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-white">
                    {user.displayName || user.username}
                  </h1>
                  {user.isPremium && (
                    <Badge variant="warning">Premium</Badge>
                  )}
                </div>
                <p className="text-zinc-400">@{user.username}</p>
              </div>

              <Link href="/profile/edit">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>

            {/* User ID */}
            <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Your Unique ID</p>
                  <p className="text-2xl font-bold font-mono text-violet-400 tracking-wider">
                    {formatUserId(user.userId)}
                  </p>
                </div>
                <button
                  onClick={copyUserId}
                  className="p-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-white transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-2">Share this ID to receive friend requests</p>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="mt-6 text-zinc-300">{user.bio}</p>
            )}

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-800/50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Video className="w-4 h-4 text-violet-400" />
                  <span className="text-2xl font-bold text-white">{user.totalMatches}</span>
                </div>
                <p className="text-sm text-zinc-400">Matches</p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-violet-400" />
                  <span className="text-2xl font-bold text-white">{user.friendsCount}</span>
                </div>
                <p className="text-sm text-zinc-400">Friends</p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-violet-400" />
                </div>
                <p className="text-sm text-zinc-400">Member since {formatDate(user.joinDate, { month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Interests */}
            {user.interests && user.interests.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest, index) => (
                    <Badge key={index} variant="default">{interest}</Badge>
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
