import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.middleware';

const router = Router();
const prisma = new PrismaClient();

router.get('/profile', asyncHandler(async (_req, res) => {
  const profile = await prisma.academyProfile.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  res.json({ success: true, data: { profile } });
}));

export default router;
