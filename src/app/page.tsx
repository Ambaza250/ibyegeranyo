import { Hero } from '@/components/Hero';
import { FeaturedDocumentaries } from '@/components/FeaturedDocumentaries';
import { RecentlyAdded } from '@/components/RecentlyAdded';
import { AboutSection } from '@/components/AboutSection';
import { PricingSection } from '@/components/PricingSection';
import { CTASection } from '@/components/CTASection';

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedDocumentaries />
      <RecentlyAdded />
      <AboutSection />
      <PricingSection />
      <CTASection />
    </>
  );
}