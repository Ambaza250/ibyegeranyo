import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getDocumentaryById } from '@/lib/db';
import { createPresignedR2PutUrl, createR2ObjectKey, type R2AssetKind, validateR2Upload } from '@/lib/r2';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const body = await request.json() as { kind?: R2AssetKind; filename?: string; contentType?: string; size?: number; documentaryId?: string };
    if (!body.kind || !['documentary', 'trailer', 'thumbnail'].includes(body.kind) || !body.filename || !body.contentType) {
      return NextResponse.json({ error: 'Invalid upload details' }, { status: 400 });
    }
    if ((body.kind === 'trailer' || body.kind === 'thumbnail') && (!body.documentaryId || !(await getDocumentaryById(body.documentaryId)))) {
      return NextResponse.json({ error: 'Documentary not found' }, { status: 404 });
    }
    validateR2Upload(body.kind, body.contentType, Number(body.size));
    const key = createR2ObjectKey(body.kind, body.filename, body.documentaryId);
    return NextResponse.json({ key, uploadUrl: await createPresignedR2PutUrl(key) });
  } catch (error) {
    console.error('Unable to authorize R2 upload:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to start upload' }, { status: 400 });
  }
}
