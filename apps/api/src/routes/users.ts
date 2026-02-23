import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { prisma } from '@frex/database';

const router = Router();

router.use(requireAuth);

router.get('/profile', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      shipperProfile: true,
      driverProfile: { include: { vehicle: true } },
      logisticsProfile: true,
      storageProfile: true,
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash, ...safe } = user;
  return res.json(safe);
});

export { router as usersRouter };
