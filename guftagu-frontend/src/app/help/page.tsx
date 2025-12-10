'use client';

import { useState } from 'react';
import { 
  HelpCircle, MessageSquare, Shield, Users, Video, 
  ChevronDown, ChevronUp, Mail, ExternalLink 
} from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

const faqs = [
  {
    category: 'Getting Started',
    icon: HelpCircle,
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Simply enter your email address on the login page and we\'ll send you a verification code. No password needed! After verification, you\'ll be asked to choose a username.',
      },
      {
        q: 'Why do I need to verify my email?',
        a: 'Email verification helps us ensure you\'re a real person and allows us to keep your account secure. It also enables features like friend requests and notifications.',
      },
      {
        q: 'What is my 7-digit ID for?',
        a: 'Your unique 7-digit ID is an alternative way for others to find and add you as a friend. You can share this ID instead of your username if you prefer more privacy.',
      },
    ],
  },
  {
    category: 'Video Chat',
    icon: Video,
    questions: [
      {
        q: 'How does random matching work?',
        a: 'When you click "Start Chat", our system finds another user who is also looking for a chat partner. You\'ll be connected via a secure peer-to-peer video connection.',
      },
      {
        q: 'Is my video chat private?',
        a: 'Yes! Video chats use WebRTC technology, which means your video and audio are transmitted directly between you and your chat partner - not through our servers.',
      },
      {
        q: 'Can I skip to the next person?',
        a: 'Yes, just click the "Next" button at any time to end the current chat and find a new partner.',
      },
      {
        q: 'What if my camera or microphone isn\'t working?',
        a: 'Make sure you\'ve granted browser permissions for camera and microphone access. You can check this in your browser settings or click the camera icon in the address bar.',
      },
    ],
  },
  {
    category: 'Friends & Messaging',
    icon: Users,
    questions: [
      {
        q: 'How do I add someone as a friend?',
        a: 'You can send a friend request during or after a video chat. Alternatively, go to the Friends page and search by username or 7-digit ID.',
      },
      {
        q: 'Can I message someone who isn\'t my friend?',
        a: 'No, you can only send direct messages to your friends. This helps prevent unwanted messages and spam.',
      },
      {
        q: 'How do I block or unfriend someone?',
        a: 'Visit their profile and click the options menu. From there you can unfriend or block them. Blocked users cannot contact you or see your profile.',
      },
    ],
  },
  {
    category: 'Safety & Moderation',
    icon: Shield,
    questions: [
      {
        q: 'How do I report someone?',
        a: 'Click the report button during a video chat or visit the user\'s profile and select "Report User". Please provide as much detail as possible about the issue.',
      },
      {
        q: 'What happens after I report someone?',
        a: 'Our moderation team reviews all reports. Depending on the severity, the reported user may receive a warning, temporary ban, or permanent ban.',
      },
      {
        q: 'Why was my account banned?',
        a: 'Accounts are banned for violating our Terms of Service. Common reasons include harassment, sharing inappropriate content, or using automated tools.',
      },
      {
        q: 'How can I appeal a ban?',
        a: 'If you believe your ban was a mistake, please contact our support team at support@guftagu.com with your account details and an explanation.',
      },
    ],
  },
];

export default function HelpPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Help Center</h1>
          <p className="text-xl text-neutral-400">
            Find answers to common questions or contact our support team
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8 mb-16">
          {faqs.map((section) => (
            <div key={section.category} className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <section.icon className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">{section.category}</h2>
              </div>
              <div className="space-y-2">
                {section.questions.map((item, index) => {
                  const key = `${section.category}-${index}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div
                      key={key}
                      className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-800 transition-colors"
                      >
                        <span className="font-medium text-white">{item.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4">
                          <p className="text-neutral-300">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 text-center shadow-lg">
          <MessageSquare className="w-12 h-12 text-white mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Still need help?</h2>
          <p className="text-neutral-400 mb-6">
            Our support team is here to assist you with any questions or issues
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="mailto:vyomverma2873@gmail.com">
              <Button>
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </a>
            <Link href="/terms">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Terms of Service
              </Button>
            </Link>
            <Link href="/privacy">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Privacy Policy
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
