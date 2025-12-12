'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, Video, AlertTriangle, Shield, TrendingUp, Activity, 
  BarChart3, Clock, UserCheck, UserX, MessageSquare, Mail, ArrowRight, ChevronRight
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  usersToday: number;
  usersThisMonth: number;
  userGrowth: string;
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
  link,
  highlight
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  change?: string; 
  link?: string;
  highlight?: boolean;
}) {
  const content = (
    <div className={`bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-5 hover:border-neutral-600/50 transition-all duration-200 ${link ? 'cursor-pointer hover:shadow-lg hover:shadow-white/5' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 bg-gradient-to-br from-white to-neutral-200 rounded-xl shadow-sm">
          <Icon className="w-5 h-5 text-neutral-800" />
        </div>
        {change !== undefined && change !== null && (
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${parseFloat(change) >= 0 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
            {parseFloat(change) >= 0 ? '+' : ''}{change}%
          </span>
        )}
        {link && <ChevronRight className="w-4 h-4 text-neutral-500" />}
      </div>
      <p className={`text-2xl font-bold mb-0.5 ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
      <p className="text-sm text-neutral-400">{title}</p>
    </div>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}

function QuickActionButton({ href, icon: Icon, label, badge }: { href: string; icon: any; label: string; badge?: number }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-br from-white to-neutral-100 text-neutral-900 rounded-xl font-medium shadow-lg shadow-white/10 hover:shadow-white/20 transition-all hover:scale-[1.02] text-sm"
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge ? (
        <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-semibold">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Card */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-white to-neutral-200 rounded-xl">
                  <Shield className="w-5 h-5 text-neutral-800" />
                </div>
                Admin Dashboard
              </h1>
              <p className="text-neutral-400 mt-1 text-sm">Platform overview and management controls</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <QuickActionButton href="/admin/users" icon={Users} label="Manage Users" />
            <QuickActionButton href="/admin/reports" icon={AlertTriangle} label="View Reports" badge={stats?.pendingReports || undefined} />
            <QuickActionButton href="/admin/contact-queries" icon={Mail} label="Contact Queries" />
            <QuickActionButton href="/admin/chats" icon={MessageSquare} label="Export Chats" />
            <QuickActionButton href="/admin/bans" icon={Shield} label="Active Bans" />
            <QuickActionButton href="/admin/logs" icon={Activity} label="System Logs" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers?.toLocaleString() || '0'}
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
            title="This Month"
            value={stats?.usersThisMonth || 0}
            icon={TrendingUp}
          />
          <StatCard
            title="Banned Users"
            value={stats?.bannedUsers || 0}
            icon={UserX}
            link="/admin/bans"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            title="Total Reports"
            value={stats?.totalReports || 0}
            icon={AlertTriangle}
          />
        </div>

        {/* Bottom Grid - Quick Stats & Admin Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Stats Card */}
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-gradient-to-br from-white to-neutral-200 rounded-xl">
                <Clock className="w-4 h-4 text-neutral-800" />
              </div>
              <h2 className="text-lg font-semibold text-white">Monthly Overview</h2>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-neutral-800/50 transition-colors">
                <span className="text-neutral-400">Users this month</span>
                <span className="text-white font-semibold bg-neutral-800 px-3 py-1 rounded-lg">{stats?.usersThisMonth || 0}</span>
              </div>
              <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-neutral-800/50 transition-colors">
                <span className="text-neutral-400">Matches this month</span>
                <span className="text-white font-semibold bg-neutral-800 px-3 py-1 rounded-lg">{stats?.matchesThisMonth || 0}</span>
              </div>
              <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-neutral-800/50 transition-colors">
                <span className="text-neutral-400">Reports today</span>
                <span className="text-white font-semibold bg-neutral-800 px-3 py-1 rounded-lg">{stats?.reportsToday || 0}</span>
              </div>
              <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-neutral-800/50 transition-colors">
                <span className="text-neutral-400">Total reports</span>
                <span className="text-white font-semibold bg-neutral-800 px-3 py-1 rounded-lg">{stats?.totalReports || 0}</span>
              </div>
            </div>
          </div>

          {/* Admin Actions Card */}
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-gradient-to-br from-white to-neutral-200 rounded-xl">
                <Shield className="w-4 h-4 text-neutral-800" />
              </div>
              <h2 className="text-lg font-semibold text-white">Admin Actions</h2>
            </div>
            <div className="space-y-2">
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-4 bg-neutral-800/50 hover:bg-neutral-800 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                  <span className="text-white">Search and manage users</span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
              <Link
                href="/admin/reports?status=pending"
                className="flex items-center justify-between p-4 bg-neutral-800/50 hover:bg-neutral-800 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                  <span className="text-white">Review pending reports</span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
              <Link
                href="/admin/contact-queries"
                className="flex items-center justify-between p-4 bg-neutral-800/50 hover:bg-neutral-800 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                  <span className="text-white">Manage contact queries</span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
              <Link
                href="/admin/bans"
                className="flex items-center justify-between p-4 bg-neutral-800/50 hover:bg-neutral-800 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <UserX className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                  <span className="text-white">Manage active bans</span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
              <Link
                href="/admin/logs"
                className="flex items-center justify-between p-4 bg-neutral-800/50 hover:bg-neutral-800 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                  <span className="text-white">View system activity logs</span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
