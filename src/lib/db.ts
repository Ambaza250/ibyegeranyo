import { getDb, collections } from './firebase';
import { generateId, calculateExpiryDate } from './utils';
import type { Documentary, Payment, PaymentMethod, User, PlanType } from './types';
import { PLANS } from './types';

// ==================== DOCUMENTARY OPERATIONS ====================

export async function getAllDocumentaries(): Promise<Documentary[]> {
  const db = getDb();
  // Older records may predate the `status` field. Treat those as published so
  // existing catalog content remains visible; only explicitly hidden records
  // are excluded from the public library.
  const snapshot = await db.collection(collections.documentaries).get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Documentary)
    .filter((documentary) => documentary.status !== 'draft' && documentary.status !== 'archived')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function getFeaturedDocumentaries(): Promise<Documentary[]> {
  const db = getDb();
  const snapshot = await db.collection(collections.documentaries).get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Documentary)
    .filter((documentary) => documentary.featured && documentary.status !== 'draft' && documentary.status !== 'archived')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 10);
}

export async function getRecentDocumentaries(limit: number = 10): Promise<Documentary[]> {
  return (await getAllDocumentaries()).slice(0, limit);
}

export async function getDocumentaryById(id: string): Promise<Documentary | null> {
  const db = getDb();
  const doc = await db.collection(collections.documentaries).doc(id).get();
  
  if (!doc.exists) return null;
  
  return { id: doc.id, ...doc.data() } as Documentary;
}

export async function createDocumentary(data: {
  title: string;
  summary: string;
  category: string;
  rating?: number;
  releaseDate?: string;
  videoUrl: string;
  videoR2Key?: string;
  videoDuration?: number;
  thumbnailUrl?: string;
  featured?: boolean;
  streamUid?: string | null;
  streamStatus?: 'ready' | 'processing' | 'error' | null;
  encodingStatus?: 'pending' | 'processing' | 'ready' | 'error' | null;
  hlsPlaylistKey?: string | null;
}): Promise<string> {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  const documentary: Omit<Documentary, 'id'> = {
    title: data.title,
    summary: data.summary,
    category: data.category,
    rating: data.rating || null,
    releaseDate: data.releaseDate || null,
    status: 'published',
    thumbnailUrl: data.thumbnailUrl || null,
    videoUrl: data.videoUrl,
    videoR2Key: data.videoR2Key || null,
    streamUid: data.streamUid ?? null,
    streamStatus: data.streamStatus ?? null,
    encodingStatus: data.encodingStatus ?? null,
    hlsPlaylistKey: data.hlsPlaylistKey ?? null,
    cloudinaryPublicId: null,
    cloudinarySecureUrl: null,
    videoDuration: data.videoDuration || null,
    trailerUrl: null,
    trailerPublicId: null,
    createdAt: now,
    updatedAt: now,
    featured: data.featured || false,
    metadata: {},
  };

  await db.collection(collections.documentaries).doc(id).set(documentary);
  return id;
}

export async function updateDocumentaryStreamStatus(
  streamUid: string,
  status: 'ready' | 'processing' | 'error',
  extra?: { videoDuration?: number }
): Promise<void> {
  const db = getDb();
  const snapshot = await db
    .collection(collections.documentaries)
    .where('streamUid', '==', streamUid)
    .limit(1)
    .get();

  if (snapshot.empty) return;

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    streamStatus: status,
    updatedAt: now,
  };
  if (extra?.videoDuration != null) {
    update.videoDuration = extra.videoDuration;
  }

  await snapshot.docs[0].ref.update(update);
}

export async function updateDocumentary(
  id: string,
  data: Partial<Documentary>
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  
  await db.collection(collections.documentaries).doc(id).update({
    ...data,
    updatedAt: now,
  });
}

export async function deleteDocumentary(id: string): Promise<void> {
  const db = getDb();
  await db.collection(collections.documentaries).doc(id).delete();
}

export async function addTrailerToDocumentary(
  documentaryId: string,
  trailerUrl: string,
  trailerR2Key?: string
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  
  await db.collection(collections.documentaries).doc(documentaryId).update({
    trailerPublicId: null,
    trailerUrl,
    trailerR2Key: trailerR2Key || null,
    updatedAt: now,
  });
}

// ==================== PAYMENT OPERATIONS ====================

