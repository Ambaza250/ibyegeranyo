import { Hero } from '@/components/Hero';
import { FeaturedDocumentaries } from '@/components/FeaturedDocumentaries';
import { RecentlyAdded } from '@/components/RecentlyAdded';
import { PricingSection } from '@/components/PricingSection';
import { CTASection } from '@/components/CTASection';
import { JsonLd } from '@/components/JsonLd';

// The homepage library sections read Firestore. Do not freeze them at build
// time; newly uploaded documentaries should be visible without a redeploy.
export const dynamic = 'force-dynamic';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://ibyegeranyo.com';

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Ibyegeranyo.com',
          alternateName: 'Aime Christian Documentaries',
          url: siteUrl,
          description:
            'Premium ad-free Rwandan documentaries and investigations by Aime Christian.',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${siteUrl}/documentaries`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <Hero />
      <FeaturedDocumentaries />
      <RecentlyAdded />
      <PricingSection />
      <CTASection />
    </>
  );
}
