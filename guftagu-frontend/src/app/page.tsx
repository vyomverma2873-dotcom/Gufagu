'use client';

import Link from 'next/link';
import { Users, Shield, Zap, MessageSquare, Globe, ArrowRight, Sparkles } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { onlineCount, isConnected } = useSocket();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Determine chat destination - if still loading, default to chat (will check auth there)
  const chatHref = authLoading ? '/chat' : (isAuthenticated ? '/chat' : '/login');

  const features = [
    {
      icon: Sparkles,
      title: 'HD Video Chat',
      description: 'Crystal clear video and audio for seamless conversations.',
    },
    {
      icon: Users,
      title: 'Random Matching',
      description: 'Connect instantly with people who share your interests.',
    },
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'Your privacy is our priority with advanced security.',
    },
    {
      icon: Zap,
      title: 'Instant Connect',
      description: 'No waiting. Start chatting in seconds.',
    },
    {
      icon: MessageSquare,
      title: 'Text & Video',
      description: 'Chat via text alongside video or independently.',
    },
    {
      icon: Globe,
      title: 'Global Community',
      description: 'Meet people from every corner of the world.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Connect.
                <br />
                <span className="text-neutral-400">Discover.</span>
                <br />
                <span className="text-neutral-500">Explore.</span>
              </h1>

              <p className="text-lg text-neutral-400 max-w-lg mb-10 leading-relaxed">
                Meet people from around the world through random video chats. 
                Make meaningful connections, anytime.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={chatHref}>
                  <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-neutral-900 rounded-xl font-medium shadow-lg shadow-white/10 hover:shadow-white/20 transition-all hover:scale-[1.02]">
                    Start Chatting
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Content - How to Use */}
            <div className="bg-neutral-900/80 backdrop-blur-2xl border border-neutral-700/50 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-xl font-semibold text-white mb-6">How to Get Started?</h3>
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white font-semibold text-sm">1</div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Create Your Account</h4>
                    <p className="text-sm text-neutral-400">Sign up with your email to get started. It takes less than a minute.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white font-semibold text-sm">2</div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Find Friends</h4>
                    <p className="text-sm text-neutral-400">Discover and connect with people who share your interests.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white font-semibold text-sm">3</div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Start Conversations</h4>
                    <p className="text-sm text-neutral-400">Chat via text, voice, or video with your new connections.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white font-semibold text-sm">4</div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Build Your Network</h4>
                    <p className="text-sm text-neutral-400">Maintain meaningful relationships and expand your social circle.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Guftagu?
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Features designed for seamless, meaningful connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-6 bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/50 rounded-2xl hover:bg-neutral-900/80 hover:border-neutral-700/50 transition-all"
                >
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-neutral-900/80 backdrop-blur-2xl border border-neutral-700/50 rounded-3xl p-10 md:p-14 shadow-2xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Connect?
            </h2>
            <p className="text-neutral-400 max-w-md mx-auto mb-8">
              Join thousands making meaningful connections every day.
            </p>
            <Link href={chatHref}>
              <button className="inline-flex items-center gap-2 px-8 py-3 bg-white text-neutral-900 rounded-xl font-medium shadow-lg shadow-white/10 hover:shadow-white/20 transition-all hover:scale-[1.02]">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
