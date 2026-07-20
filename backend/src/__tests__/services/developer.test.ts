import { mockPrisma } from '../setup';
import {
  activateDeveloperRole,
  getDeveloperProfile,
  updateProfile,
  submitVerification,
  getDeveloperDashboard,
  getDeveloperByUserId,
  getPublicDeveloperProfile,
} from '../../services/developer';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/jwt', () => ({
  createTokenPair: jest
    .fn()
    .mockReturnValue({ accessToken: 'at', refreshToken: 'rt', expiresIn: 900 }),
}));
jest.mock('../../repositories/userRepository', () => ({
  UserRepository: { findById: jest.fn(), activateDeveloperRole: jest.fn() },
}));
jest.mock('../../repositories/developerRepository', () => ({
  DeveloperRepository: {
    findByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    submitVerification: jest.fn(),
    getDeveloperStats: jest.fn(),
  },
}));

const { UserRepository } = require('../../repositories/userRepository');
const { DeveloperRepository } = require('../../repositories/developerRepository');

const mockUser = {
  id: 'u1',
  email: 'dev@test.com',
  firstName: 'Dev',
  lastName: 'Test',
  phone: '+22501000000',
  country: 'CI',
  city: 'Abidjan',
  primaryRole: 'CLIENT',
  roles: ['CLIENT'],
};
const mockProfile = {
  id: 'dp-1',
  userId: 'u1',
  companyName: 'Dev Corp',
  email: 'dev@test.com',
  phone: '+22501000000',
  country: 'CI',
  city: 'Abidjan',
  verificationStatus: 'PENDING',
  rating: 0,
  reviewCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockDevUser = { ...mockUser, primaryRole: 'DEVELOPER', roles: ['CLIENT', 'DEVELOPER'] };

describe('Developer Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('activateDeveloperRole', () => {
    test('activates and creates profile', async () => {
      UserRepository.findById.mockResolvedValue(mockUser);
      UserRepository.activateDeveloperRole.mockResolvedValue(mockDevUser);
      DeveloperRepository.findByUserId.mockResolvedValue(null);
      DeveloperRepository.create.mockResolvedValue(mockProfile);
      const r = await activateDeveloperRole('u1');
      expect(r.user.primaryRole).toBe('DEVELOPER');
      expect(r.profile.id).toBe('dp-1');
    });

    test('throws if already developer', async () => {
      UserRepository.findById.mockResolvedValue({ ...mockUser, primaryRole: 'DEVELOPER' });
      await expect(activateDeveloperRole('u1')).rejects.toThrow('Vous êtes déjà développeur');
    });
  });

  describe('getDeveloperProfile', () => {
    test('returns profile with stats', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue({
        ...mockProfile,
        user: {
          id: 'u1',
          firstName: 'Dev',
          lastName: 'Test',
          email: 'dev@test.com',
          phone: '+22501000000',
          avatar: null,
          developerApiKey: null,
        },
        specialties: [],
        technologies: [],
      } as any);
      DeveloperRepository.getDeveloperStats.mockResolvedValue({
        totalModules: 3,
        totalRevenue: 500,
      });
      const r = await getDeveloperProfile('u1');
      expect(r.id).toBe('dp-1');
      expect(r.stats.totalModules).toBe(3);
    });

    test('throws if not found', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue(null);
      await expect(getDeveloperProfile('u-x')).rejects.toThrow('Profil développeur non trouvé');
    });
  });

  describe('updateProfile', () => {
    test('updates with field mapping', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      DeveloperRepository.update.mockResolvedValue({
        ...mockProfile,
        companyName: 'New Corp',
        description: 'My description',
      });
      const r = await updateProfile('u1', {
        companyName: 'New Corp',
        description: 'My description',
      });
      expect(r.companyName).toBe('New Corp');
    });
  });

  describe('submitVerification', () => {
    test('submits documents', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      DeveloperRepository.submitVerification.mockResolvedValue({
        ...mockProfile,
        verificationStatus: 'PENDING',
      });
      const r = await submitVerification('u1', {
        identityDoc: 'id.jpg',
        companyDoc: 'comp.jpg',
        responsiblePhoto: 'photo.jpg',
      });
      expect(r.id).toBe('dp-1');
    });

    test('throws if already verified', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue({
        ...mockProfile,
        verificationStatus: 'VERIFIED',
      });
      await expect(
        submitVerification('u1', {
          identityDoc: 'id.jpg',
          companyDoc: 'comp.jpg',
          responsiblePhoto: 'photo.jpg',
        })
      ).rejects.toThrow('Vous êtes déjà vérifié');
    });
  });

  describe('getDeveloperDashboard', () => {
    test('returns dashboard with aggregated data', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      jest.spyOn(mockPrisma.developerModule, 'findMany').mockResolvedValue([
        {
          id: 'dm-1',
          name: 'Module',
          slug: 'module',
          status: 'PUBLISHED',
          totalInstalls: 10,
          totalSales: 5,
          totalRevenue: 100,
          rating: 4,
          reviewCount: 2,
          pricingType: 'MONTHLY',
          price: 5000,
          createdAt: new Date(),
        } as any,
      ]);
      jest.spyOn(mockPrisma.developerModuleInstallation, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.developerRevenue, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.developerModuleReview, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.developerSupportTicket, 'findMany').mockResolvedValue([]);
      const r = await getDeveloperDashboard('u1');
      expect(r.overview.totalModules).toBe(1);
      expect(r.overview.activeModules).toBe(1);
    });
  });

  test('getDeveloperByUserId returns profile', async () => {
    DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
    const r = await getDeveloperByUserId('u1');
    expect(r.id).toBe('dp-1');
  });

  test('getPublicDeveloperProfile returns public profile', async () => {
    jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue({
      ...mockProfile,
      user: { id: 'u1', firstName: 'Dev', lastName: 'Test', avatar: null },
      modules: [],
    } as any);
    const r = await getPublicDeveloperProfile('dp-1');
    expect(r.companyName).toBe('Dev Corp');
  });
});
