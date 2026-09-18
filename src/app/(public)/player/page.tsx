import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDocumentaryById } from '@/lib/db';
import { checkDocumentaryAccess, getCurrentUser } from '@/lib/auth';
import { Lock } from 'lucide-react';
import { StreamPlayer } from '@/components/StreamPlayer';

export const dynamic = 'force-dynamic';

export default async function PlayerPage({
  searchParams,
}: {
  searchParams: Promise<{ doc?: string }>;
}) {
  const { doc: docId } = await searchParams;
  if (!docId) redirect('/documentaries');

  const documentary = await getDocumentaryById(docId);
  if (!documentary) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <h1>Documentary not found</h1>
      </div>
    );
  }

  const user = await getCurrentUser();
  const access = await checkDocumentaryAccess(user?.id, documentary.id);

  const useStream =
    Boolean(documentary.streamUid) &&
    documentary.streamStatus !== 'error' &&
    access.hasAccess;

  // Prefer free HLS if encoding is ready
  const hlsPlaylistUrl =
    documentary.hlsPlaylistKey && documentary.encodingStatus === 'ready'
      ? `/api/media/r2?key=${encodeURIComponent(documentary.hlsPlaylistKey)}`
      : null;

  return (
    <div className="min-h-screen bg-black">
      <header className="container flex flex-wrap items-center justify-between gap-4 py-5 border-b border-white/10">
        <div>
          <strong>Aime Christian</strong>
          <span className="block text-xs text-text-muted">
            Independent Documentary Maker
          </span>
        </div>
        <nav className="flex gap-5 text-sm text-text-muted">
          <Link href="/documentaries">Documentaries</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href={`/documentaries/${documentary.id}`}>Back</Link>
        </nav>
      </header>

      <main className="container max-w-6xl py-8">
        {access.hasAccess && (useStream || documentary.videoUrl || hlsPlaylistUrl) ? (
          <div className="video-container aspect-video">
            <StreamPlayer
              docId={documentary.id}
              poster={documentary.thumbnailUrl}
              fallbackUrl={documentary.videoUrl}
              hlsPlaylistUrl={hlsPlaylistUrl}
            />
          </div>
        ) : (
          <div className="relative aspect-video overflow-hidden rounded-lg bg-surface flex items-center justify-center">
            {documentary.thumbnailUrl && (
              <img
                src={documentary.thumbnailUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
            )}
            <div className="relative text-center p-8">
              <Lock className="mx-auto mb-3 text-gold" />
              <h1 className="text-2xl font-semibold">{documentary.title}</h1>
              <p className="mt-2 max-w-md text-text-muted">
                This full documentary is available after your subscription or
                single-documentary payment is verified.
              </p>
              <Link
                href={
                  user
                    ? `/register?plan=single&doc=${documentary.id}`
                    : `/login?next=/player?doc=${documentary.id}`
                }
                className="btn-primary inline-block mt-5"
              >
                Subscribe to Watch
              </Link>
              {documentary.trailerUrl && (
                <video
                  controls
                  className="mx-auto mt-5 w-full max-w-xl"
                  poster={documentary.thumbnailUrl || undefined}
                >
                  <source src={documentary.trailerUrl} type="video/mp4" />
                </video>
              )}
            </div>
          </div>
        )}

        <section className="py-8">
          <h1 className="font-[family-name:var(--font-fraunces)] text-4xl">
            {documentary.title}
          </h1>
          <p className="mt-3 max-w-3xl text-text-muted">{documentary.summary}</p>
          <p className="mt-4 text-sm text-text-muted">
            {documentary.category}
            {documentary.videoDuration
              ? ` · ${Math.floor(documentary.videoDuration / 60)} minutes`
              : ''}
            {documentary.encodingStatus === 'pending' ||
            documentary.encodingStatus === 'processing'
              ? ' · Adaptive qualities encoding…'
              : documentary.encodingStatus === 'ready'
                ? ' · Adaptive streaming ready'
                : ''}
            {documentary.streamStatus === 'processing'
              ? ' · Stream encoding…'
              : ''}
          </p>
        </section>
      </main>
    </div>
  );
}
