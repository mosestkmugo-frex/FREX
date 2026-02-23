import { PrismaClient } from '@prisma/client';
import type { UserRole, VerificationStatus, BookingStatus } from '@frex/shared';

export { PrismaClient };
export type { User, Booking, Payment, Rating, TrackingEvent, Address } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/** Generate booking reference e.g. FRX-1A2B3C */
export function generateBookingReference(): string {
  const chars = '0123456789ABCDEF';
  let s = 'FRX-';
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}
