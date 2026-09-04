import type { Metadata } from 'next';
import { CTASection } from '@/components/CTASection';

export const metadata: Metadata = { title: 'About Ibyegeranyo | Ibyegeranyo.com', description: 'Advertisement-free documentaries from Rwanda and beyond.', alternates: { canonical: '/about' } };

export default function AboutPage() {
  return <div><section className="container page-section"><p className="text-gold font-semibold tracking-[.16em]">ABOUT IBYEGERANYO</p><h1 className="mt-4 max-w-4xl font-[family-name:var(--font-fraunces)] text-5xl md:text-7xl">Stories with the patience to look closer.</h1><div className="mt-8 max-w-3xl space-y-5 text-lg text-text-muted"><p>Ibyegeranyo is a home for documentaries people can watch without advertising: a focused, uninterrupted place for stories that deserve your full attention.</p><p>Our collection follows the people, systems and choices shaping Rwanda and its place in the world. Expect thoughtful documentaries on history, economics, politics, social welfare, lifestyle, diplomacy, investigations and current affairs.</p><p>Every subscription supports an ad-free viewing experience, so you can spend time with each film without distractions.</p></div></section><CTASection /></div>;
}
