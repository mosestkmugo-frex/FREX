import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@frex/database';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

const rateSchema = z.object({
  bookingId: z.string(),
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
  criteria: z.record(z.number()).optional(),
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parsed = rateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { bookingId, score, comment, criteria } = parsed.data;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { shipper: true, driver: true },
  });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status !== 'completed') return res.status(400).json({ error: 'Can only rate completed bookings' });
  const raterId = req.user!.id;
  const ratedId = booking.shipperId === raterId ? booking.driverId! : booking.shipperId;
  if (!ratedId) return res.status(400).json({ error: 'No other party to rate' });
  const existing = await prisma.rating.findFirst({
    where: { bookingId, raterId },
  });
  if (existing) return res.status(409).json({ error: 'Already rated this booking' });
  const rating = await prisma.rating.create({
    data: { bookingId, raterId, ratedId, score, comment, criteria: criteria ?? undefined },
  });
  const ratings = await prisma.rating.findMany({ where: { ratedId } });
  const avg = ratings.reduce((s, r) => s + r.score, 0) / ratings.length;
  if (booking.driverId === ratedId) {
    await prisma.driverProfile.updateMany({ where: { userId: ratedId }, data: { rating: avg } });
  }
  return res.status(201).json(rating);
});

router.get('/booking/:bookingId', requireAuth, async (req: AuthRequest, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.shipperId !== req.user!.id && booking.driverId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const ratings = await prisma.rating.findMany({
    where: { bookingId: req.params.bookingId },
    include: { rater: true, rated: true },
  });
  return res.json(ratings);
});

export { router as ratingsRouter };
