import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAdminSessionToken, setAdminSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Authenticate admin
    const result = await authenticateAdmin(username, password);

    if (!result.success || !result.admin) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    const admin = result.admin;

    // Create admin session token
    const sessionToken = await createAdminSessionToken({
      adminId: admin.id,
      username: admin.username,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    // Set admin session cookie
    await setAdminSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}