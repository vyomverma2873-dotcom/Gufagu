import Link from 'next/link';
import { Instagram, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Main Footer Card */}
        <div className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                <span className="text-base font-bold text-neutral-900">G</span>
              </div>
              <div>
                <span className="text-lg font-medium text-white">Guftagu</span>
                <span className="block text-[10px] text-neutral-500 uppercase tracking-wider">Connect</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-6">
              <Link href="/chat" className="text-sm text-neutral-400 hover:text-white transition-colors">
                Chat
              </Link>
              <Link href="/help" className="text-sm text-neutral-400 hover:text-white transition-colors">
                Help
              </Link>
              <Link href="/terms" className="text-sm text-neutral-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-neutral-400 hover:text-white transition-colors">
                Privacy
              </Link>
            </nav>

            {/* Contact */}
            <div className="flex items-center gap-2">
              <a
                href="tel:+918766355495"
                className="p-2 rounded-lg bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
                title="Call"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href="mailto:vyomverma2873@gmail.com"
                className="p-2 rounded-lg bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/imvyomverma"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-neutral-500">
              © {new Date().getFullYear()} Guftagu. All rights reserved.
            </p>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-neutral-800">
              <span className="text-xs text-neutral-500">Made by</span>
              <span className="text-xs font-medium text-white">Vyom Verma</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
