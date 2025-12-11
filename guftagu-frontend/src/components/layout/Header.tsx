'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, MessageSquare, Bell, User, Settings, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useNotifications } from '@/contexts/NotificationContext';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const { onlineCount, isConnected } = useSocket();
  const { unreadCount } = useNotifications();

  // Track page loading state
  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => setIsPageLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  const navLinks = [
    { href: '/friends', label: 'Friends', icon: Users },
    { href: '/messages', label: 'Messages', icon: Sparkles },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Loading bar */}
      {(isPageLoading || authLoading) && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent overflow-hidden">
          <div className="h-full w-1/3 bg-white animate-[loading_1s_ease-in-out_infinite]" />
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="bg-neutral-900/80 backdrop-blur-2xl border border-neutral-700/50 rounded-2xl shadow-2xl shadow-black/20 px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Premium graphical design */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white via-neutral-100 to-neutral-200 flex items-center justify-center shadow-lg shadow-white/10 group-hover:shadow-white/25 transition-all duration-300 overflow-hidden">
                  {/* Premium overlapping speech bubbles */}
                  <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
                    {/* Back bubble - slightly offset */}
                    <path 
                      d="M8 6C6.89543 6 6 6.89543 6 8V15C6 16.1046 6.89543 17 8 17H9V20L12 17H18C19.1046 17 20 16.1046 20 15V8C20 6.89543 19.1046 6 18 6H8Z" 
                      className="fill-neutral-400"
                    />
                    {/* Front bubble - overlapping */}
                    <path 
                      d="M14 10C12.8954 10 12 10.8954 12 12V19C12 20.1046 12.8954 21 14 21H20L24 25V21H24C25.1046 21 26 20.1046 26 19V12C26 10.8954 25.1046 10 24 10H14Z" 
                      className="fill-neutral-800"
                    />
                    {/* Subtle accent dots on front bubble */}
                    <circle cx="16" cy="15.5" r="1" className="fill-white/90" />
                    <circle cx="19" cy="15.5" r="1" className="fill-white/90" />
                    <circle cx="22" cy="15.5" r="1" className="fill-white/90" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-neutral-900"></div>
              </div>
              <span className="text-xl font-bold text-white tracking-tight group-hover:text-neutral-100 transition-colors font-[family-name:var(--font-poppins)]">
                Guftagu
              </span>
            </Link>

            {/* Online Count */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-800/60 border border-neutral-700/50 rounded-xl">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
              <span className="text-sm text-neutral-400">
                <span className="font-medium text-white">{onlineCount.toLocaleString()}</span> online
              </span>
            </div>

            {/* Desktop Navigation - Only for authenticated users */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-neutral-900 font-medium shadow-lg shadow-white/10'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {authLoading ? (
                // Loading skeleton - prevents flash of logged-out state
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-neutral-800/60 animate-pulse" />
                  <div className="w-9 h-9 rounded-xl bg-neutral-800/60 animate-pulse" />
                </div>
              ) : isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <Link
                    href="/notifications"
                    className="relative p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-all"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full text-[10px] font-bold flex items-center justify-center text-neutral-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-neutral-800/60 transition-all"
                    >
                      <Avatar
                        src={user?.profilePicture}
                        alt={user?.displayName || user?.username || ''}
                        size="sm"
                        isOnline={true}
                      />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-neutral-900/95 backdrop-blur-2xl border border-neutral-700/50 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-neutral-800">
                          <p className="font-medium text-white">{user?.displayName || user?.username}</p>
                          <p className="text-sm text-neutral-500">@{user?.username}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                          >
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>
                          <Link
                            href="/profile/edit"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                          {user?.isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                            >
                              <Settings className="w-4 h-4" />
                              <span>Admin Panel</span>
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-neutral-800 py-1">
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              logout();
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-neutral-800/60 w-full"
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
                    <button className="px-5 py-2 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 text-sm font-medium shadow-lg shadow-white/10 transition-all">
                      Login
                    </button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-all"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Only for authenticated users */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden px-4 pb-3">
          <div className="bg-neutral-900/95 backdrop-blur-2xl border border-neutral-700/50 rounded-2xl p-4 mt-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-neutral-800/60 border border-neutral-700/50 rounded-xl mb-4">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
              <span className="text-sm text-neutral-400">
                <span className="font-medium text-white">{onlineCount.toLocaleString()}</span> online
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-white text-neutral-900 font-medium shadow-lg'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
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
