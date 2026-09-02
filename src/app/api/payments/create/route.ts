import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createPayment, getDocumentaryById } from '@/lib/db';
import { PLANS } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to make a payment' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, documentaryId } = body;

    // Validate plan
    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan is required' },
        { status: 400 }
      );
    }

    const selectedPlan = PLANS.find((p) => p.id === plan);
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    // For single documentary plan, documentaryId is required
    if (plan === 'single' && !documentaryId) {
      return NextResponse.json(
        { error: 'Documentary ID is required for single documentary plan' },
        { status: 400 }
      );
    }
    if (plan === 'single' && documentaryId) {
      const documentary = await getDocumentaryById(documentaryId);
      if (!documentary || documentary.status !== 'published') {
        return NextResponse.json({ error: 'Documentary not found' }, { status: 404 });
      }
    }

    // Create payment with server-determined amount
    const paymentId = await createPayment({
      userId: user.id,
      phone: user.phone,
      plan,
      amount: selectedPlan.price,
      documentaryId: documentaryId || undefined,
    });

    return NextResponse.json({
      success: true,
      paymentId,
      plan: selectedPlan,
      message: 'Payment created. Please upload your payment proof.',
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
