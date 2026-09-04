import { getRecentDocumentaries } from '@/lib/db';
import { DocumentaryCard } from './DocumentaryCard';

export async function RecentlyAdded() {
  const documentaries = await getRecentDocumentaries(8);
  return <section className="page-section bg-background-secondary"><div className="container"><div className="mb-12 md:mb-14"><p className="text-sm font-semibold tracking-[.16em] text-gold">NEW RELEASES</p><h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-3xl md:text-5xl">Recently Added</h2><p className="mt-4 max-w-2xl text-text-muted">The latest documentaries added to our collection.</p></div>{documentaries.length === 0 ? <div className="rounded-xl border border-border bg-surface p-10 text-center text-text-muted">No documentaries available yet.</div> : <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{documentaries.map((doc) => <DocumentaryCard key={doc.id} documentary={doc} />)}</div>}</div></section>;
}
