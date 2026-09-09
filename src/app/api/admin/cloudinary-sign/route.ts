import { NextResponse } from 'next/server';

// Retained as an explicit migration guard for callers on the old admin UI.
export async function POST() {
  return NextResponse.json({ error: 'Cloudinary uploads have moved to direct R2 uploads.' }, { status: 410 });
}
