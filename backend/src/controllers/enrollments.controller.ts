import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// ─── Enroll in Course ─────────────────────────────────────────────────────────
export const enrollInCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { courseId, couponCode } = req.body;
  const userId = req.user!.id;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw createError('Course not found.', 404, 'COURSE_NOT_FOUND');
  if (course.status !== 'ACTIVE') throw createError('This course is not available for enrollment.', 400, 'COURSE_UNAVAILABLE');
  const now = new Date();
  if (course.endDate && course.endDate < now) throw createError('Enrollment is closed because this course has ended.', 400, 'COURSE_ENDED');

  const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (existing && existing.status !== 'CANCELLED') {
    throw createError('You are already enrolled in this course.', 409, 'ALREADY_ENROLLED');
  }
  if (course.maxStudents) {
    const enrolledCount = await prisma.enrollment.count({ where: { courseId, status: { not: 'CANCELLED' } } });
    if (enrolledCount >= course.maxStudents) throw createError('This course is fully booked.', 400, 'COURSE_FULL');
  }

  let pricePaid = Number(course.price);
  let couponUsed: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (!coupon || !coupon.isActive) throw createError('Invalid or inactive coupon code.', 400, 'INVALID_COUPON');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw createError('This coupon has expired.', 400, 'COUPON_EXPIRED');
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw createError('This coupon has reached its usage limit.', 400, 'COUPON_EXHAUSTED');

    if (coupon.type === 'PERCENTAGE') {
      pricePaid = pricePaid - (pricePaid * Number(coupon.discount)) / 100;
    } else {
      pricePaid = Math.max(0, pricePaid - Number(coupon.discount));
    }

    couponUsed = coupon.code;

    await prisma.$transaction([
      prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } }),
      prisma.couponUsage.create({ data: { couponId: coupon.id, userId } }),
    ]);
  }

  const enrollment = existing
    ? await prisma.enrollment.update({
        where: { userId_courseId: { userId, courseId } },
        data: { status: 'CONFIRMED', pricePaid, couponUsed },
        include: { course: true },
      })
    : await prisma.enrollment.create({
        data: { userId, courseId, status: 'CONFIRMED', pricePaid, couponUsed },
        include: { course: true },
      });

  res.status(201).json({ success: true, message: 'Enrolled successfully.', data: { enrollment } });
});

// ─── Get My Enrollments ───────────────────────────────────────────────────────
export const getMyEnrollments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: { not: 'CANCELLED' } },
    include: {
      course: {
        select: { id: true, title_ar: true, title_en: true, image: true, duration: true, price: true, category: true, startDate: true, endDate: true },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  res.json({ success: true, data: { enrollments } });
});

// ─── Get All Enrollments (Admin) ──────────────────────────────────────────────
export const getAllEnrollments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = '1', limit = '20', status, courseId } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};
  if (status && status !== 'ALL') where['status'] = status;
  if (courseId && courseId !== 'ALL') where['courseId'] = courseId;

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        course: { select: { id: true, title_en: true, title_ar: true, price: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    }),
    prisma.enrollment.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      enrollments,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    },
  });
});

// ─── Update Enrollment Status (Admin) ─────────────────────────────────────────
export const updateEnrollmentStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment) throw createError('Enrollment not found.', 404, 'ENROLLMENT_NOT_FOUND');

  const updated = await prisma.enrollment.update({ where: { id }, data: { status } });
  res.json({ success: true, message: 'Enrollment status updated.', data: { enrollment: updated } });
});

export const deleteEnrollment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment) throw createError('Enrollment not found.', 404, 'ENROLLMENT_NOT_FOUND');
  await prisma.enrollment.delete({ where: { id } });
  res.json({ success: true, message: 'Enrollment deleted successfully.' });
});

// ─── Cancel My Enrollment ────────────────────────────────────────────────────
// A student may cancel only until 48 hours before the course begins.
export const cancelMyEnrollment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const enrollment = await prisma.enrollment.findFirst({
    where: { id, userId, status: { not: 'CANCELLED' } },
    include: { course: { select: { startDate: true } } },
  });

  if (!enrollment) throw createError('Enrollment not found.', 404, 'ENROLLMENT_NOT_FOUND');
  if (!enrollment.course.startDate) {
    throw createError('This enrollment cannot be cancelled because the course start date is not set.', 400, 'COURSE_START_DATE_MISSING');
  }

  const cancellationDeadline = new Date(enrollment.course.startDate.getTime() - 48 * 60 * 60 * 1000);
  if (new Date() > cancellationDeadline) {
    throw createError('Enrollment can only be cancelled up to two days before the course starts.', 400, 'CANCELLATION_DEADLINE_PASSED');
  }

  await prisma.enrollment.delete({ where: { id: enrollment.id } });
  res.json({ success: true, message: 'Enrollment cancelled successfully.' });
});
