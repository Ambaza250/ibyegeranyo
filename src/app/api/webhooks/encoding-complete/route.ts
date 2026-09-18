import { NextRequest, NextResponse } from 'next/server';
import { getDb, collections } from '@/lib/firebase';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const expected = `Bearer ${process.env.ENCODING_WEBHOOK_SECRET}`;

  if (!auth || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      documentaryId: string;
      hlsPlaylistKey: string;
      status: 'ready' | 'error';
    };

    if (!body.documentaryId || !body.hlsPlaylistKey) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await getDb()
      .collection(collections.documentaries)
      .doc(body.documentaryId)
      .update({
        hlsPlaylistKey: body.hlsPlaylistKey,
        encodingStatus: body.status,
        updatedAt: new Date().toISOString(),
      });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Encoding webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
