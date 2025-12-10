'use client';

import { Shield, Copyright as CopyrightIcon, FileText, AlertCircle } from 'lucide-react';

export default function CopyrightPage() {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <CopyrightIcon className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Copyright Notice</h1>
          <p className="text-xl text-neutral-400">
            Protecting our intellectual property and your rights
          </p>
        </div>

        {/* Main Copyright Notice */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Copyright Information</h2>
          <div className="space-y-4 text-neutral-300">
            <p>
              © {currentYear} Guftagu Platform. All rights reserved.
            </p>
            <p>
              This website and all of its original content, features, and functionality are owned by Guftagu and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
            </p>
            <p className="text-neutral-400 text-sm">
              Website created and maintained by <span className="text-white font-medium">Vyom Verma</span>, Full-Stack Developer.
            </p>
          </div>
        </div>

        {/* Protected Materials */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-semibold text-white">Protected Materials</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Source Code</h3>
              <p className="text-neutral-400 text-sm">
                All source code, algorithms, and technical implementations are proprietary and protected by copyright. Unauthorized copying, modification, or distribution is strictly prohibited.
              </p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Design & UI</h3>
              <p className="text-neutral-400 text-sm">
                The visual design, user interface, layout, graphics, and overall look and feel of Guftagu are protected by copyright and may not be reproduced without permission.
              </p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Content & Text</h3>
              <p className="text-neutral-400 text-sm">
                All written content, including but not limited to text, documentation, blog posts, and marketing materials, is protected by copyright.
              </p>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Trademarks</h3>
              <p className="text-neutral-400 text-sm">
                The Guftagu name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Guftagu Platform.
              </p>
            </div>
          </div>
        </div>

        {/* Usage Rights */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-semibold text-white">Permitted Use</h2>
          </div>
          <div className="space-y-4 text-neutral-300">
            <div>
              <h3 className="font-semibold text-white mb-2">You May:</h3>
              <ul className="list-disc list-inside space-y-2 text-neutral-400 ml-4">
                <li>Use the Guftagu platform for personal, non-commercial purposes</li>
                <li>Share links to Guftagu content with proper attribution</li>
                <li>Quote brief excerpts with appropriate citation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">You May Not:</h3>
              <ul className="list-disc list-inside space-y-2 text-neutral-400 ml-4">
                <li>Copy, modify, or distribute any part of the website without written permission</li>
                <li>Use our content for commercial purposes without authorization</li>
                <li>Remove or alter any copyright notices or attributions</li>
                <li>Reverse engineer, decompile, or disassemble any software</li>
                <li>Create derivative works based on Guftagu content</li>
              </ul>
            </div>
          </div>
        </div>

        {/* DMCA Notice */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-semibold text-white">Copyright Infringement</h2>
          </div>
          <div className="space-y-4 text-neutral-300">
            <p>
              We respect the intellectual property rights of others and expect our users to do the same. If you believe that your work has been copied in a way that constitutes copyright infringement, please contact us immediately.
            </p>
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Report Copyright Violation</h3>
              <p className="text-neutral-400 mb-3">
                To file a DMCA notice or report copyright infringement, please email:
              </p>
              <a href="mailto:vyomverma2873@gmail.com" className="text-white hover:underline font-medium">
                vyomverma2873@gmail.com
              </a>
              <p className="text-neutral-500 text-sm mt-4">
                Please include: your contact information, description of the copyrighted work, location of the infringing material, and a statement of good faith belief that the use is not authorized.
              </p>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-8 text-center">
          <p className="text-neutral-500 text-sm">
            Last updated: December {currentYear}
          </p>
        </div>
      </div>
    </div>
  );
}
