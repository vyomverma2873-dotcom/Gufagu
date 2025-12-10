'use client';

import { Target, Heart, Globe, Users, Lightbulb, TrendingUp } from 'lucide-react';

export default function MissionPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Target className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Our Mission</h1>
          <p className="text-xl text-neutral-400">
            Building bridges, fostering connections, creating community
          </p>
        </div>

        {/* Main Mission Statement */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-10 shadow-lg mb-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Connecting People, Enriching Lives</h2>
          <p className="text-neutral-300 leading-relaxed text-lg text-center max-w-3xl mx-auto">
            Our mission is to connect people worldwide through meaningful conversations, fostering understanding and building bridges across cultures, languages, and communities. We believe that authentic human connection has the power to break down barriers and create a more understanding world.
          </p>
        </div>

        {/* Core Values */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <Heart className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Authenticity</h3>
              <p className="text-neutral-400">
                We promote genuine connections and authentic conversations. Our platform encourages users to be themselves and connect on a real, human level.
              </p>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <Globe className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Inclusivity</h3>
              <p className="text-neutral-400">
                We welcome people from all backgrounds, cultures, and walks of life. Diversity makes our community stronger and more vibrant.
              </p>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <Users className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Safety</h3>
              <p className="text-neutral-400">
                User safety and privacy are paramount. We implement robust moderation and security measures to create a safe environment for all.
              </p>
            </div>
          </div>
        </div>

        {/* Vision for the Future */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-semibold text-white">Our Vision</h2>
          </div>
          <div className="space-y-4 text-neutral-300">
            <p>
              We envision a world where geographical boundaries don't limit human connection. Through technology, we're creating opportunities for people to discover new perspectives, learn from diverse experiences, and build lasting relationships.
            </p>
            <p>
              Our platform serves as a catalyst for cross-cultural understanding, enabling users to explore the world from their home, one conversation at a time.
            </p>
          </div>
        </div>

        {/* Goals */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-semibold text-white">Our Goals</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2">Foster Global Understanding</h3>
              <p className="text-neutral-400 text-sm">
                Create meaningful connections that bridge cultural divides and promote mutual understanding.
              </p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2">Ensure User Safety</h3>
              <p className="text-neutral-400 text-sm">
                Maintain the highest standards of privacy, security, and community moderation.
              </p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2">Continuous Innovation</h3>
              <p className="text-neutral-400 text-sm">
                Constantly improve our platform with new features that enhance user experience.
              </p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2">Build Community</h3>
              <p className="text-neutral-400 text-sm">
                Create a welcoming space where lasting friendships and meaningful relationships can flourish.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
