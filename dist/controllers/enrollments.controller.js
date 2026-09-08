"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelMyEnrollment = exports.deleteEnrollment = exports.updateEnrollmentStatus = exports.getAllEnrollments = exports.getMyEnrollments = exports.enrollInCourse = void 0;
const client_1 = require("@prisma/client");
const errorHandler_middleware_1 = require("../middleware/errorHandler.middleware");
const prisma = new client_1.PrismaClient();
// ─── Enroll in Course ─────────────────────────────────────────────────────────
exports.enrollInCourse = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { courseId, couponCode } = req.body;
    const userId = req.user.id;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course)
        throw (0, errorHandler_middleware_1.createError)('Course not found.', 404, 'COURSE_NOT_FOUND');
    if (course.status !== 'ACTIVE')
        throw (0, errorHandler_middleware_1.createError)('This course is not available for enrollment.', 400, 'COURSE_UNAVAILABLE');
    const now = new Date();
    if (course.endDate && course.endDate < now)
        throw (0, errorHandler_middleware_1.createError)('Enrollment is closed because this course has ended.', 400, 'COURSE_ENDED');
    const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
    if (existing && existing.status !== 'CANCELLED') {
        throw (0, errorHandler_middleware_1.createError)('You are already enrolled in this course.', 409, 'ALREADY_ENROLLED');
    }
    if (course.maxStudents) {
        const enrolledCount = await prisma.enrollment.count({ where: { courseId, status: { not: 'CANCELLED' } } });
        if (enrolledCount >= course.maxStudents)
            throw (0, errorHandler_middleware_1.createError)('This course is fully booked.', 400, 'COURSE_FULL');
    }
    let pricePaid = Number(course.price);
    let couponUsed = null;
    if (couponCode) {
        const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
        if (!coupon || !coupon.isActive)
            throw (0, errorHandler_middleware_1.createError)('Invalid or inactive coupon code.', 400, 'INVALID_COUPON');
        if (coupon.expiresAt && coupon.expiresAt < new Date())
            throw (0, errorHandler_middleware_1.createError)('This coupon has expired.', 400, 'COUPON_EXPIRED');
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
            throw (0, errorHandler_middleware_1.createError)('This coupon has reached its usage limit.', 400, 'COUPON_EXHAUSTED');
        if (coupon.type === 'PERCENTAGE') {
            pricePaid = pricePaid - (pricePaid * Number(coupon.discount)) / 100;
        }
        else {
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
exports.getMyEnrollments = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
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
exports.getAllEnrollments = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { page = '1', limit = '20', status, courseId } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;
    const where = {};
    if (status && status !== 'ALL')
        where['status'] = status;
    if (courseId && courseId !== 'ALL')
        where['courseId'] = courseId;
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
exports.updateEnrollmentStatus = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const enrollment = await prisma.enrollment.findUnique({ where: { id } });
    if (!enrollment)
        throw (0, errorHandler_middleware_1.createError)('Enrollment not found.', 404, 'ENROLLMENT_NOT_FOUND');
    const updated = await prisma.enrollment.update({ where: { id }, data: { status } });
    res.json({ success: true, message: 'Enrollment status updated.', data: { enrollment: updated } });
});
exports.deleteEnrollment = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const enrollment = await prisma.enrollment.findUnique({ where: { id } });
    if (!enrollment)
        throw (0, errorHandler_middleware_1.createError)('Enrollment not found.', 404, 'ENROLLMENT_NOT_FOUND');
    await prisma.enrollment.delete({ where: { id } });
    res.json({ success: true, message: 'Enrollment deleted successfully.' });
});
// ─── Cancel My Enrollment ────────────────────────────────────────────────────
// A student may cancel only until 48 hours before the course begins.
exports.cancelMyEnrollment = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const enrollment = await prisma.enrollment.findFirst({
        where: { id, userId, status: { not: 'CANCELLED' } },
        include: { course: { select: { startDate: true } } },
    });
    if (!enrollment)
        throw (0, errorHandler_middleware_1.createError)('Enrollment not found.', 404, 'ENROLLMENT_NOT_FOUND');
    if (!enrollment.course.startDate) {
        throw (0, errorHandler_middleware_1.createError)('This enrollment cannot be cancelled because the course start date is not set.', 400, 'COURSE_START_DATE_MISSING');
    }
    const cancellationDeadline = new Date(enrollment.course.startDate.getTime() - 48 * 60 * 60 * 1000);
    if (new Date() > cancellationDeadline) {
        throw (0, errorHandler_middleware_1.createError)('Enrollment can only be cancelled up to two days before the course starts.', 400, 'CANCELLATION_DEADLINE_PASSED');
    }
    await prisma.enrollment.delete({ where: { id: enrollment.id } });
    res.json({ success: true, message: 'Enrollment cancelled successfully.' });
});
//# sourceMappingURL=enrollments.controller.js.map