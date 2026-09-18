import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import type { Documentary } from '@/lib/types';
import { getVideoThumbnail } from '@/lib/cloudinary';

interface DocumentaryCardProps {
  documentary: Documentary;
  featured?: boolean;
  /** ~2× visual size for homepage “top documentary” */
  large?: boolean;
}

export function DocumentaryCard({
  documentary,
  featured = false,
  large = false,
}: DocumentaryCardProps) {
  const fallbacks = [
    'https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,h_540,q_auto,w_960/samples/landscapes/nature-mountains.jpg',
    'https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,h_540,q_auto,w_960/samples/landscapes/landscape-panorama.jpg',
    'https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,h_540,q_auto,w_960/samples/animals/three-dogs.jpg',
  ];
  const thumbnail =
    documentary.thumbnailUrl ||
    (documentary.cloudinaryPublicId
      ? getVideoThumbnail(documentary.cloudinaryPublicId)
      : fallbacks[documentary.id.charCodeAt(0) % fallbacks.length]);

  return (
    <Link
      href={`/documentaries/${documentary.id}`}
      className={`card group ${featured ? 'col-span-1' : ''} ${
        large ? 'overflow-hidden' : ''
      }`}
    >
      {/* Thumbnail */}
      <div
        className={`relative overflow-hidden ${
          large ? 'aspect-[16/9] md:aspect-[2/1]' : 'aspect-video'
        }`}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={documentary.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-surface-hover flex items-center justify-center">
            <Play className={large ? 'w-16 h-16 text-text-muted' : 'w-12 h-12 text-text-muted'} />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className={`rounded-full bg-primary/90 flex items-center justify-center ${
              large ? 'w-20 h-20' : 'w-14 h-14'
            }`}
          >
            <Play
              className={`text-white fill-white ${large ? 'w-8 h-8' : 'w-6 h-6'}`}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={large ? 'p-6 md:p-8' : 'p-4'}>
        <h3
          className={`text-white font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors ${
            large ? 'text-2xl md:text-3xl' : 'text-lg'
          }`}
        >
          {documentary.title}
        </h3>

        {documentary.category && (
          <div className={large ? 'mb-3' : 'mb-2'}>
            <span className="badge badge-primary">{documentary.category}</span>
          </div>
        )}

        <p
          className={`text-text-muted mb-3 ${
            large ? 'text-base line-clamp-3 md:line-clamp-4' : 'text-sm line-clamp-2'
          }`}
        >
          {documentary.summary}
        </p>

        <div
          className={`flex items-center gap-4 text-text-muted ${
            large ? 'text-sm' : 'text-xs'
          }`}
        >
          {documentary.rating && (
            <span className="flex items-center gap-1">
              <Star
                className={`text-gold fill-gold ${large ? 'w-4 h-4' : 'w-3 h-3'}`}
              />
              {documentary.rating.toFixed(1)}
            </span>
          )}
          {documentary.releaseDate && (
            <span>{new Date(documentary.releaseDate).getFullYear()}</span>
          )}
          {documentary.videoDuration && (
            <span>{Math.floor(documentary.videoDuration / 60)} min</span>
          )}
        </div>
      </div>
    </Link>
  );
}
