import { getCurrentUser } from '@/lib/auth';
import { getRecentDocumentaries } from '@/lib/db';
import { DocumentaryCard } from './DocumentaryCard';

export async function TopDocumentary() {
  const user = await getCurrentUser();

  // Only for logged-in users with an active full subscription (not single-doc)
  const hasFullAccess =
    !!user &&
    user.subscriptionStatus === 'active' &&
    user.selectedPlan !== 'single' &&
    !!user.expiresAt &&
    new Date(user.expiresAt) >= new Date();

  if (!hasFullAccess) return null;

  const [latest] = await getRecentDocumentaries(1);
  if (!latest) return null;

  return (
    <section className="page-section bg-background-secondary">
      <div className="container">
        <div className="mb-10 md:mb-12">
          <p className="text-sm font-semibold tracking-[.16em] text-gold">
            JUST ADDED
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-3xl md:text-5xl text-white mb-4">
            Latest Documentary
          </h2>
          <p className="text-text-muted max-w-2xl">
            The newest release on Ibyegeranyo — available with your subscription.
          </p>
        </div>

        {/* ~2× a normal card width, centered */}
        <div className="mx-auto w-full max-w-3xl md:max-w-4xl">
          <DocumentaryCard documentary={latest} large />
        </div>
      </div>
    </section>
  );
}
