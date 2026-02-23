import { Router } from 'express';
import { prisma } from '@frex/database';
import type { BookingStatus } from '@frex/shared';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/:bookingId', async (req: AuthRequest, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.bookingId },
    include: { driver: true, pickupAddress: true, dropoffAddress: true },
  });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const isShipper = booking.shipperId === req.user!.id;
  const isDriver = booking.driverId === req.user!.id;
  if (!isShipper && !isDriver) return res.status(403).json({ error: 'Forbidden' });
  const events = await prisma.trackingEvent.findMany({
    where: { bookingId: req.params.bookingId },
    orderBy: { createdAt: 'asc' },
  });
  return res.json({ booking, events });
});

router.post('/:bookingId/event', async (req: AuthRequest, res) => {
  const { status, latitude, longitude, note } = req.body as {
    status?: BookingStatus;
    latitude?: number;
    longitude?: number;
    note?: string;
  };
  const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.driverId !== req.user!.id) return res.status(403).json({ error: 'Only driver can emit tracking' });
  const event = await prisma.trackingEvent.create({
    data: {
      bookingId: req.params.bookingId,
      status: status ?? booking.status,
      latitude,
      longitude,
      note,
    },
  });
  const io = req.app.get('io');
  if (io) {
    io.to(`booking:${booking.id}`).emit('tracking', {
      bookingId: booking.id,
      latitude,
      longitude,
      status: event.status,
      at: event.createdAt,
    });
  }
  return res.status(201).json(event);
});

export { router as trackingRouter };
