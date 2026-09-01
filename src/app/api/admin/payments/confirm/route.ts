import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { confirmPayment, rejectPayment } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentId, action } = body;

    if (!paymentId || !action) {
      return NextResponse.json(
        { error: 'Payment ID and action are required' },
        { status: 400 }
      );
    }

    if (action === 'confirm') {
      const result = await confirmPayment(paymentId, admin.id);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to confirm payment' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed successfully',
      });
    } else if (action === 'reject') {
      await rejectPayment(paymentId);

      return NextResponse.json({
        success: true,
        message: 'Payment rejected',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}