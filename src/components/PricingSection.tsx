import Link from 'next/link';
import { PLANS } from '@/lib/types';
import { Check } from 'lucide-react';

export function PricingSection() {
  return (
    <section className="py-20 bg-background-secondary">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            Get unlimited access to all documentaries with our flexible subscription plans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`card p-6 relative ${
                plan.id === 'monthly' ? 'border-primary ring-1 ring-primary' : ''
              }`}
            >
              {plan.id === 'monthly' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge badge-primary">Most Popular</span>
                </div>
              )}
              <h3 className="text-white font-semibold text-lg mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">
                  {plan.price.toLocaleString()}
                </span>
                <span className="text-text-muted"> RWF</span>
              </div>
              <p className="text-text-muted text-sm mb-4">{plan.description}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block text-center py-2 rounded font-medium transition-colors ${
                  plan.id === 'monthly'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-text-muted text-sm mt-8">
          All payments are processed manually via MTN MoMo. Access is granted after verification.
        </p>
      </div>
    </section>
  );
}