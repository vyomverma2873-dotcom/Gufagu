'use client';

import { Lock, Shield, Eye, Database, UserCheck, Cookie, AlertTriangle } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Lock className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-xl text-neutral-400">Last updated: December 2024</p>
        </div>

        {/* Introduction */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <p className="text-neutral-300 leading-relaxed">
            At Guftagu, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our video chat platform. By using Guftagu, you agree to the collection and use of information in accordance with this policy.
          </p>
        </div>

        <div className="space-y-6">
          {/* Information We Collect */}
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-semibold text-white">Information We Collect</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Personal Information</h3>
                <ul className="space-y-2 text-neutral-400 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-1">•</span>
                    <span>Email address (for authentication)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-1">•</span>
                    <span>Username and display name</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-1">•</span>
                    <span>Profile picture (if uploaded)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-1">•</span>
                    <span>Bio and interests</span>
                  </li>
                </ul>
              </div>
              <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Usage Data</h3>
                <ul className="space-y-2 text-neutral-400 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-1">•</span>
                    <span>IP address and device information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-1">•</span>
                    <span>Browser type and version</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-1">•</span>
                    <span>Pages visited and features used</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-1">•</span>
                    <span>Time and date of visits</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* How We Use Your Information */}
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <UserCheck className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-semibold text-white">How We Use Your Information</h2>
            </div>
            <p className="text-neutral-300 mb-4">We use the collected information to:</p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Provide and maintain our service',
                'Authenticate and manage user accounts',
                'Send verification codes and notifications',
                'Connect users for video and text chats',
                'Improve and optimize our platform',
                'Detect and prevent fraud or abuse',
                'Respond to support requests',
                'Analyze usage patterns and trends'
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-neutral-400 text-sm">
                  <span className="text-white mt-0.5">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Video Chat Privacy */}
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-semibold text-white">Video Chat Privacy</h2>
            </div>
            <p className="text-neutral-300 mb-4">
              Guftagu uses peer-to-peer WebRTC connections for video chats. This means:
            </p>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <ul className="space-y-3 text-neutral-400">
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span>Video and audio streams are transmitted directly between users</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span>Conversations are not stored on our servers</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span>We do not record or monitor video chat content</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span>End-to-end encrypted connections for maximum privacy</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Grid Layout for Additional Sections */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Data Security</h2>
              </div>
              <p className="text-neutral-400 text-sm mb-3">
                We implement industry-standard security measures:
              </p>
              <ul className="space-y-2 text-neutral-400 text-sm">
                <li>• Encrypted data transmission (HTTPS/TLS)</li>
                <li>• Secure authentication system</li>
                <li>• Regular security audits</li>
                <li>• Limited access to personal data</li>
              </ul>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Data Sharing</h2>
              <p className="text-neutral-400 text-sm mb-3">
                We do not sell your personal information. We may share data with:
              </p>
              <ul className="space-y-2 text-neutral-400 text-sm">
                <li>• Service providers who assist in operating our platform</li>
                <li>• Law enforcement when required by law</li>
                <li>• Other users (only information you choose to make public)</li>
              </ul>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Your Rights</h2>
              <p className="text-neutral-400 text-sm mb-3">You have the right to:</p>
              <ul className="space-y-2 text-neutral-400 text-sm">
                <li>• Access your personal data</li>
                <li>• Correct inaccurate information</li>
                <li>• Request deletion of your account</li>
                <li>• Export your data</li>
                <li>• Opt out of marketing communications</li>
              </ul>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Cookie className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Cookies</h2>
              </div>
              <p className="text-neutral-400 text-sm">
                We use essential cookies to maintain your session and preferences. These are necessary for the platform to function properly. We do not use tracking or advertising cookies.
              </p>
            </div>
          </div>

          {/* Children's Privacy Warning */}
          <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-2">Children's Privacy</h3>
                <p className="text-neutral-400 text-sm">
                  Guftagu is not intended for users under 18 years of age. We do not knowingly collect information from minors. If we discover that a minor has provided us with personal information, we will delete it immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us About Privacy</h2>
            <p className="text-neutral-300 mb-4">
              If you have questions about this Privacy Policy or how we handle your data, please contact us:
            </p>
            <a href="mailto:vyomverma2873@gmail.com" className="text-white hover:underline font-medium">
              vyomverma2873@gmail.com
            </a>
            <p className="text-neutral-500 text-sm mt-4">
              We will respond to your privacy-related inquiries within 48 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
