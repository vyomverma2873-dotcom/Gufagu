'use client';

import { Handshake, TrendingUp, Users, Zap, Building2, Globe, Mail, CheckCircle } from 'lucide-react';

export default function PartnershipsPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Handshake className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Partnerships</h1>
          <p className="text-xl text-neutral-400">
            Let's grow together and create meaningful connections
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <p className="text-neutral-300 leading-relaxed text-center max-w-3xl mx-auto">
            At Guftagu, we believe in the power of collaboration. We're always looking for strategic partnerships that align with our mission to connect people and create meaningful digital experiences. Whether you're a technology provider, content creator, or business looking to integrate our services, we'd love to hear from you.
          </p>
        </div>

        {/* Partnership Types */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">Partnership Opportunities</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <Building2 className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Strategic Partners</h3>
              <p className="text-neutral-400">
                Join forces with us to expand market reach, co-develop features, and create value for both our user bases.
              </p>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <Zap className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Technology Partners</h3>
              <p className="text-neutral-400">
                Integrate your services, APIs, or infrastructure with our platform to enhance functionality and user experience.
              </p>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <Users className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Content Partners</h3>
              <p className="text-neutral-400">
                Collaborate with us to create engaging content, educational resources, or community initiatives.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-semibold text-white">Partnership Benefits</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-2">Access to Growing User Base</h3>
                  <p className="text-neutral-400 text-sm">
                    Reach our engaged community of users across multiple regions and demographics.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-2">Co-Marketing Opportunities</h3>
                  <p className="text-neutral-400 text-sm">
                    Joint marketing campaigns, co-branded content, and shared promotional efforts.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-2">Technical Support</h3>
                  <p className="text-neutral-400 text-sm">
                    Dedicated integration support and technical documentation to ensure smooth collaboration.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-2">Revenue Sharing</h3>
                  <p className="text-neutral-400 text-sm">
                    Mutually beneficial revenue models that reward successful partnerships.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Who We're Looking For */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-semibold text-white">Who We're Looking For</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Technology & Infrastructure Providers</h3>
              <p className="text-neutral-400 text-sm">
                CDN providers, cloud infrastructure, security solutions, payment gateways, analytics platforms, and communication technologies.
              </p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Educational Institutions</h3>
              <p className="text-neutral-400 text-sm">
                Universities, language schools, and educational platforms interested in facilitating cross-cultural communication and learning.
              </p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Business & Enterprise Solutions</h3>
              <p className="text-neutral-400 text-sm">
                Companies looking to integrate video communication features, customer engagement tools, or networking capabilities.
              </p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Media & Content Creators</h3>
              <p className="text-neutral-400 text-sm">
                Influencers, content studios, and media companies interested in collaborative content creation and audience engagement.
              </p>
            </div>
          </div>
        </div>

        {/* Partnership Process */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">Partnership Process</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-semibold">1</div>
              <h3 className="font-semibold text-white mb-2 text-sm">Initial Contact</h3>
              <p className="text-neutral-400 text-xs">Reach out with your proposal</p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-semibold">2</div>
              <h3 className="font-semibold text-white mb-2 text-sm">Discussion</h3>
              <p className="text-neutral-400 text-xs">Explore mutual benefits and goals</p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-semibold">3</div>
              <h3 className="font-semibold text-white mb-2 text-sm">Agreement</h3>
              <p className="text-neutral-400 text-xs">Finalize terms and collaboration model</p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-semibold">4</div>
              <h3 className="font-semibold text-white mb-2 text-sm">Launch</h3>
              <p className="text-neutral-400 text-xs">Begin collaboration and grow together</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg text-center">
          <Mail className="w-12 h-12 text-white mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-4">Start a Partnership</h2>
          <p className="text-neutral-300 mb-6 max-w-2xl mx-auto">
            Interested in partnering with Guftagu? We'd love to hear about your ideas and explore how we can work together.
          </p>
          <a href="mailto:vyomverma2873@gmail.com" className="text-white hover:underline font-medium text-lg">
            vyomverma2873@gmail.com
          </a>
          <p className="text-neutral-500 text-sm mt-4">
            Please include details about your organization and partnership proposal.
          </p>
        </div>
      </div>
    </div>
  );
}