export async function createPayment(data: {
  /** Pass the iTechPay `req_ref` so the payment can be found by it. */
  id?: string;
  userId: string;
  phone: string;
  plan: PlanType;
  amount: number;
  documentaryId?: string;
  method?: PaymentMethod;
}): Promise<string> {
  const db = getDb();
  const id = data.id || generateId();
  const now = new Date().toISOString();
  
  const payment: Omit<Payment, 'id'> = {
    userId: data.userId,
    phone: data.phone,
    plan: data.plan,
    amount: data.amount,
    currency: 'RWF',
    documentaryId: data.documentaryId || null,
    status: 'pending',
    method: data.method || 'manual',
    gatewayTransactionId: null,
    gatewayStatus: null,
    needsReview: null,
    receivedAmount: null,
    proofUrl: null,
    createdAt: now,
    confirmedAt: null,
    confirmedBy: null,
    startDate: null,
    expiresAt: null,
  };
  
  // create() rather than set(): a reused id must never overwrite a payment.
  await db.collection(collections.payments).doc(id).create(payment);
  
  // Update user with payment reference
  await db.collection(collections.users).doc(data.userId).update({
    paymentId: id,
    paymentStatus: 'pending',
    amount: data.amount,
    updatedAt: now,
  });
  
  return id;
}

/** Stores what iTechPay last told us about a payment, without changing its status. */
export async function updatePaymentGatewayInfo(
  paymentId: string,
  info: { gatewayTransactionId?: string | null; gatewayStatus?: string | null; needsReview?: string | null; receivedAmount?: number | null }
): Promise<void> {
  const db = getDb();
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const [key, value] of Object.entries(info)) {
    if (value !== undefined) update[key] = value;
  }
  await db.collection(collections.payments).doc(paymentId).update(update);
}

/** Marks a pending payment as failed. Does nothing if it is no longer pending. */
export async function markPaymentFailed(paymentId: string, gatewayStatus?: string | null): Promise<void> {
  const db = getDb();
  const paymentRef = db.collection(collections.payments).doc(paymentId);
  await db.runTransaction(async (tx) => {
    const paymentDoc = await tx.get(paymentRef);
    if (!paymentDoc.exists) return;
    const payment = paymentDoc.data() as Payment;
    if (payment.status !== 'pending') return;
    const userRef = db.collection(collections.users).doc(payment.userId);
    const userDoc = await tx.get(userRef);
    const now = new Date().toISOString();
    tx.update(paymentRef, { status: 'failed', gatewayStatus: gatewayStatus ?? payment.gatewayStatus ?? null, updatedAt: now });
    if (userDoc.exists && (userDoc.data() as User).paymentId === paymentId) {
      tx.update(userRef, { paymentStatus: 'failed', updatedAt: now });
    }
  });
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  const db = getDb();
  const doc = await db.collection(collections.payments).doc(id).get();
  
  if (!doc.exists) return null;
  
  return { id: doc.id, ...doc.data() } as Payment;
}

export async function getPendingPayments(): Promise<Payment[]> {
  const db = getDb();
  const snapshot = await db
    .collection(collections.payments)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Payment);
}

export async function getAllPayments(): Promise<Payment[]> {
  const db = getDb();
  const snapshot = await db
    .collection(collections.payments)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Payment);
}

export async function getUserPayments(userId: string): Promise<Payment[]> {
  const db = getDb();
  const snapshot = await db
    .collection(collections.payments)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Payment);
}

export async function updatePaymentProof(
  paymentId: string,
  proofUrl: string
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  
  await db.collection(collections.payments).doc(paymentId).update({
    proofUrl,
    updatedAt: now,
  });
}

/**
 * Grants the access a payment paid for. Idempotent and transactional: the
 * webhook, status polling, the account-page sweep, the cron job and admins can
 * all call it for the same payment and access is granted exactly once.
 *
 * Renewals stack: a subscription bought while another is still running starts
 * when the current one ends instead of discarding the remaining days.
 */
