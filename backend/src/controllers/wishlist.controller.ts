import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// ─── Add to Wishlist ──────────────────────────────────────────────────────────
export const addToWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { courseId } = req.body;
  const userId = req.user!.id;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw createError('Course not found.', 404, 'COURSE_NOT_FOUND');

  const existing = await prisma.wishlist.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (existing) throw createError('Course is already in your wishlist.', 409, 'ALREADY_IN_WISHLIST');

  const wishlistItem = await prisma.wishlist.create({
    data: { userId, courseId },
    include: { course: { select: { id: true, title_ar: true, title_en: true, image: true, price: true } } },
  });

  res.status(201).json({ success: true, message: 'Added to wishlist.', data: { wishlistItem } });
});

// ─── Remove from Wishlist ─────────────────────────────────────────────────────
export const removeFromWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user!.id;

  const existing = await prisma.wishlist.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (!existing) throw createError('Course is not in your wishlist.', 404, 'NOT_IN_WISHLIST');

  await prisma.wishlist.delete({ where: { userId_courseId: { userId, courseId } } });

  res.json({ success: true, message: 'Removed from wishlist.' });
});

// ─── Get My Wishlist ──────────────────────────────────────────────────────────
export const getMyWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const wishlists = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true, title_ar: true, title_en: true,
          description_ar: true, description_en: true,
          price: true, duration: true, image: true, status: true,
          _count: { select: { enrollments: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: { wishlists } });
});

// ─── Toggle Wishlist ──────────────────────────────────────────────────────────
export const toggleWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { courseId } = req.body;
  const userId = req.user!.id;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw createError('Course not found.', 404, 'COURSE_NOT_FOUND');

  const existing = await prisma.wishlist.findUnique({ where: { userId_courseId: { userId, courseId } } });

  if (existing) {
    await prisma.wishlist.delete({ where: { userId_courseId: { userId, courseId } } });
    res.json({ success: true, message: 'Removed from wishlist.', data: { inWishlist: false } });
  } else {
    await prisma.wishlist.create({ data: { userId, courseId } });
    res.json({ success: true, message: 'Added to wishlist.', data: { inWishlist: true } });
  }
});
