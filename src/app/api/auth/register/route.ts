import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { isValidPhone } from '@/lib/utils';
import { PLANS } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, password, plan } = body;

    // Validate required fields
    if (!fullName || !phone || !password) {
      return NextResponse.json(
        { error: 'Full name, phone number, and password are required' },
        { status: 400 }
      );
    }

    // Validate phone number
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate plan if provided
    if (plan && !PLANS.find((p) => p.id === plan)) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    // Register user
    const result = await registerUser(fullName, phone, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: result.userId,
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}