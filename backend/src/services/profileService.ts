import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { comparePasswords, hashPassword, isValidPassword } from '../lib/password';
import fs from 'fs';

const ALLOWED_UPDATE_FIELDS = [
  'firstName',
  'lastName',
  'phone',
  'country',
  'region',
  'city',
  'neighborhood',
  'address',
  'businessName',
  'language',
  'currency',
];

export async function getProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      emailVerified: true,
      phoneVerified: true,
      primaryRole: true,
      roles: true,
      country: true,
      region: true,
      city: true,
      neighborhood: true,
      birthDate: true,
      businessName: true,
      businessRegistration: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  });
}

export async function updateProfile(userId: string, body: Record<string, any>) {
  const data: Record<string, any> = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      primaryRole: true,
      roles: true,
    },
  });
}

export async function updatePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  const valid = await comparePasswords(currentPassword, user.passwordHash);
  if (!valid) throw new AppError('Current password is incorrect', 400);
  if (!isValidPassword(newPassword)) {
    throw new AppError(
      'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      400
    );
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function toggle2FA(userId: string, enable: boolean) {
  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: enable } });
}

export async function uploadAvatar(userId: string, file: any) {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!file || !allowedMimes.includes(file.mimetype)) {
    if (file) fs.unlinkSync(file.path);
    throw new AppError('Format non supporte. Utilisez JPG, PNG, WebP ou GIF.', 400);
  }
  const avatarUrl = '/uploads/avatars/' + file.filename;
  await prisma.user.update({ where: { id: userId }, data: { avatar: avatarUrl } });
  return avatarUrl;
}
