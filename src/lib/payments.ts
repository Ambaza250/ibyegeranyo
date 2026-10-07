// Automatic payments through iTechPay.
//
// Flow: the server saves a pending payment (its id is the gateway `req_ref`),
// then asks iTechPay to collect. A payment is only ever activated after the
// server itself asks iTechPay for the live status and the reported amount
// matches what we charged — nothing in a callback body is trusted. Webhooks are
// unreliable, so four paths call `reconcilePayment`: the webhook, the payment
// page's polling, the account-page sweep and the cron job (plus admins).

import { randomUUID } from 'node:crypto';
import {
  activatePayment,
  createPayment,
  getPaymentById,
  getPendingPayments,
  getUserById,
  markPaymentFailed,
  updatePaymentGatewayInfo,
} from './db';
import { getDb, collections } from './firebase';
import {
  createCardPayment,
  requestMobileMoney,
  verifyPayment,
  type GatewayMethod,
} from './itecpay';
import { sendWhatsAppTemplate } from './whatsapp';
import { PLANS, type Payment, type Plan, type User } from './types';

/** A mobile money prompt left unanswered this long is treated as failed. */
const MOBILE_MONEY_TIMEOUT_MS = 5 * 60 * 1000;
/** Card checkout takes longer (typing card details, 3-D Secure). */
const CARD_TIMEOUT_MS = 30 * 60 * 1000;
/** Timed-out payments are re-checked this long, in case the money arrives late. */
const LATE_RECHECK_WINDOW_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_STATUS = 'timeout';

export function isGatewayPayment(payment: Pick<Payment, 'method'>): payment is Payment & { method: GatewayMethod } {
  return payment.method === 'mobile_money' || payment.method === 'airtel_money' || payment.method === 'card';
}

export async function startGatewayPayment(params: {
  user: User;
  plan: Plan;
  documentaryId?: string;
  method: GatewayMethod;
  phone: string;
  email?: string;
  siteUrl: string;
}): Promise<{ reference: string; paymentUrl: string | null; message: string }> {
  const { user, plan, method } = params;
  const reference = randomUUID();

  // Save first so a fast webhook always finds the payment.
  await createPayment({
    id: reference,
    userId: user.id,
    phone: params.phone,
    plan: plan.id,
    amount: plan.price,
    documentaryId: params.documentaryId,
    method,
  });

  try {
    if (method === 'card') {
      const callbackUrl = `${params.siteUrl}/payment/return?reference=${reference}`;
      const { paymentUrl, pcode } = await createCardPayment({
        amount: plan.price,
        email: params.email!,
        reference,
        callbackUrl,
      });
      await updatePaymentGatewayInfo(reference, { gatewayTransactionId: pcode });
      return { reference, paymentUrl, message: 'Redirecting you to the secure card payment page.' };
    }

    const result = await requestMobileMoney({ method, amount: plan.price, phone: params.phone, reference });
    if (!result.accepted) {
      await markPaymentFailed(reference, 'request_refused');
      throw new PaymentStartError(result.message || 'The payment request was refused. Check the phone number and try again.');
    }
    if (result.transactionId) {
      await updatePaymentGatewayInfo(reference, { gatewayTransactionId: result.transactionId });
    }
    return {
      reference,
      paymentUrl: null,
      message: 'Check your phone and enter your PIN to approve the payment.',
    };
  } catch (error) {
    if (error instanceof PaymentStartError) throw error;
    console.error(`[payments] Failed to start ${method} payment ${reference}:`, error);
    if (method === 'card') {
      // No checkout page means no money can move: safe to fail right away.
      await markPaymentFailed(reference, 'start_failed');
      throw new PaymentStartError('We could not open the card payment page. Please try again in a moment.');
    }
    // We don't know whether the phone prompt went out, so the payment stays
    // pending and the normal checks settle it. Returning the reference lets
    // the page keep watching it instead of inviting a second payment.
    throw new PaymentStartError('We could not confirm the payment request was sent. If you get a prompt on your phone, approve it.', reference);
  }
}

export class PaymentStartError extends Error {
  constructor(message: string, readonly reference?: string) {
    super(message);
  }
}

export type ReconcileStatus = 'confirmed' | 'pending' | 'failed' | 'rejected' | 'not_found';

export interface ReconcileResult {
  status: ReconcileStatus;
  /** Why the payment wasn't activated, when that's useful to show. */
  detail?: string;
}

/**
 * Re-checks one payment with iTechPay and activates it when paid. Safe to call
 * any number of times, from anywhere. Never activates without a successful
 * verify call whose amount matches.
 */
