'use client';

import { Briefcase, Users, Lightbulb, TrendingUp, Heart, Zap, Mail, Code } from 'lucide-react';

export default function CareersPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Briefcase className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Work With Us</h1>
          <p className="text-xl text-neutral-400">
            Join our team and help build the future of digital communication
          </p>
        </div>

        {/* Why Join Us */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">Why Join Guftagu?</h2>
          <p className="text-neutral-300 leading-relaxed text-center max-w-3xl mx-auto">
            At Guftagu, we're building more than just a platform—we're creating meaningful connections across the globe. Join a passionate team dedicated to innovation, user experience, and making the world a smaller, more connected place.
          </p>
        </div>

        {/* Company Culture */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">Our Culture</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <Lightbulb className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Innovation First</h3>
              <p className="text-neutral-400">
                We encourage creative thinking and new ideas. Your voice matters, and we're always looking for better ways to solve problems.
              </p>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <Users className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Collaborative Team</h3>
              <p className="text-neutral-400">
                Work alongside talented individuals who are passionate about technology and making a difference in people's lives.
              </p>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <Heart className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Work-Life Balance</h3>
              <p className="text-neutral-400">
                We believe in sustainable productivity. Flexible working hours and remote-friendly policies help you do your best work.
              </p>
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Code className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-semibold text-white">Current Openings</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Full-Stack Developer</h3>
                  <p className="text-neutral-400 text-sm">Remote • Full-time</p>
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm">Open</span>
              </div>
              <p className="text-neutral-400 text-sm mb-3">
                Build and maintain our web application using React, Node.js, and MongoDB. Experience with WebRTC is a plus.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-neutral-700/50 rounded text-neutral-300 text-xs">React</span>
                <span className="px-2 py-1 bg-neutral-700/50 rounded text-neutral-300 text-xs">Node.js</span>
                <span className="px-2 py-1 bg-neutral-700/50 rounded text-neutral-300 text-xs">MongoDB</span>
                <span className="px-2 py-1 bg-neutral-700/50 rounded text-neutral-300 text-xs">WebRTC</span>
              </div>
            </div>

            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">UI/UX Designer</h3>
                  <p className="text-neutral-400 text-sm">Remote • Full-time</p>
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm">Open</span>
              </div>
              <p className="text-neutral-400 text-sm mb-3">
                Design intuitive and beautiful user experiences. Create wireframes, prototypes, and high-fidelity mockups.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-neutral-700/50 rounded text-neutral-300 text-xs">Figma</span>
                <span className="px-2 py-1 bg-neutral-700/50 rounded text-neutral-300 text-xs">UI Design</span>
                <span className="px-2 py-1 bg-neutral-700/50 rounded text-neutral-300 text-xs">User Research</span>
              </div>
            </div>

            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">DevOps Engineer</h3>
                  <p className="text-neutral-400 text-sm">Remote • Full-time</p>
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm">Open</span>
              </div>
              <p className="text-neutral-400 text-sm mb-3">
                Manage our infrastructure, CI/CD pipelines, and ensure high availability and performance of our services.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-neutral-700/50 rounded text-neutral-300 text-xs">Docker</span>
                <span className="px-2 py-1 bg-neutral-700/50 rounded text-neutral-300 text-xs">AWS</span>
                <span className="px-2 py-1 bg-neutral-700/50 rounded text-neutral-300 text-xs">CI/CD</span>
                <span className="px-2 py-1 bg-neutral-700/50 rounded text-neutral-300 text-xs">Kubernetes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-semibold text-white">Benefits & Perks</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2">Competitive Salary</h3>
              <p className="text-neutral-400 text-sm">
                Industry-standard compensation packages with performance bonuses.
              </p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2">Remote Work</h3>
              <p className="text-neutral-400 text-sm">
                Work from anywhere in the world with flexible hours.
              </p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2">Learning & Development</h3>
              <p className="text-neutral-400 text-sm">
                Budget for courses, conferences, and professional growth.
              </p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2">Health Benefits</h3>
              <p className="text-neutral-400 text-sm">
                Comprehensive health insurance coverage for you and your family.
              </p>
            </div>
          </div>
        </div>

        {/* Application Process */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-semibold text-white">Application Process</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-semibold">1</div>
              <h3 className="font-semibold text-white mb-2 text-sm">Apply</h3>
              <p className="text-neutral-400 text-xs">Submit your resume and portfolio</p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-semibold">2</div>
              <h3 className="font-semibold text-white mb-2 text-sm">Initial Review</h3>
              <p className="text-neutral-400 text-xs">We review your application</p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-semibold">3</div>
              <h3 className="font-semibold text-white mb-2 text-sm">Interview</h3>
              <p className="text-neutral-400 text-xs">Technical and cultural fit assessment</p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-semibold">4</div>
              <h3 className="font-semibold text-white mb-2 text-sm">Offer</h3>
              <p className="text-neutral-400 text-xs">Join the team!</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg text-center">
          <Mail className="w-12 h-12 text-white mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-4">Ready to Apply?</h2>
          <p className="text-neutral-300 mb-6 max-w-2xl mx-auto">
            Send your resume, portfolio, and a brief introduction to:
          </p>
          <a href="mailto:vyomverma2873@gmail.com" className="text-white hover:underline font-medium text-lg">
            vyomverma2873@gmail.com
          </a>
          <p className="text-neutral-500 text-sm mt-4">
            We'll get back to you within 3-5 business days.
          </p>
        </div>
      </div>
    </div>
  );
}
