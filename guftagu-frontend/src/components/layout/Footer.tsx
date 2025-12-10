import Link from 'next/link';
import { Video, Github, Twitter, Instagram, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 pb-8 pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-lg shadow-black/10 p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-all group-hover:scale-105">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white drop-shadow-sm">Guftagu</span>
              </Link>
              <p className="text-white/70 text-sm max-w-sm mb-6 leading-relaxed">
                Connect with people from around the world through random video chats. 
                Make new friends, have conversations, and explore different cultures.
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="#"
                  className="p-2.5 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/10 hover:border-white/30 transition-all"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://instagram.com/imvyomverma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/10 hover:border-white/30 transition-all"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="p-2.5 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/10 hover:border-white/30 transition-all"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/chat" className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 group-hover:bg-cyan-400 transition-colors"></span>
                    Video Chat
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 group-hover:bg-cyan-400 transition-colors"></span>
                    Premium
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 group-hover:bg-cyan-400 transition-colors"></span>
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/terms" className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 group-hover:bg-cyan-400 transition-colors"></span>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 group-hover:bg-cyan-400 transition-colors"></span>
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8">
            {/* Creator Attribution */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-white/50 text-sm">
                © {new Date().getFullYear()} <span className="text-white font-medium">Guftagu</span>. All rights reserved.
              </p>
              
              {/* Developer Info */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                {/* Contact Links */}
                <div className="flex items-center gap-3">
                  <a
                    href="tel:+918766355495"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-sm transition-all"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">8766355495</span>
                  </a>
                  <a
                    href="mailto:vyomverma2873@gmail.com"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-sm transition-all"
                    title="Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">vyomverma2873@gmail.com</span>
                  </a>
                  <a
                    href="https://instagram.com/imvyomverma"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-sm transition-all"
                    title="Instagram"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">@imvyomverma</span>
                  </a>
                </div>
                
                {/* Attribution */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                  <span className="text-white/60 text-sm">Made by</span>
                  <span className="text-white font-medium text-sm">Vyom Verma</span>
                  <span className="text-white/30">•</span>
                  <span className="text-cyan-400 text-sm">Full Stack Developer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
