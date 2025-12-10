'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageSquare, Download, Search, ArrowLeft, Calendar, 
  Users, FileText, RefreshCw
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';

interface ConversationUser {
  _id: string;
  username: string;
  displayName?: string;
  userId: string;
  email: string;
}

interface Conversation {
  user1: ConversationUser;
  user2: ConversationUser;
  messageCount: number;
  lastMessage: string;
  firstMessage: string;
}

interface ChatStats {
  totalMessages: number;
  messagesToday: number;
  messagesThisMonth: number;
  uniqueConversations: number;
}

export default function ChatExportPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  
  // Export filters
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      router.push('/');
      return;
    }

    if (isAuthenticated && user?.isAdmin) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, user, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, convsRes] = await Promise.all([
        adminApi.getChatStats(),
        adminApi.getConversations({ search: search || undefined })
      ]);
      setStats(statsRes.data.stats);
      setConversations(convsRes.data.conversations);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const res = await adminApi.getConversations({ search: search || undefined });
      setConversations(res.data.conversations);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Search failed');
    }
  };

  const handleExport = async (user1Id?: string, user2Id?: string) => {
    setIsExporting(true);
    setError('');
    
    try {
      const params: any = {};
      if (user1Id) params.user1Id = user1Id;
      if (user2Id) params.user2Id = user2Id;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await adminApi.exportChat(params);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response or generate one
      const filename = user1Id && user2Id 
        ? `chat_export_${user1Id}_${user2Id}_${Date.now()}.csv`
        : user1Id 
          ? `chat_export_user_${user1Id}_${Date.now()}.csv`
          : `chat_export_all_${Date.now()}.csv`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin" 
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">Chat Export</h1>
              <p className="text-neutral-400 mt-1">Export user conversations as CSV files</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-neutral-400" />
                <span className="text-neutral-400 text-sm">Total Messages</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalMessages.toLocaleString()}</p>
            </div>
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-neutral-400" />
                <span className="text-neutral-400 text-sm">Today</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.messagesToday.toLocaleString()}</p>
            </div>
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-neutral-400" />
                <span className="text-neutral-400 text-sm">This Month</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.messagesThisMonth.toLocaleString()}</p>
            </div>
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-neutral-400" />
                <span className="text-neutral-400 text-sm">Conversations</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.uniqueConversations.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Date Filters */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Export Filters</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-800/60 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-800/60 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => handleExport()}
                disabled={isExporting}
                className="w-full px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export All Messages
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Search Conversations</h2>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by username, email, or user ID..."
                className="w-full pl-10 pr-4 py-2 bg-neutral-800/60 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-neutral-700/50">
            <h2 className="text-lg font-semibold text-white">Conversations ({conversations.length})</h2>
          </div>
          
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              No conversations found
            </div>
          ) : (
            <div className="divide-y divide-neutral-700/50">
              {conversations.map((conv, idx) => (
                <div key={idx} className="p-4 hover:bg-neutral-800/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-neutral-400" />
                        <span className="text-white font-medium">
                          {conv.user1.username || conv.user1.email}
                        </span>
                        <span className="text-neutral-500">&</span>
                        <span className="text-white font-medium">
                          {conv.user2.username || conv.user2.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-400">
                        <span>{conv.messageCount} messages</span>
                        <span>ID: {conv.user1.userId} & {conv.user2.userId}</span>
                        <span>Last: {formatDate(conv.lastMessage)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleExport(conv.user1._id, conv.user2._id)}
                      disabled={isExporting}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CSV Format Info */}
        <div className="mt-6 bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">CSV Export Format</h3>
          <p className="text-neutral-400 text-sm mb-3">
            The exported CSV file includes the following columns:
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="text-white font-medium mb-2">Message Info</h4>
              <ul className="text-neutral-400 space-y-1">
                <li>• Message ID</li>
                <li>• Message Content</li>
                <li>• Message Type</li>
                <li>• Timestamp</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Sender Details</h4>
              <ul className="text-neutral-400 space-y-1">
                <li>• Sender ID (ObjectId)</li>
                <li>• Sender User ID (7-digit)</li>
                <li>• Sender Username</li>
                <li>• Sender Email</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Status & Metadata</h4>
              <ul className="text-neutral-400 space-y-1">
                <li>• Is Delivered / Delivered At</li>
                <li>• Is Read / Read At</li>
                <li>• Created At / Updated At</li>
                <li>• Edited At / Deleted At</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
