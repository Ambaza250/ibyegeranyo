import Link from 'next/link';
import { Play, Star, Calendar, Clock, Tag } from 'lucide-react';
import type { Documentary } from '@/lib/types';

interface DocumentaryDetailProps {
  documentary: Documentary;
  hasAccess: boolean;
  accessReason: string;
}

export function DocumentaryDetail({ documentary, hasAccess, accessReason }: DocumentaryDetailProps) {
  const fallbackThumbnail = 'https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,h_540,q_auto,w_960/samples/landscapes/nature-mountains.jpg';
  const thumbnail = documentary.thumbnailUrl || fallbackThumbnail;
  const trailerMessage = accessReason === 'not_authenticated'
    ? 'Sign in or subscribe to watch the full documentary. Until then, you can watch the trailer.'
    : 'Your payment has not been confirmed or your access has ended. You can watch the trailer until access is active.';
  return (
    <div className="container py-8">
      {/* Back button */}
      <Link
        href="/documentaries"
        className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Documentaries
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Preview area: protected playback lives on the dedicated player route. */}
          <div className="video-container min-h-[25rem] mb-6 md:min-h-[30rem]">
              <div className="relative flex min-h-[25rem] w-full flex-col items-center justify-center bg-surface md:min-h-[30rem]">
                <img src={thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                <div className="relative z-10 text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Play className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">
                    {hasAccess ? 'Ready to watch' : 'Premium Content'}
                  </h3>
                  <p className="text-text-muted mb-4">
                    {hasAccess ? 'Open the distraction-free player when you are ready.' : 'Subscribe to watch this documentary'}
                  </p>
                  <Link href={hasAccess ? `/player?doc=${documentary.id}` : `/pricing`} className="btn-primary mt-8 inline-flex">{hasAccess ? 'Open player' : 'Subscribe now'}</Link>
                </div>
              </div>
          </div>

          {/* Trailer section for non-subscribers */}
          {!hasAccess && documentary.trailerUrl && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">Watch Trailer</h3>
              <div className="video-container aspect-video">
                <video
                  controls
                  className="w-full h-full"
                  poster={thumbnail}
                >
                  <source src={documentary.trailerUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}
          {!hasAccess && !documentary.trailerUrl && <div className="mb-8 rounded-xl border border-border bg-surface p-6 text-center text-text-muted">No trailer available. {trailerMessage}</div>}

          {/* Title and metadata */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {documentary.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            {documentary.rating && (
              <span className="flex items-center gap-1 text-gold">
                <Star className="w-5 h-5 fill-gold" />
                {documentary.rating.toFixed(1)}
              </span>
            )}
            {documentary.releaseDate && (
              <span className="flex items-center gap-1 text-text-muted">
                <Calendar className="w-4 h-4" />
                {new Date(documentary.releaseDate).getFullYear()}
              </span>
            )}
            {documentary.videoDuration && (
              <span className="flex items-center gap-1 text-text-muted">
                <Clock className="w-4 h-4" />
                {Math.floor(documentary.videoDuration / 60)} min
              </span>
            )}
            {documentary.category && (
              <span className="badge badge-primary flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {documentary.category}
              </span>
            )}
          </div>

          {/* Summary */}
          <div className="glass rounded-lg p-6">
            <h3 className="text-white font-semibold mb-3">About this documentary</h3>
            <p className="text-text-secondary leading-relaxed">
              {documentary.summary}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass rounded-lg p-6 sticky top-24">
            <h3 className="text-white font-semibold mb-4">Access Status</h3>
            {hasAccess ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-500 font-medium">You have access</p>
                <p className="text-text-muted text-sm mt-2">
                  Watch this documentary ad-free
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-white font-medium">Premium content</p>
                <p className="mb-5 mt-2 break-words text-sm text-text-muted">
                  {trailerMessage}
                </p>
                <div className="flex flex-col items-center gap-3">
                  <Link href={`/pricing`} className="btn-primary flex w-full items-center justify-center text-center">
                    Subscribe Now
                  </Link>
                  <Link href={`/register?plan=single&doc=${documentary.id}`} className="inline-block text-sm leading-5 text-text-muted underline">Buy only this documentary · 200 RWF</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
