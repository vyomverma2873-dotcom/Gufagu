'use client';

import { Bug, Mail, Instagram, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function BugReportPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Bug className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Report a Bug</h1>
          <p className="text-xl text-neutral-400">
            Help us improve by reporting issues you encounter
          </p>
        </div>

        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-4">How to Report a Bug</h2>
              <p className="text-neutral-400 mb-6">
                We appreciate you taking the time to help us improve. Please use one of the following methods to report bugs:
              </p>
            </div>

            <div className="grid gap-6">
              {/* Email Contact */}
              <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-2">Email</h3>
                    <p className="text-neutral-400 mb-3">
                      Send detailed bug reports directly to our support team
                    </p>
                    <a
                      href="mailto:vyomverma2873@gmail.com?subject=Bug Report - Guftagu"
                      className="inline-flex items-center gap-2 text-white hover:text-neutral-300 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      vyomverma2873@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Instagram DM */}
              <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-2">Instagram</h3>
                    <p className="text-neutral-400 mb-3">
                      Send a direct message on Instagram for quick bug reports and support
                    </p>
                    <a
                      href="https://instagram.com/imvyomverma"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-white hover:text-neutral-300 transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                      @imvyomverma
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Page */}
              <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-2">Contact Form</h3>
                    <p className="text-neutral-400 mb-3">
                      Use our general contact form for all inquiries including bug reports
                    </p>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 text-white hover:text-neutral-300 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Go to Contact Page
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-neutral-800/40 border border-neutral-700/30 rounded-xl p-6 mt-8">
              <h3 className="text-lg font-medium text-white mb-4">Reporting Guidelines</h3>
              <ul className="space-y-2 text-neutral-400">
                <li className="flex items-start gap-2">
                  <span className="text-white mt-1">•</span>
                  <span>Provide a clear and descriptive title</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white mt-1">•</span>
                  <span>Include detailed steps to reproduce the issue</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white mt-1">•</span>
                  <span>Describe expected vs. actual behavior</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white mt-1">•</span>
                  <span>Include browser/device information if relevant</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white mt-1">•</span>
                  <span>Add screenshots or screen recordings if possible</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
