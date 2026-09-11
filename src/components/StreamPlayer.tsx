'use client';

import { useEffect, useState } from 'react';

type Props = {
  docId: string;
  poster?: string | null;
  /** Legacy R2 progressive URL — used if Stream token fails or still processing */
  fallbackUrl?: string | null;
};

export function StreamPlayer({ docId, poster, fallbackUrl }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/stream-token?doc=${encodeURIComponent(docId)}`);
        if (!res.ok) {
          if (fallbackUrl) {
            if (!cancelled) setUseFallback(true);
            return;
          }
          throw new Error('Unable to authorize playback');
        }
        const data = (await res.json()) as { token: string };
        if (!cancelled) setToken(data.token);
      } catch (e) {
        if (fallbackUrl && !cancelled) {
          setUseFallback(true);
          return;
        }
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Playback error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [docId, fallbackUrl]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-300">
        {error}
      </div>
    );
  }

  if (useFallback && fallbackUrl) {
    return (
      <video
        controls
        controlsList="nodownload"
        disablePictureInPicture
        className="w-full h-full"
        poster={poster || undefined}
      >
        <source src={fallbackUrl} type="video/mp4" />
      </video>
    );
  }

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted">
        Loading player…
      </div>
    );
  }

  const customerCode = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;
  // Prefer env on client; if missing, iframe path still works with full URL from API later.
  const src = customerCode
    ? `https://customer-${customerCode}.cloudflarestream.com/${token}/iframe?poster=${encodeURIComponent(poster || '')}`
    : `https://iframe.videodelivery.net/${token}`;

  return (
    <iframe
      src={src}
      title="Documentary player"
      className="h-full w-full border-0"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  );
}
