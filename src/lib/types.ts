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
  paymentStatus: 'none' | 'pending' | 'confirmed' | 'rejected';
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
  videoUrl: string | null;
  cloudinaryPublicId: string | null;
  cloudinarySecureUrl: string | null;
  videoDuration: number | null;
  trailerUrl: string | null;
  trailerPublicId: string | null;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  metadata: Record<string, unknown>;
}

export interface Payment {
  id: string;
  userId: string;
  phone: string;
  plan: PlanType;
  amount: number;
  documentaryId: string | null;
  status: 'pending' | 'confirmed' | 'rejected';
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
    features: ['Full documentary access', 'Ad-free viewing', 'Watch on any device', 'Best savings'],
  },
  {
    id: 'single',
    name: 'Single Documentary',
    price: 200,
    duration: 30,
    description: 'Access to one documentary for 30 days',
    features: ['One documentary access', 'Ad-free viewing', '30 days access'],
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