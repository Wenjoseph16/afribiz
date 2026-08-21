import { mockPrisma } from '../setup';
import {
  activateDeveloperRole,
  getDeveloperProfile,
  updateProfile,
  submitVerification,
  getDeveloperDashboard,
  getDeveloperByUserId,
  getPublicDeveloperProfile,
  computeProfileStrength,
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

    test('maps expertise matrix and derives flat arrays', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      let savedData: any;
      DeveloperRepository.update.mockImplementation(async (_id: string, data: any) => {
        savedData = data;
        return { ...mockProfile, ...data };
      });
      await updateProfile('u1', {
        expertise: {
          coreStack: [
            { name: 'Next.js', level: 'SENIOR_EXPERT', years: 6 },
            { name: 'Node.js', level: 'CONFIRME' },
            { name: 'PostgreSQL', level: 'CONFIRME' },
          ],
          domains: ['FinTech / Paiement', 'SaaS B2B'],
        },
      });
      expect(savedData.expertise.coreStack).toHaveLength(3);
      // Dérivation : technologies = coreStack, specialties = domains
      expect(savedData.technologies).toEqual(
        expect.arrayContaining(['Next.js', 'Node.js', 'PostgreSQL'])
      );
      expect(savedData.specialties).toEqual(
        expect.arrayContaining(['FinTech / Paiement', 'SaaS B2B'])
      );
    });

    test('stores portfolioItems and certifications', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      let savedData: any;
      DeveloperRepository.update.mockImplementation(async (_id: string, data: any) => {
        savedData = data;
        return { ...mockProfile, ...data };
      });
      const portfolioItems = [
        { title: 'App livraison', imageUrl: 'http://x/1.png', linkUrl: 'https://x.app' },
      ];
      const certifications = [{ name: 'AWS Dev', issuer: 'Amazon', year: 2025 }];
      await updateProfile('u1', { portfolioItems, certifications });
      expect(savedData.portfolioItems).toEqual(portfolioItems);
      expect(savedData.certifications).toEqual(certifications);
    });
  });

  describe('computeProfileStrength', () => {
    test('empty profile scores near zero', () => {
      expect(computeProfileStrength({})).toBeLessThanOrEqual(5);
    });

    test('complete profile scores 100', () => {
      const s = computeProfileStrength({
        photo: 'http://x/p.png',
        logo: null,
        companyName: 'Dev Corp',
        description: 'Une bio suffisamment longue pour compter dans le score de confiance.',
        expertise: {
          coreStack: [
            { name: 'React', level: 'CONFIRME' },
            { name: 'Node.js', level: 'SENIOR_EXPERT' },
            { name: 'PostgreSQL', level: 'JUNIOR' },
          ],
          domains: ['SaaS B2B'],
        },
        portfolioItems: [{ title: 'Projet' }],
        certifications: [{ name: 'Certif' }],
        identityDocument: 'http://x/id.png',
      });
      expect(s).toBe(100);
    });

    test('partial profile scores proportionally', () => {
      const s = computeProfileStrength({
        photo: 'http://x/p.png',
        companyName: 'Dev Corp',
        expertise: { coreStack: [{ name: 'React' }], domains: [] },
      });
      expect(s).toBe(25); // photo 10 + nom 5 + stack partielle 10
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
