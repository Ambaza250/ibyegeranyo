import { getRecentDocumentaries } from '@/lib/db';
import Link from 'next/link';
import { Star, Calendar, Flame } from 'lucide-react';

export async function RecentlyAdded() {
  const documentaries = await getRecentDocumentaries(8);

  return (
    <section className="py-20 bg-background-secondary">
      <div className="container">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Recently Added
          </h2>
          <p className="text-text-muted max-w-2xl">
            The latest documentaries added to our collection.
          </p>
        </div>

        {documentaries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">No documentaries available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {documentaries.map((doc, index) => (
              <Link
                key={doc.id}
                href={`/documentaries/${doc.id}`}
                className="card p-4 group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-surface-hover flex items-center justify-center">
                    <span className="text-text-muted text-sm font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm mb-1 truncate group-hover:text-primary transition-colors">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      {doc.category && <span>{doc.category}</span>}
                      {doc.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-gold fill-gold" />
                          {doc.rating.toFixed(1)}
                        </span>
                      )}
                      {doc.releaseDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(doc.releaseDate).getFullYear()}
                        </span>
                      )}
                    </div>
                  </div>
                  {index < 3 && (
                    <Flame className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}