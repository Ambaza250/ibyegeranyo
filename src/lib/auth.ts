import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getDb, collections } from './firebase';
import { normalizePhone, generateId } from './utils';
import type { User, Session, AdminSession, AdminUser, Payment } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'ibyegeranyo-development-secret')
);

const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'ibyegeranyo-development-admin-secret')
);

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create user session token
export async function createSessionToken(session: Session): Promise<string> {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is not configured');
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// Verify session token
export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

// Create admin session token
export async function createAdminSessionToken(session: AdminSession): Promise<string> {
  if (!process.env.ADMIN_JWT_SECRET && process.env.NODE_ENV === 'production') throw new Error('ADMIN_JWT_SECRET is not configured');
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(ADMIN_JWT_SECRET);
}

// Verify admin session token
export async function verifyAdminSessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

// Set session cookie
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// Set admin session cookie
export async function setAdminSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

// Clear session cookie
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

// Clear admin session cookie
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

// Get current user from session
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  
  if (!sessionCookie) return null;
  
  const session = await verifySessionToken(sessionCookie.value);
  if (!session) return null;
  
  const db = getDb();
  const userDoc = await db.collection(collections.users).doc(session.userId).get();
  
  if (!userDoc.exists) return null;
  
  return { id: userDoc.id, ...userDoc.data() } as User;
}

// Get current admin from session
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session');
  
  if (!sessionCookie) return null;
  
  const session = await verifyAdminSessionToken(sessionCookie.value);
  if (!session) return null;
  
  const db = getDb();
  const adminDoc = await db.collection(collections.admins).doc(session.adminId).get();
  
  if (!adminDoc.exists) return null;
  
  return { id: adminDoc.id, ...adminDoc.data() } as AdminUser;
}

// Register new user
export async function registerUser(
  fullName: string,
  phone: string,
  password: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  const db = getDb();
  const normalizedPhone = normalizePhone(phone);
  
  // Check if user already exists
  const existingUser = await db
    .collection(collections.users)
    .where('normalizedPhone', '==', normalizedPhone)
    .get();
  
  if (!existingUser.empty) {
    return { success: false, error: 'Phone number already registered' };
  }
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  // Create user
  const userId = generateId();
  const now = new Date().toISOString();
  
  const userData: Omit<User, 'id'> = {
    phone,
    normalizedPhone,
    fullName,
    passwordHash,
    createdAt: now,
    subscriptionStatus: 'free',
    selectedPlan: null,
    amount: null,
    paymentId: null,
    paymentStatus: 'none',
    paymentProofUrl: null,
    startDate: null,
    endDate: null,
    expiresAt: null,
    documentaryIds: [],
    updatedAt: now,
  };
  
  await db.collection(collections.users).doc(userId).set(userData);
  
  return { success: true, userId };
}

// Authenticate user
export async function authenticateUser(
  phone: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const db = getDb();
  const normalizedPhone = normalizePhone(phone);
  
  // Find user by phone
  const userSnapshot = await db
    .collection(collections.users)
    .where('normalizedPhone', '==', normalizedPhone)
    .get();
  
  if (userSnapshot.empty) {
    return { success: false, error: 'Incorrect phone number or password' };
  }
  
  const userDoc = userSnapshot.docs[0];
  const user = { id: userDoc.id, ...userDoc.data() } as User;
  
  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  
  if (!isValid) {
    return { success: false, error: 'Incorrect phone number or password' };
  }
  
  return { success: true, user };
}

// Authenticate admin
export async function authenticateAdmin(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; admin?: AdminUser }> {
  const db = getDb();
  
  // Find admin by username
  const adminSnapshot = await db
    .collection(collections.admins)
    .where('username', '==', username)
    .get();
  
  if (adminSnapshot.empty) {
    return { success: false, error: 'Invalid username or password' };
  }
  
  const adminDoc = adminSnapshot.docs[0];
  const admin = { id: adminDoc.id, ...adminDoc.data() } as AdminUser;
  
  // Verify password
  const isValid = await verifyPassword(password, admin.passwordHash);
  
  if (!isValid) {
    return { success: false, error: 'Invalid username or password' };
  }
  
  return { success: true, admin };
}

// Check if user has access to a documentary
export async function checkDocumentaryAccess(
  userId: string | undefined,
  documentaryId: string
): Promise<{ hasAccess: boolean; reason: string }> {
  if (!userId) {
    return { hasAccess: false, reason: 'not_authenticated' };
  }
  
  const db = getDb();
  const userDoc = await db.collection(collections.users).doc(userId).get();
  
  if (!userDoc.exists) {
    return { hasAccess: false, reason: 'user_not_found' };
  }
  
  const user = userDoc.data() as User;
  
  // A full subscription is evaluated from server-maintained dates only.
  if (user.subscriptionStatus === 'active' && user.selectedPlan !== 'single' && user.expiresAt && new Date(user.expiresAt) >= new Date()) {
    return { hasAccess: true, reason: 'access_granted' };
  }

  // Individual purchases are independent entitlements. Do not infer access from
  // the latest selected plan: a later purchase must not revoke a valid one.
  const entitlement = await db.collection(collections.payments)
    .where('userId', '==', userId)
    .where('documentaryId', '==', documentaryId)
    .where('plan', '==', 'single')
    .where('status', '==', 'confirmed')
    .get();
  const hasSingleAccess = entitlement.docs.some((doc) => {
    const payment = doc.data() as Payment;
    return !!payment.expiresAt && new Date(payment.expiresAt) >= new Date();
  });
  if (hasSingleAccess) return { hasAccess: true, reason: 'single_documentary_access' };
  return { hasAccess: false, reason: user.expiresAt && new Date(user.expiresAt) < new Date() ? 'subscription_expired' : 'no_active_subscription' };
}
