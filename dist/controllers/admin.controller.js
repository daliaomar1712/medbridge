"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportData = exports.deleteUser = exports.updateUser = exports.getAllUsers = exports.getAnalytics = exports.updateAcademyProfile = void 0;
const client_1 = require("@prisma/client");
const errorHandler_middleware_1 = require("../middleware/errorHandler.middleware");
const XLSX = __importStar(require("xlsx"));
const prisma = new client_1.PrismaClient();
exports.updateAcademyProfile = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const allowedFields = [
        'name', 'nameAr', 'tagline', 'taglineAr', 'description', 'descriptionAr', 'whatsappUrl', 'whatsappChannel',
        'facebookUrl', 'instagramUrl', 'tiktokUrl', 'email', 'phone', 'location', 'suturingVideosUrl',
    ];
    const requiredFields = new Set(['name', 'tagline', 'description', 'location']);
    const data = Object.fromEntries(allowedFields
        .filter(field => field in req.body)
        .filter(field => requiredFields.has(field) ? String(req.body[field] ?? '').trim().length > 0 : true)
        .map(field => [field, requiredFields.has(field) ? String(req.body[field]).trim() : (req.body[field] || null)]));
    const profile = await prisma.academyProfile.upsert({
        where: { id: 1 },
        update: data,
        create: { id: 1, ...data },
    });
    res.json({ success: true, message: 'Academy profile updated successfully.', data: { profile } });
});
// ─── Dashboard Analytics ──────────────────────────────────────────────────────
exports.getAnalytics = (0, errorHandler_middleware_1.asyncHandler)(async (_req, res) => {
    const [totalUsers, totalCourses, totalEnrollments, activeCourses, confirmedEnrollments, pendingEnrollments, cancelledEnrollments, recentEnrollments, recentUsers, topCourses,] = await Promise.all([
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.course.count({ where: { status: 'ACTIVE' } }),
        prisma.enrollment.count({ where: { status: 'CONFIRMED' } }),
        prisma.enrollment.count({ where: { status: 'PENDING' } }),
        prisma.enrollment.count({ where: { status: 'CANCELLED' } }),
        prisma.enrollment.findMany({
            take: 5,
            orderBy: { enrolledAt: 'desc' },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                course: { select: { title_en: true, title_ar: true } },
            },
        }),
        prisma.user.findMany({
            take: 5,
            where: { role: 'USER' },
            orderBy: { createdAt: 'desc' },
            select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
        }),
        prisma.course.findMany({
            take: 6,
            orderBy: { enrollments: { _count: 'desc' } },
            select: {
                id: true, title_en: true, title_ar: true, price: true, image: true,
                _count: { select: { enrollments: true } },
            },
        }),
    ]);
    const revenueResult = await prisma.enrollment.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { pricePaid: true },
    });
    const totalRevenue = Number(revenueResult._sum.pricePaid || 0);
    // Monthly enrollment data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyEnrollments = await prisma.$queryRaw `
    SELECT TO_CHAR(DATE_TRUNC('month', "enrolledAt"), 'Mon YYYY') as month,
           COUNT(*) as count
    FROM enrollments
    WHERE "enrolledAt" >= ${sixMonthsAgo}
    GROUP BY DATE_TRUNC('month', "enrolledAt")
    ORDER BY DATE_TRUNC('month', "enrolledAt")
  `;
    res.json({
        success: true,
        data: {
            stats: {
                totalUsers, totalCourses, totalEnrollments, activeCourses,
                totalRevenue, confirmedEnrollments, pendingEnrollments, cancelledEnrollments,
            },
            recentEnrollments,
            recentUsers,
            topCourses,
            monthlyEnrollments: monthlyEnrollments.map(e => ({ month: e.month, count: Number(e.count) })),
        },
    });
});
// ─── Get All Users (Admin) ────────────────────────────────────────────────────
exports.getAllUsers = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { page = '1', limit = '20', search = '', role } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;
    const where = {};
    if (role && role !== 'ALL')
        where['role'] = role;
    if (search) {
        where['OR'] = [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
        ];
    }
    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, email: true, firstName: true, lastName: true,
                role: true, isActive: true, phone: true, createdAt: true,
                _count: { select: { enrollments: true } },
            },
        }),
        prisma.user.count({ where }),
    ]);
    res.json({
        success: true,
        data: { users, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } },
    });
});
// ─── Update User (Admin) ──────────────────────────────────────────────────────
exports.updateUser = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { role, isActive } = req.body;
    const user = await prisma.user.update({
        where: { id },
        data: {
            ...(role && { role }),
            ...(isActive !== undefined && { isActive }),
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
    res.json({ success: true, message: 'User updated successfully.', data: { user } });
});
exports.deleteUser = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found.', errorCode: 'USER_NOT_FOUND' });
        return;
    }
    if (user.role === 'ADMIN') {
        res.status(400).json({ success: false, message: 'Admin accounts cannot be deleted from this screen.', errorCode: 'ADMIN_DELETE_BLOCKED' });
        return;
    }
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User and related records deleted successfully.' });
});
// ─── Export Data (Admin) ──────────────────────────────────────────────────────
exports.exportData = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { type = 'enrollments' } = req.query;
    const wb = XLSX.utils.book_new();
    if (type === 'enrollments' || type === 'all') {
        const enrollments = await prisma.enrollment.findMany({
            include: {
                user: { select: { email: true, firstName: true, lastName: true } },
                course: { select: { title_en: true, price: true } },
            },
            orderBy: { enrolledAt: 'desc' },
        });
        const rows = enrollments.map(e => ({
            'Student Name': `${e.user.firstName} ${e.user.lastName}`,
            Email: e.user.email,
            Course: e.course.title_en,
            'Original Price': Number(e.course.price).toFixed(2),
            'Price Paid': Number(e.pricePaid).toFixed(2),
            'Coupon Used': e.couponUsed || '-',
            Status: e.status,
            'Enrolled At': new Date(e.enrolledAt).toLocaleDateString(),
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Enrollments');
    }
    if (type === 'users' || type === 'all') {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: { firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true },
        });
        const rows = users.map(u => ({
            'First Name': u.firstName, 'Last Name': u.lastName, Email: u.email,
            Role: u.role, Active: u.isActive ? 'Yes' : 'No',
            'Joined At': new Date(u.createdAt).toLocaleDateString(),
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Users');
    }
    if (type === 'courses' || type === 'all') {
        const courses = await prisma.course.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { enrollments: true } } },
        });
        const rows = courses.map(c => ({
            'Title (EN)': c.title_en, 'Title (AR)': c.title_ar,
            Price: Number(c.price).toFixed(2), Duration: c.duration,
            Status: c.status, Enrollments: c._count.enrollments,
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Courses');
    }
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="medbridge_export_${type}_${Date.now()}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
});
//# sourceMappingURL=admin.controller.js.map