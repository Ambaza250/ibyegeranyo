import { Hero } from '@/components/Hero';
import { FeaturedDocumentaries } from '@/components/FeaturedDocumentaries';
import { RecentlyAdded } from '@/components/RecentlyAdded';
import { PricingSection } from '@/components/PricingSection';
import { CTASection } from '@/components/CTASection';

// The homepage library sections read Firestore. Do not freeze them at build
// time; newly uploaded documentaries should be visible without a redeploy.
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedDocumentaries />
      <RecentlyAdded />
      <PricingSection />
      <CTASection />
    </>
  );
}
