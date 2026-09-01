import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Normalize Rwanda phone numbers to a consistent format
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats:
  // 0781234567 -> 250781234567
  // 250781234567 -> 250781234567
  // +250781234567 -> 250781234567
  
  if (cleaned.startsWith('0')) {
    cleaned = '250' + cleaned.substring(1);
  } else if (!cleaned.startsWith('250')) {
    cleaned = '250' + cleaned;
  }
  
  return cleaned;
}

// Validate Rwanda phone number
export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Rwanda phone numbers: 250 followed by 9 digits (78x, 79x, 72x, 73x)
  return /^250[7][2389]\d{7}$/.test(normalized);
}

// Format phone number for display
export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length === 12) {
    return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`;
  }
  return phone;
}

// Format currency in RWF
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('rw-RW', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(amount) + ' RWF';
}

// Format date
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Calculate expiration date based on plan duration
export function calculateExpiryDate(startDate: Date, durationDays: number): Date {
  const expiry = new Date(startDate);
  expiry.setDate(expiry.getDate() + durationDays);
  return expiry;
}

// Check if subscription is expired
export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

// Check if subscription is expiring soon (within 3 days)
export function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  return expiry > now && expiry <= threeDaysFromNow;
}

// Get subscription status
export function getSubscriptionStatus(expiresAt: string | null): 'active' | 'expiring_soon' | 'expired' {
  if (!expiresAt) return 'expired';
  if (isExpired(expiresAt)) return 'expired';
  if (isExpiringSoon(expiresAt)) return 'expiring_soon';
  return 'active';
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}