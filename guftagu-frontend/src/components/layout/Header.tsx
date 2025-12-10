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
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-lg shadow-black/10 px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-all group-hover:scale-105">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white drop-shadow-sm">Guftagu</span>
            </Link>

            {/* Online Count */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-gray-400'}`} />
              <span className="text-sm text-white/80">
                <span className="font-semibold text-white">{onlineCount.toLocaleString()}</span> online
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-lg shadow-white/20'
                        : 'text-white/80 hover:text-white hover:bg-white/15 border border-transparent hover:border-white/20'
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
                    className="relative p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 border border-transparent hover:border-white/20 transition-all"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-cyan-400 rounded-full text-[10px] font-bold flex items-center justify-center text-gray-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/15 transition-all border border-transparent hover:border-white/20"
                    >
                      <Avatar
                        src={user?.profilePicture}
                        alt={user?.displayName || user?.username || ''}
                        size="sm"
                        isOnline={true}
                      />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="font-medium text-white">{user?.displayName || user?.username}</p>
                          <p className="text-sm text-white/60">@{user?.username}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10"
                          >
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>
                          <Link
                            href="/profile/edit"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                          {user?.isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10"
                            >
                              <Settings className="w-4 h-4" />
                              <span>Admin Panel</span>
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-white/10 py-1">
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              logout();
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-white/10 w-full"
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
                    <button className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 border border-transparent hover:border-white/20 text-sm font-medium transition-all">
                      Login
                    </button>
                  </Link>
                  <Link href="/login">
                    <button className="px-4 py-2 rounded-xl bg-white text-gray-900 hover:bg-white/90 text-sm font-medium shadow-lg shadow-white/20 transition-all hover:scale-105">
                      Get Started
                    </button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 border border-transparent hover:border-white/20 transition-all"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 mt-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/10 rounded-xl mb-4">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm text-white/80">
                <span className="font-semibold text-white">{onlineCount.toLocaleString()}</span> online
              </span>
            </div>
            <nav className="space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'text-white/80 hover:text-white hover:bg-white/15'
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
