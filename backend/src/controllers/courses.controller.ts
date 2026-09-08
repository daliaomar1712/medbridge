import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// ─── List Courses (Public) ────────────────────────────────────────────────────
export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '12', search = '', status = 'ACTIVE', category = '' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};
  if (status && status !== 'ALL') where['status'] = status;
  if (category && category !== 'ALL') where['category'] = category;
  if (search) {
    where['OR'] = [
      { title_en: { contains: search, mode: 'insensitive' } },
      { title_ar: { contains: search, mode: 'insensitive' } },
      { description_en: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title_ar: true, title_en: true,
        description_ar: true, description_en: true,
        price: true, duration: true, image: true, status: true,
        category: true, maxStudents: true, startDate: true, endDate: true, createdAt: true,
        _count: { select: { enrollments: { where: { status: { not: 'CANCELLED' } } } } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      courses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
});

// ─── Get Course By ID (Public) ────────────────────────────────────────────────
export const getCourseById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const course = await prisma.course.findUnique({
    where: { id },
    select: {
      id: true, title_ar: true, title_en: true,
      description_ar: true, description_en: true,
      price: true, duration: true, image: true, status: true,
      category: true, maxStudents: true, startDate: true, endDate: true, createdAt: true,
      _count: { select: { enrollments: { where: { status: { not: 'CANCELLED' } } } } },
    },
  });

  if (!course) throw createError('Course not found.', 404, 'COURSE_NOT_FOUND');

  res.json({ success: true, data: { course } });
});

// ─── Create Course (Admin) ────────────────────────────────────────────────────
export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const { title_ar, title_en, description_ar, description_en, price, duration, image, status, category, maxStudents, startDate, endDate } = req.body;
  const courseDates = parseCourseDates(startDate, endDate);

  const course = await prisma.course.create({
    data: { title_ar, title_en, description_ar, description_en, price: parseFloat(price), duration, image, status, category, maxStudents: maxStudents ? parseInt(maxStudents) : null, ...courseDates },
  });

  res.status(201).json({ success: true, message: 'Course created successfully.', data: { course } });
});

// ─── Update Course (Admin) ────────────────────────────────────────────────────
export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title_ar, title_en, description_ar, description_en, price, duration, image, status, category, maxStudents, startDate, endDate } = req.body;
  const courseDates = parseCourseDates(startDate, endDate);

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) throw createError('Course not found.', 404, 'COURSE_NOT_FOUND');

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(title_ar && { title_ar }),
      ...(title_en && { title_en }),
      ...(description_ar && { description_ar }),
      ...(description_en && { description_en }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(duration && { duration }),
      ...(image !== undefined && { image }),
      ...(status && { status }),
      ...(category !== undefined && { category }),
      ...(maxStudents !== undefined && { maxStudents: maxStudents ? parseInt(maxStudents) : null }),
      ...courseDates,
    },
  });

  res.json({ success: true, message: 'Course updated successfully.', data: { course } });
});

function parseCourseDates(startDate: unknown, endDate: unknown): { startDate?: Date | null; endDate?: Date | null } {
  const data: { startDate?: Date | null; endDate?: Date | null } = {};
  if (startDate !== undefined) data.startDate = startDate ? new Date(String(startDate)) : null;
  if (endDate !== undefined) {
    if (endDate) {
      const parsed = new Date(String(endDate));
      parsed.setHours(23, 59, 59, 999);
      data.endDate = parsed;
    } else data.endDate = null;
  }
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    throw createError('Course end date must be after its start date.', 422, 'INVALID_COURSE_DATES');
  }
  return data;
}

// ─── Delete Course (Admin) ────────────────────────────────────────────────────
export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) throw createError('Course not found.', 404, 'COURSE_NOT_FOUND');

  await prisma.course.update({ where: { id }, data: { status: 'INACTIVE' } });

  res.json({ success: true, message: 'Course deactivated successfully.' });
});

// ─── Get User Wishlist Status for Course ──────────────────────────────────────
export const getCourseWithWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw createError('Course not found.', 404, 'COURSE_NOT_FOUND');

  let isInWishlist = false;
  let isEnrolled = false;

  if (userId) {
    const [wishlistItem, enrollment] = await Promise.all([
      prisma.wishlist.findUnique({ where: { userId_courseId: { userId, courseId: id } } }),
      prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: id } } }),
    ]);
    isInWishlist = !!wishlistItem;
    isEnrolled = !!enrollment && enrollment.status !== 'CANCELLED';
  }

  res.json({ success: true, data: { course, isInWishlist, isEnrolled } });
});
