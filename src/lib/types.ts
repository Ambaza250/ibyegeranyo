// Database types for Ibyegeranyo.com

export interface User {
  id: string;
  phone: string;
  normalizedPhone: string;
  fullName: string;
  passwordHash: string;
  createdAt: string;
  subscriptionStatus: 'free' | 'pending' | 'active' | 'expiring_soon' | 'expired';
  selectedPlan: PlanType | null;
  amount: number | null;
  paymentId: string | null;
  paymentStatus: 'none' | 'pending' | 'confirmed' | 'rejected' | 'failed';
  paymentProofUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  expiresAt: string | null;
  documentaryIds: string[];
  updatedAt: string;
}

export interface Documentary {
  id: string;
  title: string;
  summary: string;
  category: string;
  rating: number | null;
  releaseDate: string | null;
  status: 'draft' | 'published' | 'archived';
  thumbnailUrl: string | null;
  thumbnailR2Key?: string | null;
  videoUrl: string | null;
  videoR2Key?: string | null;
  /** Cloudflare Stream video UID (new uploads). Absent on legacy R2-only docs. */
  streamUid?: string | null;
  /** ready | processing | error | null (legacy) */
  streamStatus?: 'ready' | 'processing' | 'error' | null;
  cloudinaryPublicId: string | null;
  cloudinarySecureUrl: string | null;
  videoDuration: number | null;
  trailerUrl: string | null;
  trailerR2Key?: string | null;
  trailerPublicId: string | null;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  metadata: Record<string, unknown>;
  /** R2 key of the HLS master playlist (documentaries/{id}/hls/master.m3u8) */
  hlsPlaylistKey?: string | null;

  /** pending | processing | ready | error */
  encodingStatus?: 'pending' | 'processing' | 'ready' | 'error' | null;
}

/** `manual` = legacy USSD + screenshot flow; the rest go through iTechPay. */
export type PaymentMethod = 'manual' | 'mobile_money' | 'airtel_money' | 'card';

export interface Payment {
  /** For iTechPay payments this is also the `req_ref` sent to the gateway. */
  id: string;
  userId: string;
  phone: string;
  plan: PlanType;
  /** Copied from PLANS on the server, never from the client. */
  amount: number;
  currency?: 'RWF';
  documentaryId: string | null;
  /** `failed` = the gateway reported a failure, or it timed out unconfirmed. */
  status: 'pending' | 'confirmed' | 'rejected' | 'failed';
  /** Missing on payments created before automatic payments existed. */
  method?: PaymentMethod;
  /** iTechPay transaction id, or the Pesapal PCODE for card payments. */
  gatewayTransactionId?: string | null;
  /** Last status iTechPay reported, kept for support and audits. */
  gatewayStatus?: string | null;
  /** Set when iTechPay reports an amount that doesn't match `amount`. */
  needsReview?: string | null;
  /** Actual amount iTechPay confirmed was received (after fees). */
  receivedAmount?: number | null;
  proofUrl: string | null;
  createdAt: string;
  confirmedAt: string | null;
  confirmedBy: string | null;
  startDate: string | null;
  expiresAt: string | null;
}

export type PlanType = 'weekly' | 'monthly' | 'yearly' | 'single';

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  duration: number; // in days
  description: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: 700,
    duration: 7,
    description: '7 days access to all documentaries',
    features: ['Full documentary access', 'Ad-free viewing', 'Watch on any device'],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 2000,
    duration: 30,
    description: '30 days access to all documentaries',
    features: ['Full documentary access', 'Ad-free viewing', 'Watch on any device', 'Best value'],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 22000,
    duration: 365,
    description: '1 year access to all documentaries',
    features: ['Full documentary access', 'Ad-free viewing', 'Watch on any device', 'Best annual value'],
  },
  {
    id: 'single',
    name: 'Single documentary',
    price: 500,
    duration: 7,
    description: 'Access to one documentary for 7 days',
    features: ['One documentary', 'Ad-free viewing'],
  },
];

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  userId: string;
  phone: string;
  fullName: string;
  subscriptionStatus: string;
  expiresAt: string;
}

export interface AdminSession {
  adminId: string;
  username: string;
  expiresAt: string;
}
