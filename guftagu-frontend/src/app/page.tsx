'use client';

import Link from 'next/link';
import { Video, Users, Shield, Zap, MessageSquare, Globe } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { onlineCount, isConnected } = useSocket();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Video,
      title: 'HD Video Chat',
      description: 'Crystal clear video and audio for seamless conversations with people worldwide.',
    },
    {
      icon: Users,
      title: 'Random Matching',
      description: 'Connect instantly with strangers who share your interests.',
    },
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'Your privacy is our priority. Report and block features keep you safe.',
    },
    {
      icon: Zap,
      title: 'Instant Connections',
      description: 'No waiting, no signup required. Start chatting in seconds.',
    },
    {
      icon: MessageSquare,
      title: 'Text & Video',
      description: 'Chat via text alongside video, or use either independently.',
    },
    {
      icon: Globe,
      title: 'Global Community',
      description: 'Meet people from every corner of the world, 24/7.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/20 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            {/* Online count badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-full mb-8">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="text-sm text-zinc-300">
                <span className="font-bold text-white">{onlineCount.toLocaleString()}</span> users online now
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Meet New People
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Anywhere, Anytime
              </span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
              Connect with strangers from around the world through random video chats. 
              Make new friends, have conversations, and explore different cultures.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isAuthenticated ? '/chat' : '/login'}>
                <Button size="lg" className="w-full sm:w-auto px-8">
                  <Video className="w-5 h-5 mr-2" />
                  Start Video Chat
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                  Try as Guest
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose Guftagu?
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Experience the best in random video chat with features designed for seamless connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl hover:border-violet-500/50 transition-colors"
                >
                  <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-purple-600 p-12 md:p-16">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Start Chatting?
              </h2>
              <p className="text-lg text-violet-100 max-w-xl mx-auto mb-8">
                Join thousands of users already making meaningful connections on Guftagu.
              </p>
              <Link href={isAuthenticated ? '/chat' : '/login'}>
                <Button variant="secondary" size="lg" className="bg-white text-violet-600 hover:bg-zinc-100">
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
