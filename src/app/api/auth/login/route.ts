import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSessionToken, setSessionCookie } from '@/lib/auth';
import { normalizePhone } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    // Validate required fields
    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone number and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const result = await authenticateUser(phone, password);

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    const user = result.user;

    // Create session token
    const sessionToken = await createSessionToken({
      userId: user.id,
      phone: user.phone,
      fullName: user.fullName,
      subscriptionStatus: user.subscriptionStatus,
      expiresAt: user.expiresAt || '',
    });

    // Set session cookie
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: normalizePhone(user.phone),
        subscriptionStatus: user.subscriptionStatus,
        selectedPlan: user.selectedPlan,
        expiresAt: user.expiresAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}