/**
 * Test helpers and fixtures
 */

import { UserRole } from '@prisma/client';

/**
 * Creates a mock user object for testing
 */
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-id-12345',
  email: 'test@example.com',
  phone: '+22890123456',
  firstName: 'Jean',
  lastName: 'Test',
  passwordHash: '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5JFtY5Bv5CU5m5f5z5v5W5u', // hashed 'TestPass123!'
  emailVerified: false,
  phoneVerified: false,
  isActive: true,
  failedLoginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: null,
  lastLoginIp: null,
  primaryRole: UserRole.CLIENT,
  roles: [UserRole.CLIENT],
  avatar: null,
  country: 'Togo',
  region: 'Maritime',
  city: 'Lomé',
  neighborhood: 'Kodjoviakopé',
  birthDate: new Date('1990-01-01'),
  businessName: null,
  businessRegistration: null,
  developerApiKey: null,
  twoFactorEnabled: false,
  rememberMeToken: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  ...overrides,
});

/**
 * Valid signup payload
 */
export const validSignupPayload = {
  firstName: 'Jean',
  lastName: 'Test',
  email: 'test@example.com',
  phone: '+22890123456',
  password: 'TestPass123!',
  country: 'Togo',
  region: 'Maritime',
  city: 'Lomé',
  neighborhood: 'Kodjoviakopé',
  birthDate: '1990-01-01',
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
};

/**
 * Valid login payload
 */
export const validLoginPayload = {
  identifier: 'test@example.com',
  password: 'TestPass123!',
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
};

/**
 * Weak password - should fail validation
 */
export const weakPassword = '12345';

/**
 * Password without uppercase
 */
export const passwordNoUpper = 'testpass123!';

/**
 * Password without special char
 */
export const passwordNoSpecial = 'TestPass123';
