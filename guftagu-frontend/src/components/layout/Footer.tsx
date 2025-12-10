import Link from 'next/link';
import { Github, Twitter, Instagram, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 pb-8 pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-900/80 backdrop-blur-2xl border border-neutral-700/50 rounded-3xl shadow-2xl shadow-black/20 p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4 group">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10 group-hover:shadow-white/20 transition-all">
                    <span className="text-xl font-black text-neutral-900 tracking-tighter">G</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-neutral-900"></div>
                </div>
                <div>
                  <span className="text-2xl font-semibold text-white tracking-tight">Guftagu</span>
                  <span className="block text-[10px] text-neutral-500 uppercase tracking-widest -mt-0.5">Connect</span>
                </div>
              </Link>
              <p className="text-neutral-400 text-sm max-w-sm mb-6 leading-relaxed">
                Connect with people from around the world through random video chats. 
                Make new friends, have conversations, and explore different cultures.
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="#"
                  className="p-2.5 rounded-xl bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-700/50 transition-all"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://instagram.com/imvyomverma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-700/50 transition-all"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="p-2.5 rounded-xl bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-700/50 transition-all"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="bg-neutral-800/40 rounded-2xl p-5 border border-neutral-700/50">
              <h3 className="text-white font-medium mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/chat" className="text-neutral-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-neutral-600 group-hover:bg-white transition-colors"></span>
                    Video Chat
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-neutral-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-neutral-600 group-hover:bg-white transition-colors"></span>
                    Premium
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-neutral-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-neutral-600 group-hover:bg-white transition-colors"></span>
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>

            <div className="bg-neutral-800/40 rounded-2xl p-5 border border-neutral-700/50">
              <h3 className="text-white font-medium mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/terms" className="text-neutral-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-neutral-600 group-hover:bg-white transition-colors"></span>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-neutral-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-neutral-600 group-hover:bg-white transition-colors"></span>
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 mt-8 pt-8">
            {/* Creator Attribution */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-neutral-500 text-sm">
                © {new Date().getFullYear()} <span className="text-white font-medium">Guftagu</span>. All rights reserved.
              </p>
              
              {/* Developer Info */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-4">
                {/* Contact Links */}
                <div className="flex items-center gap-2">
                  <a
                    href="tel:+918766355495"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800/60 border border-neutral-700/50 text-neutral-400 hover:text-white hover:bg-neutral-800 text-sm transition-all"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">8766355495</span>
                  </a>
                  <a
                    href="mailto:vyomverma2873@gmail.com"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800/60 border border-neutral-700/50 text-neutral-400 hover:text-white hover:bg-neutral-800 text-sm transition-all"
                    title="Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">vyomverma2873@gmail.com</span>
                  </a>
                  <a
                    href="https://instagram.com/imvyomverma"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800/60 border border-neutral-700/50 text-neutral-400 hover:text-white hover:bg-neutral-800 text-sm transition-all"
                    title="Instagram"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">@imvyomverma</span>
                  </a>
                </div>
                
                {/* Attribution */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-neutral-900">
                  <span className="text-neutral-600 text-sm">Made by</span>
                  <span className="font-semibold text-sm">Vyom Verma</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
