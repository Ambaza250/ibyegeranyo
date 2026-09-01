import Link from 'next/link';
import Image from 'next/image';
import { Play, Star } from 'lucide-react';
import type { Documentary } from '@/lib/types';

interface DocumentaryCardProps {
  documentary: Documentary;
  featured?: boolean;
}

export function DocumentaryCard({ documentary, featured = false }: DocumentaryCardProps) {
  return (
    <Link
      href={`/documentaries/${documentary.id}`}
      className={`card group ${featured ? 'col-span-1' : ''}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {documentary.thumbnailUrl ? (
          <Image
            src={documentary.thumbnailUrl}
            alt={documentary.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-surface-hover flex items-center justify-center">
            <Play className="w-12 h-12 text-text-muted" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>

        {/* Category badge */}
        {documentary.category && (
          <div className="absolute top-3 left-3">
            <span className="badge badge-primary">{documentary.category}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {documentary.title}
        </h3>
        <p className="text-text-muted text-sm line-clamp-2 mb-3">
          {documentary.summary}
        </p>
        
        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-text-muted">
          {documentary.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-gold fill-gold" />
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