import Link from 'next/link';
import { Video, Github, Twitter, Instagram, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950/90 backdrop-blur-xl border-t border-cyan-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Guftagu</span>
            </Link>
            <p className="text-slate-400 text-sm max-w-sm mb-4">
              Connect with people from around the world through random video chats. 
              Make new friends, have conversations, and explore different cultures.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 border border-transparent hover:border-cyan-500/30 transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/imvyomverma"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 border border-transparent hover:border-cyan-500/30 transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 border border-transparent hover:border-cyan-500/30 transition-all"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-cyan-400 font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/chat" className="text-slate-400 hover:text-cyan-300 text-sm transition-colors">
                  Video Chat
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-400 hover:text-cyan-300 text-sm transition-colors">
                  Premium
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-slate-400 hover:text-cyan-300 text-sm transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-cyan-400 font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-cyan-300 text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-cyan-300 text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cyan-900/30 mt-8 pt-8">
          {/* Creator Attribution */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} <span className="text-cyan-400">Guftagu</span>. All rights reserved.
            </p>
            
            {/* Developer Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Contact Links */}
              <div className="flex items-center gap-4">
                <a
                  href="tel:+918766355495"
                  className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 text-sm transition-colors"
                  title="Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">8766355495</span>
                </a>
                <a
                  href="mailto:vyomverma2873@gmail.com"
                  className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 text-sm transition-colors"
                  title="Email"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">vyomverma2873@gmail.com</span>
                </a>
                <a
                  href="https://instagram.com/imvyomverma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 text-sm transition-colors"
                  title="Instagram"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">@imvyomverma</span>
                </a>
              </div>
              
              {/* Attribution */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Made by</span>
                <span className="text-cyan-400 font-medium">Vyom Verma</span>
                <span className="text-slate-700">•</span>
                <span className="text-slate-500">Full Stack Developer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
