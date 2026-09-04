export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import { getAllDocumentaries } from '@/lib/db';
import { DocumentaryCard } from '@/components/DocumentaryCard';

export const metadata: Metadata = {
  title: 'Documentaries | Aime Christian Documentaries',
  description: 'Browse our collection of premium documentaries from Rwanda and around the world.',
};

export default async function DocumentariesPage() {
  const documentaries = await getAllDocumentaries();

  return (
    <div className="min-h-screen">
      <div className="container page-section">
        <div className="mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Documentaries
          </h1>
          <p className="text-text-muted max-w-2xl">
            Explore our complete collection of premium documentaries. 
            Watch compelling stories and investigations from Rwanda and beyond.
          </p>
        </div>

        {documentaries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-lg">No documentaries available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {documentaries.map((doc) => (
              <DocumentaryCard key={doc.id} documentary={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
