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
}

export default function FindFriendsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [searchMode, setSearchMode] = useState<'username' | 'id'>('username');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
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
    try {
      await friendsApi.sendRequest(username);
      setSentRequests((prev) => new Set(prev).add(userId));
      setSuccess(`Friend request sent to ${username}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send request');
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/friends" className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
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
                ? 'bg-violet-600/20 text-violet-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
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
                ? 'bg-violet-600/20 text-violet-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Hash className="w-4 h-4 inline mr-2" />
            By User ID
          </button>
        </div>

        {/* Search Input */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
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
                      className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl"
                    >
                      <Avatar
                        src={user.profilePicture}
                        alt={user.displayName || user.username}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">
                          {user.displayName || user.username}
                        </h3>
                        <p className="text-sm text-zinc-400">@{user.username}</p>
                        <p className="text-xs text-zinc-500">{formatUserId(user.userId)}</p>
                      </div>
                      {sentRequests.has(user._id) ? (
                        <Button variant="outline" size="sm" disabled>
                          <Check className="w-4 h-4 mr-1" />
                          Sent
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => sendRequest(user._id, user.username)}>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <p className="text-center text-zinc-400 py-8">No users found</p>
                ) : (
                  <p className="text-center text-zinc-500 py-8">
                    Type at least 2 characters to search
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter 7-digit user ID"
                  value={searchQuery}
                  onChange={handleQueryChange}
                  icon={<Hash className="w-5 h-5" />}
                  className="font-mono text-lg tracking-wider"
                />
                <Button
                  onClick={searchById}
                  isLoading={isSearching}
                  disabled={searchQuery.length !== 7}
                >
                  Send Request
                </Button>
              </div>
              <p className="text-sm text-zinc-500 mt-2">
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
  );
}
