import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Guftagu',
  description: 'Privacy Policy for Guftagu random video chat platform',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-zinc-400 mb-8">Last updated: December 2024</p>

        <div className="prose prose-invert prose-zinc max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-zinc-300 mb-4">
              At Guftagu, we take your privacy seriously. This Privacy Policy explains how
              we collect, use, disclose, and safeguard your information when you use our
              video chat platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium text-white mb-3">Personal Information</h3>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
              <li>Email address (for authentication)</li>
              <li>Username and display name</li>
              <li>Profile picture (if uploaded)</li>
              <li>Bio and interests</li>
            </ul>
            
            <h3 className="text-xl font-medium text-white mb-3">Usage Data</h3>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Pages visited and features used</li>
              <li>Time and date of visits</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-zinc-300 mb-4">We use the collected information to:</p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
              <li>Provide and maintain our service</li>
              <li>Authenticate and manage user accounts</li>
              <li>Send verification codes and notifications</li>
              <li>Match users for video chats</li>
              <li>Improve and optimize our platform</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Respond to support requests</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Video Chat Privacy</h2>
            <p className="text-zinc-300 mb-4">
              Guftagu uses peer-to-peer WebRTC connections for video chats. This means:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
              <li>Video and audio streams are not stored on our servers</li>
              <li>Conversations are directly between users</li>
              <li>We do not record or monitor video chat content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Storage and Security</h2>
            <p className="text-zinc-300 mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure password hashing</li>
              <li>Regular security audits</li>
              <li>Limited access to personal data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Sharing</h2>
            <p className="text-zinc-300 mb-4">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
              <li>Service providers who assist in operating our platform</li>
              <li>Law enforcement when required by law</li>
              <li>Other users (only information you choose to make public)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
            <p className="text-zinc-300 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Cookies</h2>
            <p className="text-zinc-300 mb-4">
              We use essential cookies to maintain your session and preferences. These
              are necessary for the platform to function properly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-zinc-300 mb-4">
              Guftagu is not intended for users under 18 years of age. We do not knowingly
              collect information from minors. If we discover that a minor has provided us
              with personal information, we will delete it immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p className="text-zinc-300 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of
              any changes by posting the new policy on this page and updating the &quot;Last
              updated&quot; date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p className="text-zinc-300 mb-4">
              If you have questions about this Privacy Policy, please contact us at
              privacy@guftagu.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
