import { NextResponse } from 'next/server';

// Trailer media is intentionally never proxied through this route. The admin
// UI uses the authenticated direct-to-R2 flow.
export async function POST() {
  return NextResponse.json({ error: 'Use the direct R2 upload flow.' }, { status: 410 });
}
