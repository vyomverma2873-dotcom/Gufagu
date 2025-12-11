'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Hash, UserPlus, Check, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { friendsApi } from '@/lib/api';
import { debounce, formatUserId } from '@/lib/utils';

interface SearchResult {
  _id: string;
  userId: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  bio?: string;
  interests?: string[];
}

export default function FindFriendsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [searchMode, setSearchMode] = useState<'username' | 'id'>('username');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const searchByUsername = debounce(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await friendsApi.searchUsers(query);
      setResults(response.data.users);
    } catch (err) {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  const searchById = async () => {
    if (searchQuery.length !== 7) {
      setError('Please enter a valid 7-digit ID');
      return;
    }

    setIsSearching(true);
    setError('');
    try {
      const response = await friendsApi.sendRequestById(searchQuery);
      if (response.data) {
        setSuccess('Friend request sent!');
        setSentRequests((prev) => new Set(prev).add(searchQuery));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'User not found');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (searchMode === 'id') {
      setSearchQuery(value.replace(/\D/g, '').slice(0, 7));
    } else {
      setSearchQuery(value);
      searchByUsername(value);
    }
    
    setError('');
    setSuccess('');
  };

  const sendRequest = async (userId: string, username: string) => {
    setSendingRequest(userId);
    setError('');
    try {
      await friendsApi.sendRequest(username);
      setSentRequests((prev) => new Set(prev).add(userId));
      setSuccess(`Friend request sent to ${username}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send request');
    } finally {
      setSendingRequest(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Card Container */}
        <div className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/friends" className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Find Friends</h1>
          </div>

          {/* Search Mode Toggle */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => {
                setSearchMode('username');
                setSearchQuery('');
                setResults([]);
                setError('');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchMode === 'username'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              By Username
            </button>
            <button
              onClick={() => {
                setSearchMode('id');
                setSearchQuery('');
                setResults([]);
                setError('');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchMode === 'id'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Hash className="w-4 h-4 inline mr-2" />
              By User ID
            </button>
          </div>

          {/* Search Input */}
          <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-xl p-5">
            {searchMode === 'username' ? (
              <>
                <Input
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={handleQueryChange}
                  icon={<Search className="w-5 h-5" />}
                />

                {/* Search Results */}
                <div className="mt-4 space-y-3">
                  {isSearching ? (
                    <div className="text-center py-8">
                      <Spinner size="sm" />
                    </div>
                  ) : results.length > 0 ? (
                    results.map((user) => (
                      <div
                        key={user._id}
                        className="p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-xl"
                      >
                        <div className="flex items-start gap-4">
                          <Avatar
                            src={user.profilePicture}
                            alt={user.displayName || user.username}
                            size="lg"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h3 className="font-medium text-white truncate">
                                  {user.displayName || user.username}
                                </h3>
                                <p className="text-sm text-neutral-400">@{user.username}</p>
                                <p className="text-xs text-neutral-500 font-mono">{formatUserId(user.userId)}</p>
                              </div>
                              {sentRequests.has(user._id) ? (
                                <Button variant="outline" size="sm" disabled>
                                  <Check className="w-4 h-4 mr-1" />
                                  Sent
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  onClick={() => sendRequest(user._id, user.username)}
                                  isLoading={sendingRequest === user._id}
                                  disabled={sendingRequest !== null}
                                >
                                  <UserPlus className="w-4 h-4 mr-1" />
                                  Add
                                </Button>
                              )}
                            </div>
                            
                            {/* Bio */}
                            {user.bio && (
                              <div className="mt-3">
                                <p className="text-xs text-neutral-500 mb-1">About</p>
                                <p className="text-sm text-neutral-300 line-clamp-2">{user.bio}</p>
                              </div>
                            )}
                            
                            {/* Interests */}
                            {user.interests && user.interests.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-neutral-500 mb-1.5">Interests</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {user.interests.slice(0, 5).map((interest, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-neutral-700/60 border border-neutral-600/50 text-neutral-300 text-xs rounded-lg"
                                    >
                                      {interest}
                                    </span>
                                  ))}
                                  {user.interests.length > 5 && (
                                    <span className="text-xs text-neutral-500">+{user.interests.length - 5} more</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : searchQuery.length >= 2 ? (
                    <p className="text-center text-neutral-400 py-8">No users found</p>
                  ) : (
                    <p className="text-center text-neutral-500 py-8">
                      Type at least 2 characters to search
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    placeholder="Enter 7-digit user ID"
                    value={searchQuery}
                    onChange={handleQueryChange}
                    icon={<Hash className="w-5 h-5" />}
                    className="font-mono text-lg tracking-wider flex-1"
                  />
                  <Button
                    onClick={searchById}
                    isLoading={isSearching}
                    disabled={searchQuery.length !== 7}
                    className="w-full sm:w-auto whitespace-nowrap"
                  >
                    Send Request
                  </Button>
                </div>
                <p className="text-sm text-neutral-500 mt-2">
                  Ask your friend for their 7-digit unique ID
                </p>
              </>
            )}

            {/* Messages */}
            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            {success && <p className="text-emerald-400 text-sm mt-4">{success}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
