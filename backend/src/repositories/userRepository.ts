import crypto from 'crypto';
import { User, UserRole } from '@prisma/client';
import { prisma } from '../lib/db';
import { config } from '../config/env';

export class UserRepository {
  /**
   * Create a new user
   */
  static async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    passwordHash: string;
    country?: string;
    region?: string;
    city?: string;
    neighborhood?: string;
    birthDate?: string;
    gender?: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        country: data.country,
        region: data.region,
        city: data.city,
        neighborhood: data.neighborhood,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        gender: data.gender,
        primaryRole: UserRole.CLIENT,
        roles: [UserRole.CLIENT],
      },
    });
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  /**
   * Find user by phone
   */
  static async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { phone, deletedAt: null },
    });
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Check if phone exists
   */
  static async phoneExists(phone: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { phone },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Update user
   */
  static async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Update last login info
   */
  static async updateLastLogin(id: string, ipAddress: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        failedLoginAttempts: 0,
      },
    });
  }

  /**
   * Increment failed login attempts
   */
  static async incrementFailedLoginAttempts(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: { increment: 1 },
      },
    });
  }

  /**
   * Lock account
   */
  static async lockAccount(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        lockedUntil: new Date(Date.now() + config.ACCOUNT_LOCK_TIME_MS),
      },
    });
  }

  /**
   * Unlock account
   */
  static async unlockAccount(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  /**
   * Activate business role
   */
  static async activateBusinessRole(id: string, businessName: string, registrationNumber: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        primaryRole: UserRole.BUSINESS,
        roles: { push: UserRole.BUSINESS },
        businessName,
        businessRegistration: registrationNumber,
      },
    });
  }

  /**
   * Activate developer role
   */
  static async activateDeveloperRole(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        primaryRole: UserRole.DEVELOPER,
        roles: { push: UserRole.DEVELOPER },
        developerApiKey: crypto.randomBytes(16).toString('hex'),
      },
    });
  }

  /**
   * Soft delete user
   */
  static async softDelete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get all users (for admin)
   */
  static async findAll(skip: number = 0, take: number = 10) {
    return prisma.user.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}