export async function reconcilePayment(
  paymentId: string,
  source: 'webhook' | 'poll' | 'sweep' | 'cron' | 'admin',
  options: { dryRun?: boolean } = {}
): Promise<ReconcileResult> {
  const payment = await getPaymentById(paymentId);
  if (!payment) return { status: 'not_found' };
  if (payment.status === 'confirmed') return { status: 'confirmed' };
  if (payment.status === 'rejected') return { status: 'rejected' };
  if (!isGatewayPayment(payment)) return { status: payment.status };

  let verified;
  try {
    verified = await verifyPayment(payment.id, payment.method);
  } catch (error) {
    // Never fall back to trusting a callback: leave the payment as it is.
    console.error(`[payments] Verify failed for ${payment.id} (${source}):`, error);
    return { status: payment.status, detail: 'Could not reach the payment provider' };
  }

  if (verified.state === 'paid') {
    if (verified.amount !== null && verified.amount !== payment.amount) {
      const note = `iTechPay reported ${verified.amount} RWF, expected ${payment.amount} RWF`;
      console.warn(`[payments] Amount mismatch for ${payment.id}: ${note}`);
      if (!options.dryRun) {
        await updatePaymentGatewayInfo(payment.id, {
          gatewayStatus: verified.rawStatus,
          needsReview: `${note} (iTechPay deducted service fees)`,
          receivedAmount: verified.amount,
        });
      }
    } else if (verified.amount === null) {
      console.warn(`[payments] iTechPay verify for ${payment.id} reported no amount; activating on status alone`);
    }
    if (options.dryRun) return { status: 'confirmed', detail: 'dry run: would activate' };

    const result = await activatePayment(payment.id, `itecpay:${source}`, {
      transactionId: verified.transactionId,
      status: verified.rawStatus,
    });
    if (!result.success) return { status: payment.status, detail: result.error };
    if (!result.alreadyConfirmed) await notifyPaymentApproved(payment.id);
    return { status: 'confirmed' };
  }

  if (verified.state === 'failed') {
    if (payment.status === 'pending' && !options.dryRun) await markPaymentFailed(payment.id, verified.rawStatus);
    return { status: 'failed', detail: verified.rawStatus ?? undefined };
  }

  // Still pending at the gateway. Give up on prompts nobody answered so the
  // customer isn't stuck on a payment that looks pending forever.
  const timeout = payment.method === 'card' ? CARD_TIMEOUT_MS : MOBILE_MONEY_TIMEOUT_MS;
  if (payment.status === 'pending' && Date.now() - new Date(payment.createdAt).getTime() > timeout) {
    if (!options.dryRun) await markPaymentFailed(payment.id, TIMEOUT_STATUS);
    return { status: 'failed', detail: 'The payment was not approved in time' };
  }

  if (verified.rawStatus && verified.rawStatus !== payment.gatewayStatus && !options.dryRun) {
    await updatePaymentGatewayInfo(payment.id, { gatewayStatus: verified.rawStatus });
  }
  return { status: payment.status };
}

/**
 * Re-checks every gateway payment that is still pending, plus payments that
 * timed out recently (the money can arrive after we stop waiting).
 */
export async function reconcileOpenPayments(options: { dryRun?: boolean } = {}) {
  const db = getDb();
  const since = new Date(Date.now() - LATE_RECHECK_WINDOW_MS).toISOString();
  const [pending, failedSnapshot] = await Promise.all([
    getPendingPayments(),
    db
      .collection(collections.payments)
      .where('status', '==', 'failed')
      .where('createdAt', '>=', since)
      .orderBy('createdAt', 'desc')
      .get(),
  ]);
  const timedOut = failedSnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Payment)
    .filter((payment) => payment.gatewayStatus === TIMEOUT_STATUS);

  const results: Array<{ id: string; before: Payment['status']; after: ReconcileStatus; detail?: string }> = [];
  for (const payment of [...pending, ...timedOut]) {
    if (!isGatewayPayment(payment)) continue;
    const result = await reconcilePayment(payment.id, 'cron', options);
    results.push({ id: payment.id, before: payment.status, after: result.status, detail: result.detail });
  }
  return results;
}

/** Sends the "payment approved" WhatsApp message. Never throws. */
export async function notifyPaymentApproved(paymentId: string): Promise<void> {
  try {
    const payment = await getPaymentById(paymentId);
    if (!payment) return;
    const user = await getUserById(payment.userId);
    const plan = PLANS.find((p) => p.id === payment.plan);
    const planName = plan?.name || payment.plan;
    const expiresAt = payment.expiresAt
      ? new Date(payment.expiresAt).toLocaleDateString("rw-RW")
      : "—";

    await sendWhatsAppTemplate({
      to: payment.phone,
      templateName: "payment_approved", // exact name of your template
      languageCode: "rw",               // change to "en" if you chose English
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: user?.fullName || "umukiriya" },
            { type: "text", text: planName },
            { type: "text", text: expiresAt },
          ],
        },
      ],
    });
  } catch (waError) {
    // Don't fail the approval if WhatsApp fails
    console.error("WhatsApp notification failed:", waError);
  }
}
