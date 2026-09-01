import { getFeaturedDocumentaries } from '@/lib/db';
import { DocumentaryCard } from './DocumentaryCard';

export async function FeaturedDocumentaries() {
  const documentaries = await getFeaturedDocumentaries();

  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Featured Documentaries
          </h2>
          <p className="text-text-muted max-w-2xl">
            Discover our most compelling stories and investigations from Rwanda and beyond.
          </p>
        </div>

        {documentaries.length === 0 ? (
          <div className="text-center py-12">
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