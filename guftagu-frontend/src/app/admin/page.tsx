'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, Video, AlertTriangle, Shield, TrendingUp, Activity, 
  BarChart3, Clock, UserCheck, UserX, MessageSquare
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { adminApi } from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  usersToday: number;
  usersThisMonth: number;
  userGrowth: string;
  premiumUsers: number;
  bannedUsers: number;
  onlineUsers: number;
  totalMatches: number;
  matchesToday: number;
  matchesThisMonth: number;
  totalReports: number;
  pendingReports: number;
  reportsToday: number;
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  link 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  change?: string; 
  link?: string;
}) {
  const content = (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-zinc-800 rounded-lg">
          <Icon className="w-6 h-6 text-violet-400" />
        </div>
        {change && (
          <span className={`text-sm ${parseFloat(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {parseFloat(change) >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-zinc-400">{title}</p>
    </div>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { onlineCount } = useSocket();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      router.push('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await adminApi.getDashboard();
        setStats(response.data.stats);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch stats');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user?.isAdmin) {
      fetchStats();
    }
  }, [isAuthenticated, authLoading, user, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-zinc-400 mt-1">Overview of platform statistics and management</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/admin/users" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
            <Users className="w-4 h-4 inline mr-2" />
            Manage Users
          </Link>
          <Link href="/admin/reports" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            View Reports
            {stats?.pendingReports ? (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {stats.pendingReports}
              </span>
            ) : null}
          </Link>
          <Link href="/admin/chats" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Export Chats
          </Link>
          <Link href="/admin/bans" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
            <Shield className="w-4 h-4 inline mr-2" />
            Active Bans
          </Link>
          <Link href="/admin/logs" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
            <Activity className="w-4 h-4 inline mr-2" />
            System Logs
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Online Now"
            value={onlineCount || stats?.onlineUsers || 0}
            icon={Activity}
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers?.toLocaleString() || 0}
            icon={Users}
            change={stats?.userGrowth}
            link="/admin/users"
          />
          <StatCard
            title="New Today"
            value={stats?.usersToday || 0}
            icon={UserCheck}
          />
          <StatCard
            title="Premium Users"
            value={stats?.premiumUsers || 0}
            icon={TrendingUp}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Matches"
            value={stats?.totalMatches?.toLocaleString() || 0}
            icon={Video}
          />
          <StatCard
            title="Matches Today"
            value={stats?.matchesToday || 0}
            icon={BarChart3}
          />
          <StatCard
            title="Pending Reports"
            value={stats?.pendingReports || 0}
            icon={AlertTriangle}
            link="/admin/reports"
          />
          <StatCard
            title="Banned Users"
            value={stats?.bannedUsers || 0}
            icon={UserX}
            link="/admin/bans"
          />
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-400" />
              Quick Stats
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                <span className="text-zinc-400">Users this month</span>
                <span className="text-white font-medium">{stats?.usersThisMonth || 0}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                <span className="text-zinc-400">Matches this month</span>
                <span className="text-white font-medium">{stats?.matchesThisMonth || 0}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                <span className="text-zinc-400">Reports today</span>
                <span className="text-white font-medium">{stats?.reportsToday || 0}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-zinc-400">Total reports</span>
                <span className="text-white font-medium">{stats?.totalReports || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-400" />
              Admin Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/admin/users"
                className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-zinc-400" />
                <span className="text-white">Search and manage users</span>
              </Link>
              <Link
                href="/admin/reports?status=pending"
                className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <AlertTriangle className="w-5 h-5 text-zinc-400" />
                <span className="text-white">Review pending reports</span>
              </Link>
              <Link
                href="/admin/bans"
                className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <UserX className="w-5 h-5 text-zinc-400" />
                <span className="text-white">Manage active bans</span>
              </Link>
              <Link
                href="/admin/logs"
                className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Activity className="w-5 h-5 text-zinc-400" />
                <span className="text-white">View system activity logs</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
