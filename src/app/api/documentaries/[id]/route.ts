import { NextRequest, NextResponse } from 'next/server';
import { getDocumentaryById } from '@/lib/db';
import { getCurrentUser, checkDocumentaryAccess } from '@/lib/auth';

// GET /api/documentaries/:id - Get documentary by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentary = await getDocumentaryById(id);

    if (!documentary) {
      return NextResponse.json(
        { error: 'Documentary not found' },
        { status: 404 }
      );
    }

    // Get current user to check access
    const user = await getCurrentUser();
    const access = await checkDocumentaryAccess(user?.id, id);

    // If user doesn't have access, don't expose the full video URL
    if (!access.hasAccess) {
      const { videoUrl, cloudinarySecureUrl, cloudinaryPublicId, ...safeDocumentary } = documentary;
      return NextResponse.json({
        success: true,
        documentary: {
          ...safeDocumentary,
          hasAccess: false,
          accessReason: access.reason,
        },
      });
    }

    return NextResponse.json({
      success: true,
      documentary: {
        ...documentary,
        hasAccess: true,
      },
    });
  } catch (error) {
    console.error('Error fetching documentary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documentary' },
      { status: 500 }
    );
  }
}