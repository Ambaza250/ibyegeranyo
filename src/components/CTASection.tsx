'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export function CTASection() {
  const { t } = useI18n();
  return (
    <section className="page-section bg-background pb-[clamp(6rem,10vw,10rem)]">
      <div className="container text-center">
        <div className="py-8 md:py-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('Ready to Start Watching?')}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-text-muted">
            {t('Join now and get unlimited access to premium documentaries from Rwanda and around the world. Ad-free, high-quality content.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-3">
              {t('Subscribe Now')}
            </Link>
            <Link href="/documentaries" className="btn-secondary text-lg px-8 py-3">
              {t('Browse Documentaries')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
