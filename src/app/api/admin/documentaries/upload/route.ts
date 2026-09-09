import { NextResponse } from 'next/server';

// Documentary media is intentionally never proxied through this route. The
// admin UI obtains a short-lived URL from /api/admin/r2-upload instead.
export async function POST() {
  return NextResponse.json({ error: 'Use the direct R2 upload flow.' }, { status: 410 });
}
