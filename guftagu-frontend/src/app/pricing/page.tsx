'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Unlimited random video chats',
      'Add up to 50 friends',
      'Direct messaging',
      'Basic profile customization',
      'Report and block users',
    ],
    cta: 'Get Started',
    href: '/login',
    popular: false,
  },
  {
    name: 'Premium',
    price: '$9.99',
    period: 'per month',
    description: 'Enhanced experience for power users',
    features: [
      'Everything in Free',
      'Unlimited friends',
      'Priority matching',
      'Interest-based matching',
      'No ads',
      'Profile verification badge',
      'Advanced filters',
      'Analytics dashboard',
    ],
    cta: 'Upgrade Now',
    href: '/login',
    popular: true,
  },
  {
    name: 'Lifetime',
    price: '$99',
    period: 'one-time payment',
    description: 'Best value for long-term users',
    features: [
      'Everything in Premium',
      'Lifetime access',
      'Early access to new features',
      'Priority support',
      'Custom profile themes',
    ],
    cta: 'Get Lifetime',
    href: '/login',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Start free and upgrade anytime.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-zinc-900/50 border rounded-2xl p-8 ${
                plan.popular
                  ? 'border-violet-500 shadow-lg shadow-violet-500/20'
                  : 'border-zinc-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-violet-600 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <p className="text-zinc-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-zinc-400">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="block">
                <Button
                  className="w-full"
                  variant={plan.popular ? 'primary' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-zinc-400">
                Yes, you can cancel your subscription at any time. You&apos;ll continue to have
                access until the end of your billing period.
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-zinc-400">
                Absolutely. We use industry-standard encryption and never store your
                payment details on our servers.
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-zinc-400">
                We accept all major credit cards, PayPal, and various local payment methods
                depending on your region.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
