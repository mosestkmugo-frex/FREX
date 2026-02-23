import { Router } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@frex/database';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  const payments = await prisma.payment.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { booking: true },
  });
  return res.json(payments);
});

router.post('/hold', async (req: AuthRequest, res) => {
  const { bookingId, amountZar, method } = req.body as { bookingId: string; amountZar: number; method: string };
  if (!bookingId || !amountZar || !method) {
    return res.status(400).json({ error: 'bookingId, amountZar, method required' });
  }
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.shipperId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
  const payment = await prisma.payment.create({
    data: {
      bookingId,
      userId: req.user!.id,
      amountZar: new Decimal(amountZar),
      method: method || 'card',
      status: 'held_escrow',
    },
  });
  return res.status(201).json(payment);
});

router.post('/release', async (req: AuthRequest, res) => {
  const { paymentId } = req.body as { paymentId: string };
  if (!paymentId) return res.status(400).json({ error: 'paymentId required' });
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.booking.driverId !== req.user!.id) return res.status(403).json({ error: 'Only driver can release' });
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'completed', paidAt: new Date(), payoutAt: new Date() },
  });
  return res.json({ ok: true });
});

export { router as paymentsRouter };
