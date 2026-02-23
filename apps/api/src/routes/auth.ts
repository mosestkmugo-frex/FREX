import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@frex/database';
import type { UserRole } from '@frex/shared';
import { requireAuth, signToken, type AuthRequest } from '../middleware/auth.js';

const router = Router();

const registerBody = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(8).regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])/),
  role: z.enum(['shipper', 'driver', 'logistics_company', 'storage_provider']),
  fullName: z.string().min(1).optional(),
});
const loginBody = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
});

router.post('/register', async (req, res) => {
  const parsed = registerBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { email, phone, password, role, fullName } = parsed.data;
  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone required' });
  }
  const existing = await prisma.user.findFirst({
    where: email ? { email } : { phone },
  });
  if (existing) {
    return res.status(409).json({ error: 'User already exists with this email or phone' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email ?? null,
      phone: phone ?? null,
      passwordHash,
      role: role as UserRole,
    },
  });
  if (role === 'driver' && fullName) {
    await prisma.driverProfile.create({
      data: { userId: user.id, fullName },
    });
  }
  const token = signToken({ userId: user.id, role: user.role as UserRole, email: user.email ?? undefined, phone: user.phone ?? undefined });
  return res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      verificationStatus: user.verificationStatus,
      trustScore: user.trustScore,
    },
  });
});

router.post('/login', async (req, res) => {
  const parsed = loginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { email, phone, password } = parsed.data;
  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone required' });
  }
  const user = await prisma.user.findFirst({
    where: email ? { email } : { phone },
  });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = signToken({ userId: user.id, role: user.role as UserRole, email: user.email ?? undefined, phone: user.phone ?? undefined });
  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      verificationStatus: user.verificationStatus,
      trustScore: user.trustScore,
    },
  });
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      verificationStatus: true,
      trustScore: true,
      avatarUrl: true,
      createdAt: true,
      shipperProfile: true,
      driverProfile: true,
      logisticsProfile: true,
      storageProfile: true,
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
});

export { router as authRouter };
