import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updatePaymentProof, getPaymentById } from '@/lib/db';
import { uploadToBlob } from '@/lib/blob';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to upload payment proof' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const paymentId = formData.get('paymentId') as string;
    const file = formData.get('file') as File;

    if (!paymentId || !file) {
      return NextResponse.json(
        { error: 'Payment ID and file are required' },
        { status: 400 }
      );
    }

    // Verify payment belongs to user
    const payment = await getPaymentById(paymentId);
    if (!payment || payment.userId !== user.id) {
      return NextResponse.json(
        { error: 'Payment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPEG, PNG, WebP, GIF)' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Upload file to Vercel Blob
    const blobResult = await uploadToBlob(
      file,
      `payment-proofs/${user.id}/${paymentId}-${Date.now()}.${file.name.split('.').pop()}`,
      { contentType: file.type }
    );

    // Update payment with proof URL
    await updatePaymentProof(paymentId, blobResult.url);

    return NextResponse.json({
      success: true,
      proofUrl: blobResult.url,
      message: 'Payment proof uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    return NextResponse.json(
      { error: 'Failed to upload payment proof' },
      { status: 500 }
    );
  }
}