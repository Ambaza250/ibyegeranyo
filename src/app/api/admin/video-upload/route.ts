import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';

const allowedContentTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const maxVideoSize = 2 * 1024 * 1024 * 1024;

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HandleUploadBody;

    // Blob calls this route after a successful upload. The SDK verifies that
    // callback, so it does not carry the browser's admin-session cookie.
    if (body.type !== 'blob.upload-completed' && !(await getCurrentAdmin())) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('admin-video-staging/')) {
          throw new Error('Invalid upload path');
        }

        return {
          allowedContentTypes,
          maximumSizeInBytes: maxVideoSize,
          addRandomSuffix: false,
        };
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unable to authorize video upload:', error);
    return NextResponse.json({ error: 'Unable to start video upload' }, { status: 400 });
  }
}
