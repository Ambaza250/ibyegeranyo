import { getFeaturedDocumentaries } from '@/lib/db';
import { DocumentaryCard } from './DocumentaryCard';

export async function FeaturedDocumentaries() {
  const documentaries = await getFeaturedDocumentaries();

  return (
    <section className="page-section bg-background">
      <div className="container">
        <div className="mb-12 md:mb-14">
          <p className="text-sm font-semibold tracking-[.16em] text-gold">CURATED STORIES</p>
          <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-3xl md:text-5xl text-white mb-4">
            Featured Documentaries
          </h2>
          <p className="text-text-muted max-w-2xl">
            Discover our most compelling stories and investigations from Rwanda and beyond.
          </p>
        </div>

        {documentaries.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface py-12 text-center">
            <p className="text-text-muted">No featured documentaries available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentaries.map((doc) => (
              <DocumentaryCard key={doc.id} documentary={doc} featured />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
