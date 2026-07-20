import { mockPrisma } from '../setup';
import {
  getProfile,
  updateProfile,
  updatePassword,
  toggle2FA,
  uploadAvatar,
} from '../../services/profileService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/password', () => ({
  comparePasswords: jest.fn(),
  hashPassword: jest.fn(),
  isValidPassword: jest.fn(),
}));
jest.mock('fs', () => ({ unlinkSync: jest.fn() }));

const mockUser = {
  id: 'u1',
  email: 'test@test.com',
  firstName: 'Jean',
  lastName: 'Dupont',
  phone: '+22501000000',
  emailVerified: true,
  phoneVerified: false,
  primaryRole: 'CLIENT',
  roles: ['CLIENT'],
  country: 'CI',
  city: 'Abidjan',
  createdAt: new Date(),
};

describe('Profile Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getProfile returns user', async () => {
    jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(mockUser as any);
    const r = await getProfile('u1');
    expect(r?.email).toBe('test@test.com');
  });

  test('updateProfile updates allowed fields', async () => {
    jest.spyOn(mockPrisma.user, 'update').mockResolvedValue({
      id: 'u1',
      email: 'test@test.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+22501000001',
      primaryRole: 'CLIENT',
      roles: ['CLIENT'],
    } as any);
    const r = await updateProfile('u1', { phone: '+22501000001' });
    expect(r.phone).toBe('+22501000001');
  });

  test('updateProfile ignores non-allowed fields', async () => {
    jest.spyOn(mockPrisma.user, 'update').mockResolvedValue({
      id: 'u1',
      email: 'test@test.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+22501000000',
      primaryRole: 'CLIENT',
      roles: ['CLIENT'],
    } as any);
    const r = await updateProfile('u1', { email: 'hacked@test.com' });
    expect(r.email).toBe('test@test.com');
  });

  describe('updatePassword', () => {
    const { comparePasswords, hashPassword, isValidPassword } = require('../../lib/password');
    test('updates with valid password', async () => {
      jest
        .spyOn(mockPrisma.user, 'findUnique')
        .mockResolvedValue({ ...mockUser, passwordHash: 'hash' } as any);
      jest.spyOn(mockPrisma.user, 'update').mockResolvedValue(mockUser as any);
      comparePasswords.mockResolvedValue(true);
      isValidPassword.mockReturnValue(true);
      hashPassword.mockResolvedValue('newhash');
      await expect(updatePassword('u1', 'old', 'NewPass123!')).resolves.not.toThrow();
    });

    test('throws on wrong current password', async () => {
      jest
        .spyOn(mockPrisma.user, 'findUnique')
        .mockResolvedValue({ ...mockUser, passwordHash: 'hash' } as any);
      comparePasswords.mockResolvedValue(false);
      await expect(updatePassword('u1', 'wrong', 'NewPass123!')).rejects.toThrow(
        'Current password is incorrect'
      );
    });

    test('throws on weak new password', async () => {
      jest
        .spyOn(mockPrisma.user, 'findUnique')
        .mockResolvedValue({ ...mockUser, passwordHash: 'hash' } as any);
      comparePasswords.mockResolvedValue(true);
      isValidPassword.mockReturnValue(false);
      await expect(updatePassword('u1', 'old', 'weak')).rejects.toThrow(
        'Password must be at least 8 characters'
      );
    });
  });

  test('toggle2FA enables', async () => {
    jest.spyOn(mockPrisma.user, 'update').mockResolvedValue(mockUser as any);
    await expect(toggle2FA('u1', true)).resolves.not.toThrow();
  });

  test('uploadAvatar with valid file', async () => {
    jest
      .spyOn(mockPrisma.user, 'update')
      .mockResolvedValue({ ...mockUser, avatar: '/uploads/avatars/avatar.jpg' } as any);
    const r = await uploadAvatar('u1', {
      mimetype: 'image/jpeg',
      filename: 'avatar.jpg',
      path: '/tmp/avatar.jpg',
    });
    expect(r).toBe('/uploads/avatars/avatar.jpg');
  });

  test('uploadAvatar rejects invalid mime', async () => {
    await expect(
      uploadAvatar('u1', { mimetype: 'text/html', filename: 'bad.html', path: '/tmp/bad.html' })
    ).rejects.toThrow('Format non supporte');
  });
});
