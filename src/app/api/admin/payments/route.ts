import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getAllPayments } from '@/lib/db';

// GET /api/admin/payments - Get all payments
export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payments = await getAllPayments();

    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}