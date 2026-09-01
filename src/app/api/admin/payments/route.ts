import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getPendingPayments } from '@/lib/db';

// GET /api/admin/payments - Get pending payments
export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payments = await getPendingPayments();

    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending payments' },
      { status: 500 }
    );
  }
}