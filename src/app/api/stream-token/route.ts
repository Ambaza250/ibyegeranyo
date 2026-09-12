import { NextRequest, NextResponse } from 'next/server';
import { checkDocumentaryAccess, getCurrentUser } from '@/lib/auth';
import { getDocumentaryById } from '@/lib/db';
import { createStreamSignedToken } from '@/lib/stream';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const docId = request.nextUrl.searchParams.get('doc');
  if (!docId) {
    return NextResponse.json({ error: 'Missing doc id' }, { status: 400 });
  }

  const documentary = await getDocumentaryById(docId);
  if (!documentary?.streamUid) {
    return NextResponse.json(
      { error: 'This documentary is not on Stream' },
      { status: 404 }
    );
  }

  const user = await getCurrentUser();
  const access = await checkDocumentaryAccess(user?.id, documentary.id);
  if (!access.hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const token = await createStreamSignedToken(documentary.streamUid);
    return NextResponse.json({
      token,
      streamUid: documentary.streamUid,
      streamStatus: documentary.streamStatus ?? null,
    });
  } catch (error) {
    console.error('Unable to create Stream token:', error);
    return NextResponse.json(
      { error: 'Unable to create playback token' },
      { status: 500 }
    );
  }
}
