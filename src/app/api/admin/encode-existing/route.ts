import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getDb, collections } from '@/lib/firebase';
import { triggerHlsEncoding } from '@/lib/github';
import type { Documentary } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Only admins can run this
    if (!(await getCurrentAdmin())) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDb();
    const snapshot = await db.collection(collections.documentaries).get();

    const documentaries = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Documentary
    );

    // Find videos that still need free HLS encoding
    const toEncode = documentaries.filter((doc) => {
      const needsEncoding =
        !doc.encodingStatus ||
        doc.encodingStatus === 'pending' ||
        doc.encodingStatus === 'error' ||
        !doc.hlsPlaylistKey;

      const hasMasterVideo = Boolean(doc.videoR2Key);

      return needsEncoding && hasMasterVideo;
    });

    if (toEncode.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All documentaries already have HLS encoding (or no videos found).',
        triggered: 0,
      });
    }

    const results: { id: string; title: string; status: string }[] = [];

    // Trigger encoding for each one (with a small delay to avoid rate limits)
    for (const doc of toEncode) {
      try {
        // Mark as processing so we don't trigger again
        await db.collection(collections.documentaries).doc(doc.id).update({
          encodingStatus: 'processing',
          updatedAt: new Date().toISOString(),
        });

        await triggerHlsEncoding({
          r2Key: doc.videoR2Key!,
          documentaryId: doc.id,
        });

        results.push({
          id: doc.id,
          title: doc.title,
          status: 'triggered',
        });

        // Small delay between triggers (GitHub rate limits)
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (err) {
        console.error(`Failed to trigger encoding for ${doc.id}:`, err);
        results.push({
          id: doc.id,
          title: doc.title,
          status: 'failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Triggered HLS encoding for ${results.filter(r => r.status === 'triggered').length} documentaries`,
      triggered: results.filter((r) => r.status === 'triggered').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    });
  } catch (error) {
    console.error('Batch encode error:', error);
    return NextResponse.json(
      { error: 'Failed to start batch encoding' },
      { status: 500 }
    );
  }
}
