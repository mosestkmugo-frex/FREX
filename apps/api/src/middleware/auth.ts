import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@frex/shared';
import { prisma } from '@frex/database';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email?: string;
  phone?: string;
}

export interface AuthRequest extends Request {
  user?: { id: string; role: UserRole; email: string | null; phone: string | null };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized', code: 'MISSING_TOKEN' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true, phone: true, verificationStatus: true },
    });
    if (!user) {
      res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      return;
    }
    req.user = { id: user.id, role: user.role, email: user.email, phone: user.phone };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden', requiredRole: roles });
      return;
    }
    next();
  };
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
