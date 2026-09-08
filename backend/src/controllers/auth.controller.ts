import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler.middleware';

const prisma = new PrismaClient();

const generateToken = (user: { id: string; email: string; role: string }): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'] }
  );
};

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
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
    throw createError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
  }

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  const hashedPassword = await bcrypt.hash(password, rounds);

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
export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Object.assign(new Error(errors.array()[0].msg), {
      statusCode: 422,
      errorCode: 'VALIDATION_ERROR',
    });
  }

  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw createError('Incorrect email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw createError('Your account has been deactivated. Please contact support.', 403, 'ACCOUNT_DISABLED');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createError('Incorrect email or password.', 401, 'INVALID_CREDENTIALS');
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
export const getMe = asyncHandler(async (req: Request & { user?: { id: string } }, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
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
    throw createError('User not found.', 404, 'USER_NOT_FOUND');
  }

  res.json({ success: true, data: { user } });
});

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req: Request & { user?: { id: string } }, res: Response) => {
  const { firstName, lastName, phone } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { firstName, lastName, phone },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true },
  });

  res.json({ success: true, message: 'Profile updated successfully.', data: { user } });
});

// ─── Change Password ──────────────────────────────────────────────────────────
export const changePassword = asyncHandler(async (req: Request & { user?: { id: string } }, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw createError('User not found.', 404, 'USER_NOT_FOUND');

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw createError('Current password is incorrect.', 400, 'WRONG_PASSWORD');

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  const hashed = await bcrypt.hash(newPassword, rounds);

  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  res.json({ success: true, message: 'Password changed successfully.' });
});
