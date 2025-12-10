'use client';

import { Users, Target, Heart, Code } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">About Guftagu</h1>
          <p className="text-xl text-neutral-400">
            Connecting people through meaningful conversations
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-semibold text-white">Our Mission</h2>
          </div>
          <p className="text-neutral-300 leading-relaxed">
            Guftagu is dedicated to bringing people together from around the world through authentic connections and meaningful conversations. We believe in the power of communication to bridge distances, cultures, and perspectives.
          </p>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
            <Users className="w-8 h-8 text-white mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Community First</h3>
            <p className="text-neutral-400">
              Building a safe, welcoming space where everyone can connect and share their stories.
            </p>
          </div>

          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
            <Heart className="w-8 h-8 text-white mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Privacy & Safety</h3>
            <p className="text-neutral-400">
              Your privacy and security are our top priorities. We use cutting-edge technology to keep you safe.
            </p>
          </div>
        </div>

        {/* Team */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Code className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-semibold text-white">Built by Vyom Verma</h2>
          </div>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Guftagu was created by Vyom Verma, a passionate full-stack developer dedicated to creating platforms that bring people together. With expertise in modern web technologies, Vyom has built Guftagu from the ground up to provide a seamless, secure, and enjoyable experience for users worldwide.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:vyomverma2873@gmail.com" className="text-sm text-neutral-400 hover:text-white transition-colors">
              vyomverma2873@gmail.com
            </a>
            <a href="https://instagram.com/imvyomverma" target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-400 hover:text-white transition-colors">
              @imvyomverma
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
