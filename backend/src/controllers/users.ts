import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { comparePasswords, hashPassword, isValidPassword } from '../lib/password';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { config } from '../config/env';

export const getProfile = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Not authenticated' }); return; }
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, email: true, firstName: true, lastName: true, phone: true,
      emailVerified: true, phoneVerified: true, primaryRole: true, roles: true,
      country: true, region: true, city: true, neighborhood: true, birthDate: true,
      businessName: true, businessRegistration: true,
      twoFactorEnabled: true, createdAt: true,
    },
  });
  res.json(successResponse({ user }));
});

export const updateProfile = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Not authenticated' }); return; }
  const allowed = ['firstName', 'lastName', 'phone', 'country', 'region', 'city', 'neighborhood', 'address', 'businessName', 'language', 'currency'];
  const data: any = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, primaryRole: true, roles: true },
  });
  res.json(successResponse({ user }, 'Profil mis à jour'));
});

export const updatePassword = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Not authenticated' }); return; }
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }

  const valid = await comparePasswords(currentPassword, user.passwordHash);
  if (!valid) { res.status(400).json({ success: false, error: 'Current password is incorrect' }); return; }

  if (!isValidPassword(newPassword)) {
    res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    });
    return;
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
  res.json(successResponse(null, 'Password updated'));
});

export const toggle2FA = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Not authenticated' }); return; }
  const { enable } = req.body;
  await prisma.user.update({
    where: { id: req.user.id },
    data: { twoFactorEnabled: enable },
  });
  res.json(successResponse(null, '2FA preference updated'));
});

export const uploadAvatar = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const file = (req as any).file;
  if (!file) { res.status(400).json({ success: false, error: 'Aucun fichier fourni' }); return; }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimes.includes(file.mimetype)) {
    fs.unlinkSync(file.path);
    res.status(400).json({ success: false, error: 'Format non supporté. Utilisez JPG, PNG, WebP ou GIF.' });
    return;
  }

  const avatarUrl = `/uploads/avatars/${file.filename}`;
  await prisma.user.update({
    where: { id: req.user.id },
    data: { avatar: avatarUrl },
  });

  res.json(successResponse({ avatar: avatarUrl }, 'Photo de profil mise à jour'));
});
