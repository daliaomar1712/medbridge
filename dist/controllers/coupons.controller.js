"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCoupon = exports.updateCoupon = exports.createCoupon = exports.listCoupons = exports.validateCoupon = void 0;
const client_1 = require("@prisma/client");
const errorHandler_middleware_1 = require("../middleware/errorHandler.middleware");
const prisma = new client_1.PrismaClient();
// ─── Validate Coupon ──────────────────────────────────────────────────────────
exports.validateCoupon = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { code, courseId } = req.body;
    const userId = req.user.id;
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive)
        throw (0, errorHandler_middleware_1.createError)('Invalid or inactive coupon code.', 400, 'INVALID_COUPON');
    if (coupon.expiresAt && coupon.expiresAt < new Date())
        throw (0, errorHandler_middleware_1.createError)('This coupon has expired.', 400, 'COUPON_EXPIRED');
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
        throw (0, errorHandler_middleware_1.createError)('This coupon has reached its usage limit.', 400, 'COUPON_EXHAUSTED');
    let coursePrice = 0;
    if (courseId) {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (course)
            coursePrice = Number(course.price);
    }
    let discountAmount = 0;
    let finalPrice = coursePrice;
    if (coupon.type === 'PERCENTAGE') {
        discountAmount = (coursePrice * Number(coupon.discount)) / 100;
        finalPrice = coursePrice - discountAmount;
    }
    else {
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
exports.listCoupons = (0, errorHandler_middleware_1.asyncHandler)(async (_req, res) => {
    const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { usages: true } } },
    });
    res.json({ success: true, data: { coupons } });
});
// ─── Create Coupon (Admin) ────────────────────────────────────────────────────
exports.createCoupon = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { code, discount, type, maxUses, expiresAt, isActive } = req.body;
    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing)
        throw (0, errorHandler_middleware_1.createError)('Coupon code already exists.', 409, 'COUPON_EXISTS');
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
exports.updateCoupon = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { discount, type, maxUses, expiresAt, isActive } = req.body;
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing)
        throw (0, errorHandler_middleware_1.createError)('Coupon not found.', 404, 'COUPON_NOT_FOUND');
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
exports.deleteCoupon = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing)
        throw (0, errorHandler_middleware_1.createError)('Coupon not found.', 404, 'COUPON_NOT_FOUND');
    await prisma.coupon.delete({ where: { id } });
    res.json({ success: true, message: 'Coupon deleted successfully.' });
});
//# sourceMappingURL=coupons.controller.js.map