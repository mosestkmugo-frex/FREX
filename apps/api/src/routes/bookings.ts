import { Router } from 'express';
import { z } from 'zod';
import { prisma, generateBookingReference } from '@frex/database';
import { calculatePrice } from '@frex/shared';
import type { LoadClass, VehicleType } from '@frex/shared';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.js';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

const addressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('ZA'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const itemSchema = z.object({
  type: z.string(),
  weightKg: z.number(),
  lengthCm: z.number(),
  widthCm: z.number(),
  heightCm: z.number(),
  declaredValueZar: z.number(),
  description: z.string().optional(),
  photos: z.array(z.string()).optional(),
  specialRequirements: z.array(z.string()).optional(),
});

const createBookingSchema = z.object({
  pickup: addressSchema,
  dropoff: addressSchema,
  items: z.array(itemSchema).min(1),
  specialRequirements: z.array(z.string()).optional(),
  declaredValueZar: z.number(),
  preferredVehicleType: z.string().optional(),
  routeType: z.enum(['urban', 'intercity', 'rural']).default('urban'),
  scheduledAt: z.string().datetime().optional(),
});

router.post('/', requireAuth, requireRole('shipper'), async (req: AuthRequest, res) => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { pickup, dropoff, items, declaredValueZar, routeType, preferredVehicleType, scheduledAt } = parsed.data;

  const distanceKm = 25; // TODO: integrate maps API for real distance
  const loadClass: LoadClass = 'micro'; // TODO: derive from items
  const pricing = calculatePrice({
    distanceKm,
    routeType,
    loadClass,
    declaredValueZar,
  });
  const platformFeeZar = Math.round(pricing.totalZar * 0.15 * 100) / 100;
  const driverEarningsZar = Math.round((pricing.totalZar - platformFeeZar) * 100) / 100;

  const [pickupAddr, dropoffAddr] = await Promise.all([
    prisma.address.create({ data: pickup }),
    prisma.address.create({ data: dropoff }),
  ]);

  const booking = await prisma.booking.create({
    data: {
      reference: generateBookingReference(),
      shipperId: req.user!.id,
      status: 'booked',
      loadClass,
      vehicleType: (preferredVehicleType as VehicleType) ?? undefined,
      totalAmountZar: new Decimal(pricing.totalZar),
      platformFeeZar: new Decimal(platformFeeZar),
      driverEarningsZar: new Decimal(driverEarningsZar),
      declaredValueZar: new Decimal(declaredValueZar),
      distanceKm,
      routeType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      pickupAddressId: pickupAddr.id,
      dropoffAddressId: dropoffAddr.id,
      items: {
        create: items.map((i) => ({
          type: i.type,
          weightKg: i.weightKg,
          lengthCm: i.lengthCm,
          widthCm: i.widthCm,
          heightCm: i.heightCm,
          declaredValueZar: new Decimal(i.declaredValueZar),
          description: i.description,
          photos: i.photos ?? [],
        })),
      },
    },
    include: {
      pickupAddress: true,
      dropoffAddress: true,
      items: true,
    },
  });
  return res.status(201).json({ ...booking, priceBreakdown: pricing });
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const role = req.user!.role;
  const where =
    role === 'shipper'
      ? { shipperId: req.user!.id }
      : role === 'driver'
        ? { driverId: req.user!.id }
        : {};
  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { pickupAddress: true, dropoffAddress: true, items: true, shipper: true, driver: true },
  });
  return res.json(bookings);
});

router.get('/available', requireAuth, requireRole('driver'), async (req: AuthRequest, res) => {
  const bookings = await prisma.booking.findMany({
    where: { status: 'booked', driverId: null },
    orderBy: { createdAt: 'desc' },
    include: { pickupAddress: true, dropoffAddress: true, items: true },
  });
  return res.json(bookings);
});

router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { pickupAddress: true, dropoffAddress: true, items: true, shipper: true, driver: true },
  });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const isShipper = booking.shipperId === req.user!.id;
  const isDriver = booking.driverId === req.user!.id;
  if (!isShipper && !isDriver) return res.status(403).json({ error: 'Forbidden' });
  return res.json(booking);
});

router.patch('/:id/accept', requireAuth, requireRole('driver'), async (req: AuthRequest, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.driverId) return res.status(409).json({ error: 'Already assigned' });
  await prisma.booking.update({
    where: { id: req.params.id },
    data: { driverId: req.user!.id, status: 'driver_en_route' },
  });
  const updated = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { pickupAddress: true, dropoffAddress: true, items: true, shipper: true, driver: true },
  });
  return res.json(updated);
});

router.patch('/:id/status', requireAuth, async (req: AuthRequest, res) => {
  const { status } = req.body as { status: string };
  const allowed = ['driver_en_route', 'pickup', 'in_transit', 'delivery', 'completed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const isDriver = booking.driverId === req.user!.id;
  const isShipper = booking.shipperId === req.user!.id;
  if (!isDriver && !isShipper) return res.status(403).json({ error: 'Forbidden' });
  const updates: { status: typeof booking.status; pickupAt?: Date; deliveredAt?: Date } = { status: status as typeof booking.status };
  if (status === 'pickup') updates.pickupAt = new Date();
  if (status === 'completed') updates.deliveredAt = new Date();
  await prisma.booking.update({ where: { id: req.params.id }, data: updates });
  const io = req.app.get('io');
  if (io) io.to(`booking:${booking.id}`).emit('status', { bookingId: booking.id, status });
  const updated = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { pickupAddress: true, dropoffAddress: true, items: true, shipper: true, driver: true },
  });
  return res.json(updated);
});

export { router as bookingsRouter };
