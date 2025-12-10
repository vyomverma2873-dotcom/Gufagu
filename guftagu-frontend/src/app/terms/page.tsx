import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Guftagu',
  description: 'Terms of Service for Guftagu random video chat platform',
};

export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <p className="text-zinc-400 mb-8">Last updated: December 2024</p>

        <div className="prose prose-invert prose-zinc max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-zinc-300 mb-4">
              By accessing or using Guftagu, you agree to be bound by these Terms of Service
              and all applicable laws and regulations. If you do not agree with any of these
              terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-zinc-300 mb-4">
              Guftagu is a random video chat platform that allows users to connect with
              strangers for video conversations. The service includes features such as:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
              <li>Random video chat matching</li>
              <li>Friend system and direct messaging</li>
              <li>User profiles and customization</li>
              <li>Reporting and moderation features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Eligibility</h2>
            <p className="text-zinc-300 mb-4">
              You must be at least 18 years of age to use Guftagu. By using this service,
              you represent and warrant that you are at least 18 years old and have the
              legal capacity to enter into these Terms of Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. User Conduct</h2>
            <p className="text-zinc-300 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
              <li>Use the service for any illegal purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Share explicit, offensive, or inappropriate content</li>
              <li>Attempt to circumvent security measures</li>
              <li>Create multiple accounts to evade bans</li>
              <li>Share personal information of other users without consent</li>
              <li>Use automated systems or bots</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Account Termination</h2>
            <p className="text-zinc-300 mb-4">
              We reserve the right to terminate or suspend your account at any time for
              violations of these Terms of Service. This may be done without prior notice
              for severe violations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Privacy</h2>
            <p className="text-zinc-300 mb-4">
              Your use of Guftagu is also governed by our Privacy Policy. Please review
              our Privacy Policy to understand our practices regarding your personal
              information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Disclaimer</h2>
            <p className="text-zinc-300 mb-4">
              Guftagu is provided &quot;as is&quot; without warranties of any kind. We do not
              guarantee that the service will be uninterrupted, secure, or error-free.
              We are not responsible for the conduct of users or content shared during
              video chats.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-zinc-300 mb-4">
              In no event shall Guftagu be liable for any indirect, incidental, special,
              consequential, or punitive damages arising out of your use of or inability
              to use the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to Terms</h2>
            <p className="text-zinc-300 mb-4">
              We reserve the right to modify these Terms of Service at any time. We will
              notify users of significant changes via email or through the platform.
              Continued use of the service after changes constitutes acceptance of the
              new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Contact</h2>
            <p className="text-zinc-300 mb-4">
              If you have any questions about these Terms of Service, please contact us
              at support@guftagu.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
