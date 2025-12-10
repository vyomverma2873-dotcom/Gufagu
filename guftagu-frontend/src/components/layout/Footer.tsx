import Link from 'next/link';
import { Video, Github, Twitter, Instagram, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Guftagu</span>
            </Link>
            <p className="text-zinc-400 text-sm max-w-sm mb-4">
              Connect with people from around the world through random video chats. 
              Make new friends, have conversations, and explore different cultures.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/chat" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Video Chat
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Premium
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800/50 mt-8 pt-8">
          {/* Creator Attribution */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-zinc-500 text-sm">
              © {new Date().getFullYear()} Guftagu. All rights reserved.
            </p>
            
            {/* Developer Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Contact Links */}
              <div className="flex items-center gap-4">
                <a
                  href="tel:+918766355495"
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors"
                  title="Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">8766355495</span>
                </a>
                <a
                  href="mailto:vyomverma2873@gmail.com"
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors"
                  title="Email"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">vyomverma2873@gmail.com</span>
                </a>
                <a
                  href="https://instagram.com/imvyomverma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors"
                  title="Instagram"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">@imvyomverma</span>
                </a>
              </div>
              
              {/* Attribution */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-500">Made by</span>
                <span className="text-zinc-300 font-medium">Vyom Verma</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-500">Full Stack Developer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
