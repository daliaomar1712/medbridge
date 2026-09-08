"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleWishlist = exports.getMyWishlist = exports.removeFromWishlist = exports.addToWishlist = void 0;
const client_1 = require("@prisma/client");
const errorHandler_middleware_1 = require("../middleware/errorHandler.middleware");
const prisma = new client_1.PrismaClient();
// ─── Add to Wishlist ──────────────────────────────────────────────────────────
exports.addToWishlist = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user.id;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course)
        throw (0, errorHandler_middleware_1.createError)('Course not found.', 404, 'COURSE_NOT_FOUND');
    const existing = await prisma.wishlist.findUnique({ where: { userId_courseId: { userId, courseId } } });
    if (existing)
        throw (0, errorHandler_middleware_1.createError)('Course is already in your wishlist.', 409, 'ALREADY_IN_WISHLIST');
    const wishlistItem = await prisma.wishlist.create({
        data: { userId, courseId },
        include: { course: { select: { id: true, title_ar: true, title_en: true, image: true, price: true } } },
    });
    res.status(201).json({ success: true, message: 'Added to wishlist.', data: { wishlistItem } });
});
// ─── Remove from Wishlist ─────────────────────────────────────────────────────
exports.removeFromWishlist = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    const existing = await prisma.wishlist.findUnique({ where: { userId_courseId: { userId, courseId } } });
    if (!existing)
        throw (0, errorHandler_middleware_1.createError)('Course is not in your wishlist.', 404, 'NOT_IN_WISHLIST');
    await prisma.wishlist.delete({ where: { userId_courseId: { userId, courseId } } });
    res.json({ success: true, message: 'Removed from wishlist.' });
});
// ─── Get My Wishlist ──────────────────────────────────────────────────────────
exports.getMyWishlist = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
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
exports.toggleWishlist = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user.id;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course)
        throw (0, errorHandler_middleware_1.createError)('Course not found.', 404, 'COURSE_NOT_FOUND');
    const existing = await prisma.wishlist.findUnique({ where: { userId_courseId: { userId, courseId } } });
    if (existing) {
        await prisma.wishlist.delete({ where: { userId_courseId: { userId, courseId } } });
        res.json({ success: true, message: 'Removed from wishlist.', data: { inWishlist: false } });
    }
    else {
        await prisma.wishlist.create({ data: { userId, courseId } });
        res.json({ success: true, message: 'Added to wishlist.', data: { inWishlist: true } });
    }
});
//# sourceMappingURL=wishlist.controller.js.map