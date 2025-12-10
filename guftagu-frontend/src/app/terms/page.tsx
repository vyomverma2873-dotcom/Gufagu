'use client';

import { FileText, Shield, AlertTriangle, Scale, Ban } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Scale className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-xl text-neutral-400">Last updated: December 2024</p>
        </div>

        {/* Quick Overview */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <p className="text-neutral-300 leading-relaxed">
            By accessing or using Guftagu, you agree to be bound by these Terms of Service. Please read them carefully. If you do not agree with any part of these terms, you may not use our service.
          </p>
        </div>

        <div className="space-y-6">
          {/* Acceptance of Terms */}
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-semibold text-white">1. Acceptance of Terms</h2>
            </div>
            <p className="text-neutral-300">
              By accessing or using Guftagu, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </div>

          {/* Service Description */}
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-neutral-300 mb-4">
              Guftagu is a communication platform that allows users to connect through video and text conversations. The service includes:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4">
                <p className="text-neutral-400 text-sm">Friend system and direct messaging</p>
              </div>
              <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4">
                <p className="text-neutral-400 text-sm">User profiles and customization</p>
              </div>
              <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4">
                <p className="text-neutral-400 text-sm">Video and voice calling features</p>
              </div>
              <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4">
                <p className="text-neutral-400 text-sm">Reporting and moderation features</p>
              </div>
            </div>
          </div>

          {/* User Eligibility */}
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-semibold text-white">3. User Eligibility</h2>
            </div>
            <p className="text-neutral-300">
              You must be at least 18 years of age to use Guftagu. By using this service, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms of Service.
            </p>
          </div>

          {/* User Conduct */}
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Ban className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-semibold text-white">4. User Conduct</h2>
            </div>
            <p className="text-neutral-300 mb-4">You agree not to:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-3 text-neutral-400">
                <span className="text-white mt-1">•</span>
                <span>Use the service for any illegal purpose or violate any laws</span>
              </li>
              <li className="flex items-start gap-3 text-neutral-400">
                <span className="text-white mt-1">•</span>
                <span>Harass, abuse, threaten, or harm other users</span>
              </li>
              <li className="flex items-start gap-3 text-neutral-400">
                <span className="text-white mt-1">•</span>
                <span>Share explicit, offensive, or inappropriate content</span>
              </li>
              <li className="flex items-start gap-3 text-neutral-400">
                <span className="text-white mt-1">•</span>
                <span>Attempt to circumvent security measures or access unauthorized areas</span>
              </li>
              <li className="flex items-start gap-3 text-neutral-400">
                <span className="text-white mt-1">•</span>
                <span>Create multiple accounts to evade bans or restrictions</span>
              </li>
              <li className="flex items-start gap-3 text-neutral-400">
                <span className="text-white mt-1">•</span>
                <span>Share personal information of other users without explicit consent</span>
              </li>
              <li className="flex items-start gap-3 text-neutral-400">
                <span className="text-white mt-1">•</span>
                <span>Use automated systems, bots, or scripts to access the service</span>
              </li>
            </ul>
          </div>

          {/* Additional Terms in Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-3">5. Account Termination</h2>
              <p className="text-neutral-400 text-sm">
                We reserve the right to terminate or suspend your account at any time for violations of these Terms of Service. Severe violations may result in immediate termination without prior notice.
              </p>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-3">6. Privacy</h2>
              <p className="text-neutral-400 text-sm">
                Your use of Guftagu is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding your personal information.
              </p>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-3">7. Disclaimer</h2>
              <p className="text-neutral-400 text-sm">
                Guftagu is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free. We are not responsible for user conduct or content shared.
              </p>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
              <p className="text-neutral-400 text-sm">
                In no event shall Guftagu be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the service.
              </p>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-3">9. Changes to Terms</h2>
              <p className="text-neutral-400 text-sm">
                We reserve the right to modify these Terms at any time. We will notify users of significant changes. Continued use after changes constitutes acceptance of the new terms.
              </p>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
              <p className="text-neutral-400 text-sm mb-2">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <a href="mailto:vyomverma2873@gmail.com" className="text-white hover:underline text-sm font-medium">
                vyomverma2873@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Warning Box */}
        <div className="mt-8 bg-neutral-800/60 border border-neutral-700/50 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <p className="text-neutral-400 text-sm">
              By continuing to use Guftagu, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
