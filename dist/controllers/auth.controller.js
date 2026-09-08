"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const errorHandler_middleware_1 = require("../middleware/errorHandler.middleware");
const prisma = new client_1.PrismaClient();
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') });
};
// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw Object.assign(new Error(errors.array()[0].msg), {
            statusCode: 422,
            errorCode: 'VALIDATION_ERROR',
            fields: errors.array(),
        });
    }
    const { email, password, firstName, lastName, phone } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw (0, errorHandler_middleware_1.createError)('An account with this email already exists.', 409, 'EMAIL_EXISTS');
    }
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const hashedPassword = await bcryptjs_1.default.hash(password, rounds);
    const user = await prisma.user.create({
        data: { email, password: hashedPassword, firstName, lastName, phone },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
    });
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: { user, token },
    });
});
// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw Object.assign(new Error(errors.array()[0].msg), {
            statusCode: 422,
            errorCode: 'VALIDATION_ERROR',
        });
    }
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw (0, errorHandler_middleware_1.createError)('Incorrect email or password.', 401, 'INVALID_CREDENTIALS');
    }
    if (!user.isActive) {
        throw (0, errorHandler_middleware_1.createError)('Your account has been deactivated. Please contact support.', 403, 'ACCOUNT_DISABLED');
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw (0, errorHandler_middleware_1.createError)('Incorrect email or password.', 401, 'INVALID_CREDENTIALS');
    }
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.json({
        success: true,
        message: 'Login successful.',
        data: {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                createdAt: user.createdAt,
            },
            token,
        },
    });
});
// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            _count: {
                select: { enrollments: true, wishlists: true },
            },
        },
    });
    if (!user) {
        throw (0, errorHandler_middleware_1.createError)('User not found.', 404, 'USER_NOT_FOUND');
    }
    res.json({ success: true, data: { user } });
});
// ─── Update Profile ───────────────────────────────────────────────────────────
exports.updateProfile = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { firstName, lastName, phone } = req.body;
    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { firstName, lastName, phone },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true },
    });
    res.json({ success: true, message: 'Profile updated successfully.', data: { user } });
});
// ─── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = (0, errorHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user)
        throw (0, errorHandler_middleware_1.createError)('User not found.', 404, 'USER_NOT_FOUND');
    const valid = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!valid)
        throw (0, errorHandler_middleware_1.createError)('Current password is incorrect.', 400, 'WRONG_PASSWORD');
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const hashed = await bcryptjs_1.default.hash(newPassword, rounds);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ success: true, message: 'Password changed successfully.' });
});
//# sourceMappingURL=auth.controller.js.map