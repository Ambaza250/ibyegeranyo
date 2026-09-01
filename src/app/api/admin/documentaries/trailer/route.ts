import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { addTrailerToDocumentary, getDocumentaryById } from '@/lib/db';
import { uploadVideoPipeline } from '@/lib/blob';

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const documentaryId = formData.get('documentaryId') as string;
    const file = formData.get('file') as File;

    // Validate required fields
    if (!documentaryId || !file) {
      return NextResponse.json(
        { error: 'Documentary ID and trailer file are required' },
        { status: 400 }
      );
    }

    // Verify documentary exists
    const documentary = await getDocumentaryById(documentaryId);
    if (!documentary) {
      return NextResponse.json(
        { error: 'Documentary not found' },
        { status: 404 }
      );
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a video file (MP4, WebM, MOV, AVI)' },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB for trailers)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500MB' },
        { status: 400 }
      );
    }

    // Upload trailer through pipeline: Vercel Blob -> Cloudinary
    const uploadResult = await uploadVideoPipeline(file, {
      folder: 'ibyegeranyo/trailers',
    });

    // Add trailer to documentary
    await addTrailerToDocumentary(
      documentaryId,
      uploadResult.cloudinaryPublicId,
      uploadResult.cloudinarySecureUrl
    );

    return NextResponse.json({
      success: true,
      message: 'Trailer uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading trailer:', error);
    return NextResponse.json(
      { error: 'Failed to upload trailer' },
      { status: 500 }
    );
  }
}