'use client';

import Link from 'next/link';
import { PLANS } from '@/lib/types';
import { Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function PricingSection() {
  const { t } = useI18n();
  return (
    <section className="page-section bg-background-secondary">
      <div className="container">
        <div className="text-center mb-14 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('Choose Your Plan')}
          </h2>
          <div className="flex w-full justify-center">
            <p className="w-fit max-w-full text-center text-text-muted">
              {t('Get unlimited access to all documentaries with our flexible subscription plans.')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-7">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card card relative flex min-h-[20.25rem] flex-col ${
                plan.id === 'monthly' ? 'border-primary ring-1 ring-primary' : ''
              }`}
            >
              {plan.id === 'monthly' && (
                <div className="absolute right-6 top-6">
                  <span className="badge badge-primary">{t('Most Popular')}</span>
                </div>
              )}
              <h3
                className={`mb-3 text-lg font-semibold text-white ${
                  plan.id === 'monthly' ? 'pr-28' : ''
                }`}
              >
                {t(plan.name)}
              </h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">
                  {plan.price.toLocaleString()}
                </span>
                <span className="text-text-muted"> RWF</span>
              </div>
              <p className="mb-5 text-sm leading-6 text-text-muted">
                {t(plan.description)}
              </p>
              <ul className="mb-6 space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2.5 text-sm text-text-secondary"
                  >
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {t(feature)}
                  </li>
                ))}
              </ul>
              <Link
                href={`/register?plan=${plan.id}`}
                className={`mt-auto inline-flex min-h-11 items-center justify-center self-center rounded-md px-6 py-3 text-sm font-semibold transition-colors ${
                  plan.id === 'monthly' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {t('Get Started')}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-text-muted text-sm mt-8">
          {t(
            'All payments are processed manually via MTN MoMo. Access is granted after verification.'
          )}
        </p>
      </div>
    </section>
  );
}
