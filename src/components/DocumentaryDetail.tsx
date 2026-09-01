import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, Calendar, Clock, Tag } from 'lucide-react';
import type { Documentary } from '@/lib/types';

interface DocumentaryDetailProps {
  documentary: Documentary;
  hasAccess: boolean;
}

export function DocumentaryDetail({ documentary, hasAccess }: DocumentaryDetailProps) {
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
          {/* Video player area */}
          <div className="video-container aspect-video mb-6">
            {hasAccess && documentary.videoUrl ? (
              <video
                controls
                controlsList="nodownload"
                className="w-full h-full"
                poster={documentary.thumbnailUrl || undefined}
              >
                <source src={documentary.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full bg-surface flex flex-col items-center justify-center">
                {documentary.thumbnailUrl ? (
                  <Image
                    src={documentary.thumbnailUrl}
                    alt={documentary.title}
                    fill
                    className="object-cover opacity-50"
                  />
                ) : null}
                <div className="relative z-10 text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Play className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">
                    {hasAccess ? 'Loading...' : 'Premium Content'}
                  </h3>
                  <p className="text-text-muted mb-4">
                    {hasAccess
                      ? 'Preparing your video...'
                      : 'Subscribe to watch this documentary'}
                  </p>
                  {!hasAccess && (
                    <Link href="/pricing" className="btn-primary">
                      Subscribe Now
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Trailer section for non-subscribers */}
          {!hasAccess && documentary.trailerUrl && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">Watch Trailer</h3>
              <div className="video-container aspect-video">
                <video
                  controls
                  className="w-full h-full"
                  poster={documentary.thumbnailUrl || undefined}
                >
                  <source src={documentary.trailerUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}

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
                <p className="text-text-muted text-sm mt-2 mb-4">
                  Subscribe to watch this documentary
                </p>
                <Link href="/pricing" className="btn-primary w-full">
                  Subscribe Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}