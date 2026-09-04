'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative min-h-[42rem] h-[min(100svh,58rem)] flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/media/hero-broll.mp4" type="video/mp4" />
      </video>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 gradient-overlay" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 container text-center px-4">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          {t('heroTitle')}
        </h1>
        <p className="text-center text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8">
          {t('heroDescription')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/pricing" className="btn-primary text-lg px-8 py-3">
            {t('subscribe')}
          </Link>
          <Link href="/documentaries" className="btn-secondary text-lg px-8 py-3">
            {t('exploreLibrary')}
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-3 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}
