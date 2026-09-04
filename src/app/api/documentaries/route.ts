import { NextResponse } from 'next/server';
import { getAllDocumentaries, getFeaturedDocumentaries, getRecentDocumentaries } from '@/lib/db';

// GET /api/documentaries - Get all documentaries
// GET /api/documentaries?featured=true - Get featured documentaries
// GET /api/documentaries?recent=true - Get recent documentaries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';
    const recent = searchParams.get('recent') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    let documentaries;

    if (featured) {
      documentaries = await getFeaturedDocumentaries();
    } else if (recent) {
      documentaries = await getRecentDocumentaries(limit);
    } else {
      documentaries = await getAllDocumentaries();
    }

    // Catalog responses are public. Never serialize protected playback fields.
    const safeDocumentaries = documentaries.map(({ videoUrl, cloudinarySecureUrl, cloudinaryPublicId, ...documentary }) => {
      void videoUrl; void cloudinarySecureUrl; void cloudinaryPublicId;
      return documentary;
    });
    return NextResponse.json({ success: true, documentaries: safeDocumentaries });
  } catch (error) {
    console.error('Error fetching documentaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documentaries' },
      { status: 500 }
    );
  }
}
