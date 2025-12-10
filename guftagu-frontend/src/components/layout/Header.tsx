'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Video, Users, MessageSquare, Bell, User, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useNotifications } from '@/contexts/NotificationContext';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { onlineCount, isConnected } = useSocket();
  const { unreadCount } = useNotifications();

  const navLinks = [
    { href: '/chat', label: 'Video Chat', icon: Video },
    { href: '/friends', label: 'Friends', icon: Users },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-cyan-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Guftagu</span>
          </Link>

          {/* Online Count */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-cyan-900/30 rounded-full">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400' : 'bg-slate-500'}`} />
            <span className="text-sm text-slate-300">
              <span className="font-semibold text-cyan-400">{onlineCount.toLocaleString()}</span> online
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link
                  href="/notifications"
                  className="relative p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-cyan-500 rounded-full text-[10px] font-bold flex items-center justify-center text-slate-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors ring-1 ring-transparent hover:ring-cyan-500/30"
                  >
                    <Avatar
                      src={user?.profilePicture}
                      alt={user?.displayName || user?.username || ''}
                      size="sm"
                      isOnline={true}
                    />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-cyan-900/30 rounded-xl shadow-xl shadow-cyan-900/10 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-800">
                        <p className="font-medium text-white">{user?.displayName || user?.username}</p>
                        <p className="text-sm text-slate-400">@{user?.username}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          href="/profile/edit"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </Link>
                        {user?.isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-slate-800 py-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-slate-800/60 w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cyan-900/30 bg-slate-950/95 backdrop-blur-xl">
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-cyan-900/30 rounded-lg mb-4">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-sm text-slate-300">
                <span className="font-semibold text-cyan-400">{onlineCount.toLocaleString()}</span> online
              </span>
            </div>
            <nav className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