export async function activatePayment(
  paymentId: string,
  confirmedBy: string,
  gateway?: { transactionId?: string | null; status?: string | null }
): Promise<{ success: boolean; error?: string; alreadyConfirmed?: boolean }> {
  const db = getDb();
  const paymentRef = db.collection(collections.payments).doc(paymentId);

  return db.runTransaction(async (tx) => {
    const paymentDoc = await tx.get(paymentRef);
    if (!paymentDoc.exists) {
      return { success: false, error: 'Payment not found' };
    }

    const payment = paymentDoc.data() as Payment;
    if (payment.status === 'confirmed') {
      return { success: true, alreadyConfirmed: true };
    }
    // `failed` payments can still be activated: the gateway may confirm a
    // payment after we stopped waiting for it, and the customer was charged.
    if (payment.status === 'rejected') {
      return { success: false, error: 'This payment was rejected' };
    }

    const plan = PLANS.find((p) => p.id === payment.plan);
    if (!plan) {
      return { success: false, error: 'Invalid plan' };
    }

    const userRef = db.collection(collections.users).doc(payment.userId);
    const userDoc = await tx.get(userRef);
    const user = userDoc.exists ? (userDoc.data() as User) : null;

    const now = new Date();
    const nowISO = now.toISOString();
    const isSubscription = payment.plan !== 'single';
    const currentExpiry = user?.expiresAt ? new Date(user.expiresAt) : null;
    const renewing =
      isSubscription &&
      user?.subscriptionStatus === 'active' &&
      user.selectedPlan !== 'single' &&
      !!currentExpiry &&
      currentExpiry > now;
    const startDate = renewing ? currentExpiry! : now;
    const expiryDate = calculateExpiryDate(startDate, plan.duration);

    const paymentUpdate: Record<string, unknown> = {
      status: 'confirmed',
      confirmedAt: nowISO,
      confirmedBy,
      startDate: startDate.toISOString(),
      expiresAt: expiryDate.toISOString(),
      updatedAt: nowISO,
    };
    if (gateway?.transactionId) paymentUpdate.gatewayTransactionId = gateway.transactionId;
    if (gateway?.status) paymentUpdate.gatewayStatus = gateway.status;
    tx.update(paymentRef, paymentUpdate);

    if (!user) return { success: true };

    const userUpdate: Record<string, unknown> = { updatedAt: nowISO };
    // Don't hide a newer pending payment behind an older one's confirmation.
    if (!user.paymentId || user.paymentId === paymentId) userUpdate.paymentStatus = 'confirmed';

    if (!isSubscription) {
      // A single-documentary purchase is a scoped entitlement, not a
      // subscription. Keep an existing full subscription intact.
      const documentaryIds = user.documentaryIds || [];
      if (payment.documentaryId && !documentaryIds.includes(payment.documentaryId)) {
        userUpdate.documentaryIds = [...documentaryIds, payment.documentaryId];
      }
    } else {
      userUpdate.subscriptionStatus = 'active';
      userUpdate.selectedPlan = payment.plan;
      if (!renewing) userUpdate.startDate = nowISO;
      userUpdate.endDate = expiryDate.toISOString();
      userUpdate.expiresAt = expiryDate.toISOString();
    }

    tx.update(userRef, userUpdate);
    return { success: true };
  });
}

/** Admin confirmation of a manual (USSD + screenshot) payment. */
export async function confirmPayment(
  paymentId: string,
  adminId: string
): Promise<{ success: boolean; error?: string; alreadyConfirmed?: boolean }> {
  return activatePayment(paymentId, adminId);
}

export async function rejectPayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  const now = new Date().toISOString();
  const paymentDoc = await db.collection(collections.payments).doc(paymentId).get();
  if (!paymentDoc.exists) return { success: false, error: 'Payment not found' };
  const payment = paymentDoc.data() as Payment;
  if (payment.status !== 'pending') return { success: false, error: 'This payment has already been processed' };
  
  await db.collection(collections.payments).doc(paymentId).update({
    status: 'rejected',
    updatedAt: now,
  });
  
  // Get payment to update user
  await db.collection(collections.users).doc(payment.userId).update({
    paymentStatus: 'rejected',
    updatedAt: now,
  });
  return { success: true };
}

export async function setDocumentaryThumbnail(documentaryId: string, thumbnailUrl: string, thumbnailR2Key: string): Promise<void> {
  const db = getDb();
  await db.collection(collections.documentaries).doc(documentaryId).update({ thumbnailUrl, thumbnailR2Key, updatedAt: new Date().toISOString() });
}

// ==================== USER OPERATIONS ====================

export async function getUserById(id: string): Promise<User | null> {
  const db = getDb();
  const doc = await db.collection(collections.users).doc(id).get();
  
  if (!doc.exists) return null;
  
  return { id: doc.id, ...doc.data() } as User;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const db = getDb();
  const { normalizePhone } = await import('./utils');
  const normalizedPhone = normalizePhone(phone);
  
  const snapshot = await db
    .collection(collections.users)
    .where('normalizedPhone', '==', normalizedPhone)
    .get();
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as User;
}

export async function updateUser(
  id: string,
  data: Partial<User>
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  
  await db.collection(collections.users).doc(id).update({
    ...data,
    updatedAt: now,
  });
}

// ==================== ADMIN OPERATIONS ====================

export async function getAllUsers(): Promise<User[]> {
  const db = getDb();
  const snapshot = await db
    .collection(collections.users)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User);
}

export async function getActiveUsersCount(): Promise<number> {
  const db = getDb();
  const snapshot = await db
    .collection(collections.users)
    .where('subscriptionStatus', '==', 'active')
    .count()
    .get();
  
  return snapshot.data().count;
}

export async function getPendingPaymentsCount(): Promise<number> {
  const db = getDb();
  const snapshot = await db
    .collection(collections.payments)
    .where('status', '==', 'pending')
    .count()
    .get();

  return snapshot.data().count;
}

export async function getApprovedPaymentsBalance(): Promise<number> {
  const db = getDb();
  const snapshot = await db
    .collection(collections.payments)
    .where('status', '==', 'confirmed')
    .get();

  return snapshot.docs.reduce((total, doc) => {
    const payment = doc.data() as Payment;
    const amount = payment.receivedAmount ?? payment.amount ?? 0;
    return total + amount;
  }, 0);
}
