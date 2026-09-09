import { NextRequest, NextResponse } from 'next/server';
import { checkDocumentaryAccess, getCurrentUser } from '@/lib/auth';
import { collections, getDb } from '@/lib/firebase';
import { getR2Object } from '@/lib/r2';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key?.startsWith('documentaries/')) return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  try {
    const fields = ['videoR2Key', 'trailerR2Key', 'thumbnailR2Key'] as const;
    let field: typeof fields[number] | undefined; let documentaryId: string | undefined;
    for (const candidate of fields) {
      const match = await getDb().collection(collections.documentaries).where(candidate, '==', key).limit(1).get();
      if (!match.empty) { field = candidate; documentaryId = match.docs[0].id; break; }
    }
    if (!field || !documentaryId) return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    if (field === 'videoR2Key') {
      const user = await getCurrentUser();
      if (!(await checkDocumentaryAccess(user?.id, documentaryId)).hasAccess) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    const object = await getR2Object(key, request.headers.get('range') || undefined);
    if (!object.Body) return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    const headers = new Headers({
      'Accept-Ranges': 'bytes',
      'Content-Type': object.ContentType || 'application/octet-stream',
      'Cache-Control': field === 'videoR2Key' ? 'private, no-store' : 'public, max-age=3600',
    });
    if (object.ContentLength !== undefined) headers.set('Content-Length', String(object.ContentLength));
    if (object.ContentRange) headers.set('Content-Range', object.ContentRange);
    return new NextResponse(object.Body.transformToWebStream(), { status: object.ContentRange ? 206 : 200, headers });
  } catch (error) {
    console.error('Unable to serve R2 media:', error);
    return NextResponse.json({ error: 'Unable to load media' }, { status: 500 });
  }
}
