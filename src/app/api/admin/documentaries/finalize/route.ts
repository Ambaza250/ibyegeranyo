import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import {
  addTrailerToDocumentary,
  createDocumentary,
  getDocumentaryById,
  setDocumentaryThumbnail,
} from '@/lib/db';
import {
  assertR2ObjectExists,
  createPresignedR2GetUrl,
  r2ObjectUrl,
  type R2AssetKind,
  validateR2Upload,
} from '@/lib/r2';
import { copyVideoToStream } from '@/lib/stream';

type FinalizeBody = {
  kind: R2AssetKind;
  key: string;
  contentType: string;
  size: number;
  title?: string;
  summary?: string;
  category?: string;
  rating?: string;
  releaseDate?: string;
  featured?: boolean;
  documentaryId?: string;
};

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as FinalizeBody;
    if (
      !body.key ||
      !body.contentType ||
      !['documentary', 'trailer', 'thumbnail'].includes(body.kind)
    ) {
      return NextResponse.json({ error: 'Invalid upload details' }, { status: 400 });
    }

    validateR2Upload(body.kind, body.contentType, body.size);

    const expectedPrefix = body.documentaryId
      ? `documentaries/${body.documentaryId}/`
      : 'documentaries/new-';
    if (
      !body.key.startsWith(expectedPrefix) ||
      !body.key.includes(`/${body.kind}/`)
    ) {
      return NextResponse.json({ error: 'Invalid uploaded asset' }, { status: 400 });
    }

    const object = await assertR2ObjectExists(body.key);
    if (
      object.ContentLength !== body.size ||
      object.ContentType !== body.contentType
    ) {
      return NextResponse.json(
        { error: 'Uploaded file could not be verified' },
        { status: 400 }
      );
    }

    const assetUrl = r2ObjectUrl(body.key);

    // --- Full documentary: R2 master + Stream adaptive encoding ---
    if (body.kind === 'documentary') {
      if (!body.title || !body.summary || !body.category) {
        return NextResponse.json(
          { error: 'Title, summary, and category are required' },
          { status: 400 }
        );
      }

      let streamUid: string | null = null;
      let streamStatus: 'ready' | 'processing' | 'error' | null = null;

      try {
        // Temporary signed GET so Stream can download the private R2 object
        const sourceUrl = await createPresignedR2GetUrl(body.key, 60 * 60);
        const streamResult = await copyVideoToStream({
          sourceUrl,
          name: body.title,
          requireSignedURLs: true,
        });
        streamUid = streamResult.uid;
        streamStatus = streamResult.readyToStream ? 'ready' : 'processing';
      } catch (streamError) {
        // Do not fail the whole upload if Stream is temporarily down.
        // Admin still gets an R2-backed documentary (legacy player path).
        console.error('Stream copy failed (R2 master still saved):', streamError);
        streamStatus = 'error';
      }

      const documentaryId = await createDocumentary({
        title: body.title,
        summary: body.summary,
        category: body.category,
        rating: body.rating ? Number.parseFloat(body.rating) : undefined,
        releaseDate: body.releaseDate || undefined,
        videoUrl: assetUrl,
        videoR2Key: body.key,
        featured: body.featured === true,
        streamUid,
        streamStatus,
      });

      return NextResponse.json({
        success: true,
        documentaryId,
        streamUid,
        streamStatus,
        message:
          streamStatus === 'processing'
            ? 'Documentary uploaded. Adaptive qualities are encoding in the background.'
            : streamStatus === 'ready'
              ? 'Documentary uploaded and ready on Stream.'
              : 'Documentary uploaded to R2. Stream encoding failed — legacy playback still works.',
      });
    }

    // --- Trailer / thumbnail (unchanged, still R2 only) ---
    if (!body.documentaryId || !(await getDocumentaryById(body.documentaryId))) {
      return NextResponse.json({ error: 'Documentary not found' }, { status: 404 });
    }

    if (body.kind === 'trailer') {
      await addTrailerToDocumentary(body.documentaryId, assetUrl, body.key);
      return NextResponse.json({
        success: true,
        message: 'Trailer uploaded successfully',
      });
    }

    await setDocumentaryThumbnail(body.documentaryId, assetUrl, body.key);
    return NextResponse.json({
      success: true,
      message: 'Thumbnail uploaded successfully',
    });
  } catch (error) {
    console.error('Error finalizing video upload:', error);
    return NextResponse.json(
      { error: 'Unable to process the uploaded video' },
      { status: 500 }
    );
  }
}
