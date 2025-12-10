import Link from 'next/link';
import { Instagram, Phone, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: 'Help', href: '/help' },
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'About Us', href: '/about' },
    { label: 'Work With Us', href: '/careers' },
    { label: 'Copyright', href: '/copyright' },
    { label: 'Our Mission', href: '/mission' },
    { label: 'Partnerships', href: '/partnerships' },
    { label: 'Bug Report', href: '/bug-report' },
  ];

  return (
    <footer className="relative z-10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Card */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-3xl p-8 sm:p-10 shadow-2xl">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand & Description */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
                  <span className="text-xl font-black text-neutral-900">G</span>
                </div>
                <div>
                  <span className="text-2xl font-semibold text-white">Guftagu</span>
                  <span className="block text-xs text-neutral-500 uppercase tracking-widest">Connect</span>
                </div>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed mb-4">
                Connect with people around the world through meaningful conversations.
              </p>
              {/* Contact Info */}
              <div className="space-y-2">
                <a href="mailto:vyomverma2873@gmail.com" className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                  vyomverma2873@gmail.com
                </a>
                <a href="tel:+918766355495" className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  +91 8766355495
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Quick Links</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {footerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-800/80 mb-6"></div>

          {/* Bottom Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-center sm:text-left">
              <p className="text-sm text-neutral-500">
                © {currentYear} Guftagu. All rights reserved.
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                Website © {currentYear} Guftagu Platform
              </p>
            </div>

            {/* Creator Credit */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-neutral-700/50">
                <p className="text-sm text-neutral-400">
                  Made by{' '}
                  <span className="font-semibold text-white">Vyom Verma</span>
                </p>
                <p className="text-xs text-neutral-500">Full-Stack Developer</p>
              </div>
              
              {/* Social Icons */}
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
          </div>
        </div>
      </div>
    </footer>
  );
}
