import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { createDocumentary } from '@/lib/db';
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
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;
    const category = formData.get('category') as string;
    const rating = formData.get('rating') as string;
    const releaseDate = formData.get('releaseDate') as string;
    const featured = formData.get('featured') === 'true';
    const file = formData.get('file') as File;

    // Validate required fields
    if (!title || !summary || !category || !file) {
      return NextResponse.json(
        { error: 'Title, summary, category, and video file are required' },
        { status: 400 }
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

    // Validate file size (max 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2GB' },
        { status: 400 }
      );
    }

    // Upload video through pipeline: Vercel Blob -> Cloudinary
    const uploadResult = await uploadVideoPipeline(file, {
      folder: 'ibyegeranyo/documentaries',
    });

    // Create documentary record
    const documentaryId = await createDocumentary({
      title,
      summary,
      category,
      rating: rating ? parseFloat(rating) : undefined,
      releaseDate: releaseDate || undefined,
      cloudinaryPublicId: uploadResult.cloudinaryPublicId,
      cloudinarySecureUrl: uploadResult.cloudinarySecureUrl,
      videoDuration: uploadResult.duration,
      featured,
    });

    return NextResponse.json({
      success: true,
      documentaryId,
      message: 'Documentary uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading documentary:', error);
    return NextResponse.json(
      { error: 'Failed to upload documentary' },
      { status: 500 }
    );
  }
}