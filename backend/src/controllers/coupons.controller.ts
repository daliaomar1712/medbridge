import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// ─── Validate Coupon ──────────────────────────────────────────────────────────
export const validateCoupon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { code, courseId } = req.body;
  const userId = req.user!.id;

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) throw createError('Invalid or inactive coupon code.', 400, 'INVALID_COUPON');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw createError('This coupon has expired.', 400, 'COUPON_EXPIRED');
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw createError('This coupon has reached its usage limit.', 400, 'COUPON_EXHAUSTED');

  let coursePrice = 0;
  if (courseId) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (course) coursePrice = Number(course.price);
  }

  let discountAmount = 0;
  let finalPrice = coursePrice;

  if (coupon.type === 'PERCENTAGE') {
    discountAmount = (coursePrice * Number(coupon.discount)) / 100;
    finalPrice = coursePrice - discountAmount;
  } else {
    discountAmount = Math.min(Number(coupon.discount), coursePrice);
    finalPrice = Math.max(0, coursePrice - discountAmount);
  }

  res.json({
    success: true,
    message: 'Coupon is valid.',
    data: {
      coupon: {
        id: coupon.id, code: coupon.code, discount: coupon.discount, type: coupon.type,
      },
      originalPrice: coursePrice,
      discountAmount: discountAmount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
    },
  });
});

// ─── List Coupons (Admin) ─────────────────────────────────────────────────────
export const listCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { usages: true } } },
  });
  res.json({ success: true, data: { coupons } });
});

// ─── Create Coupon (Admin) ────────────────────────────────────────────────────
export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, discount, type, maxUses, expiresAt, isActive } = req.body;

  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) throw createError('Coupon code already exists.', 409, 'COUPON_EXISTS');

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      discount: parseFloat(discount),
      type,
      maxUses: maxUses ? parseInt(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  res.status(201).json({ success: true, message: 'Coupon created successfully.', data: { coupon } });
});

// ─── Update Coupon (Admin) ────────────────────────────────────────────────────
export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { discount, type, maxUses, expiresAt, isActive } = req.body;

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw createError('Coupon not found.', 404, 'COUPON_NOT_FOUND');

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(discount !== undefined && { discount: parseFloat(discount) }),
      ...(type && { type }),
      ...(maxUses !== undefined && { maxUses: maxUses ? parseInt(maxUses) : null }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res.json({ success: true, message: 'Coupon updated successfully.', data: { coupon } });
});

// ─── Delete Coupon (Admin) ────────────────────────────────────────────────────
export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw createError('Coupon not found.', 404, 'COUPON_NOT_FOUND');

  await prisma.coupon.delete({ where: { id } });
  res.json({ success: true, message: 'Coupon deleted successfully.' });
});
