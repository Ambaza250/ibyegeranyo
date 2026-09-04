import { getDb, collections } from './firebase';
import { generateId, calculateExpiryDate } from './utils';
import type { Documentary, Payment, User, PlanType } from './types';
import { PLANS } from './types';
import { getVideoThumbnail } from './cloudinary';

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
  cloudinaryPublicId: string;
  cloudinarySecureUrl: string;
  videoDuration?: number;
  thumbnailUrl?: string;
  featured?: boolean;
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
    thumbnailUrl: data.thumbnailUrl || getVideoThumbnail(data.cloudinaryPublicId),
    videoUrl: data.cloudinarySecureUrl,
    cloudinaryPublicId: data.cloudinaryPublicId,
    cloudinarySecureUrl: data.cloudinarySecureUrl,
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
  trailerPublicId: string,
  trailerUrl: string
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  
  await db.collection(collections.documentaries).doc(documentaryId).update({
    trailerPublicId,
    trailerUrl,
    updatedAt: now,
  });
}

// ==================== PAYMENT OPERATIONS ====================

export async function createPayment(data: {
  userId: string;
  phone: string;
  plan: PlanType;
  amount: number;
  documentaryId?: string;
}): Promise<string> {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();
  
  const payment: Omit<Payment, 'id'> = {
    userId: data.userId,
    phone: data.phone,
    plan: data.plan,
    amount: data.amount,
    documentaryId: data.documentaryId || null,
    status: 'pending',
    proofUrl: null,
    createdAt: now,
    confirmedAt: null,
    confirmedBy: null,
    startDate: null,
    expiresAt: null,
  };
  
  await db.collection(collections.payments).doc(id).set(payment);
  
  // Update user with payment reference
  await db.collection(collections.users).doc(data.userId).update({
    paymentId: id,
    paymentStatus: 'pending',
    amount: data.amount,
    updatedAt: now,
  });
  
  return id;
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

export async function confirmPayment(
  paymentId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  
  // Get payment
  const paymentDoc = await db.collection(collections.payments).doc(paymentId).get();
  
  if (!paymentDoc.exists) {
    return { success: false, error: 'Payment not found' };
  }
  
  const payment = paymentDoc.data() as Payment;
  if (payment.status !== 'pending') return { success: false, error: 'This payment has already been processed' };
  if (!payment.proofUrl) return { success: false, error: 'A payment proof is required before confirmation' };
  
  // Get plan details
  const plan = PLANS.find((p) => p.id === payment.plan);
  if (!plan) {
    return { success: false, error: 'Invalid plan' };
  }
  
  const now = new Date();
  const nowISO = now.toISOString();
  const expiryDate = calculateExpiryDate(now, plan.duration);
  
  // Update payment
  await db.collection(collections.payments).doc(paymentId).update({
    status: 'confirmed',
    confirmedAt: nowISO,
    confirmedBy: adminId,
    startDate: nowISO,
    expiresAt: expiryDate.toISOString(),
  });
  
  // A single-documentary purchase is a scoped entitlement, not a subscription.
  // Keep an existing full subscription intact when confirming one.
  const userUpdate: Record<string, unknown> = {
    paymentStatus: 'confirmed',
    updatedAt: nowISO,
  };
  
  // For single documentary plan, add documentary to user's access list
  if (payment.plan === 'single' && payment.documentaryId) {
    const userDoc = await db.collection(collections.users).doc(payment.userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data() as User;
      const documentaryIds = userData.documentaryIds || [];
      if (!documentaryIds.includes(payment.documentaryId)) {
        documentaryIds.push(payment.documentaryId);
        userUpdate.documentaryIds = documentaryIds;
      }
    }
  } else {
    userUpdate.subscriptionStatus = 'active';
    userUpdate.selectedPlan = payment.plan;
    userUpdate.startDate = nowISO;
    userUpdate.endDate = expiryDate.toISOString();
    userUpdate.expiresAt = expiryDate.toISOString();
  }
  
  await db.collection(collections.users).doc(payment.userId).update(userUpdate);
  
  return { success: true };
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
