import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { updateDocumentaryStreamStatus } from '@/lib/db';

export const runtime = 'nodejs';

function verifySignature(
  body: string,
  header: string | null,
  secret: string
): boolean {
  if (!header) return false;
  // Header format: time=...,sig1=...
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k.trim(), v?.trim() ?? ''];
    })
  );
  const time = parts.time;
  const sig = parts.sig1;
  if (!time || !sig) return false;

  const expected = createHmac('sha256', secret)
    .update(`${time}.${body}`)
    .digest('hex');

  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET;
  const raw = await request.text();

  if (secret) {
    const ok = verifySignature(
      raw,
      request.headers.get('Webhook-Signature'),
      secret
    );
    if (!ok) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  try {
    const payload = JSON.parse(raw) as {
      uid?: string;
      readyToStream?: boolean;
      status?: { state?: string; errorReasonText?: string };
      duration?: number;
    };

    const uid = payload.uid;
    if (!uid) {
      return NextResponse.json({ ok: true });
    }

    if (payload.readyToStream || payload.status?.state === 'ready') {
      await updateDocumentaryStreamStatus(uid, 'ready', {
        videoDuration:
          typeof payload.duration === 'number' ? payload.duration : undefined,
      });
    } else if (payload.status?.state === 'error') {
      await updateDocumentaryStreamStatus(uid, 'error');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Stream webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
