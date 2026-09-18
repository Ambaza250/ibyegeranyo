import { NextRequest, NextResponse } from 'next/server';
import { checkDocumentaryAccess, getCurrentUser } from '@/lib/auth';
import { collections, getDb } from '@/lib/firebase';
import { createPresignedR2GetUrl } from '@/lib/r2';

export const runtime = 'nodejs';

/**
 * Auth + short-lived signed R2 URL.
 * Video bytes never pass through Vercel — the browser (or player) fetches
 * directly from R2 after the redirect.
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key?.startsWith('documentaries/')) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  }

  try {
    const fields = ['videoR2Key', 'trailerR2Key', 'thumbnailR2Key'] as const;
    let field: (typeof fields)[number] | undefined;
    let documentaryId: string | undefined;

    for (const candidate of fields) {
      const match = await getDb()
        .collection(collections.documentaries)
        .where(candidate, '==', key)
        .limit(1)
        .get();
      if (!match.empty) {
        field = candidate;
        documentaryId = match.docs[0].id;
        break;
      }
    }

    if (!field || !documentaryId) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Full documentaries require an active subscription / purchase.
    if (field === 'videoR2Key') {
      const user = await getCurrentUser();
      if (!(await checkDocumentaryAccess(user?.id, documentaryId)).hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Longer TTL for full videos so seeking / long sessions still work.
    // Trailers & thumbnails can be shorter.
    const expiresIn =
      field === 'videoR2Key' ? 4 * 60 * 60 : // 4 hours
      field === 'trailerR2Key' ? 60 * 60 :   // 1 hour
      24 * 60 * 60;                          // 24 hours for thumbnails

    const signedUrl = await createPresignedR2GetUrl(key, expiresIn);

    // 302 so <video> and <img> follow the URL automatically.
    // No video bytes touch Vercel → Fast Origin Transfer & CPU stay low.
    return NextResponse.redirect(signedUrl, 302);
  } catch (error) {
    console.error('Unable to serve R2 media:', error);
    return NextResponse.json({ error: 'Unable to load media' }, { status: 500 });
  }
}
