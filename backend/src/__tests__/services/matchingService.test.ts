import { mockPrisma } from '../setup';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

import {
  getDevMatches,
  getBusinessMatches,
  getBizForDevMatches,
} from '../../services/matchingService';

function flush() {
  return new Promise((r) => setImmediate(r));
}

const mockBusiness = {
  id: 'b1',
  type: 'RESTAURANT',
  city: 'Douala',
  country: 'Cameroun',
  skills: ['php', 'pos'],
  modules: [],
};
const mockDevProfile = {
  id: 'dev1',
  userId: 'u1',
  companyName: 'DevCo',
  description: 'Dev shop',
  logo: null,
  country: 'Cameroun',
  city: 'Douala',
  skills: ['php', 'react'],
  specialties: ['pos'],
  technologies: ['laravel'],
  experience: 5,
  rating: 4.5,
  reviewCount: 10,
  isVerified: true,
};

describe('matchingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDevMatches', () => {
    it('should return empty if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const result = await getDevMatches('invalid');
      expect(result).toEqual([]);
    });

    it('should return scored matches for valid business', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.developerProfile.findMany.mockResolvedValue([mockDevProfile]);
      mockPrisma.developerModule.findMany.mockResolvedValue([
        {
          id: 'm1',
          developerId: 'dev1',
          name: 'POS Pro',
          slug: 'pos-pro',
          price: 50000,
          category: 'RESTAURANT',
          tags: ['pos', 'restaurant'],
          isActive: true,
          isPublished: true,
        },
      ]);

      const result = await getDevMatches('b1', 10);
      await flush();
      expect(result).toHaveLength(1);
      expect(result[0].developerId).toBe('dev1');
      expect(result[0].matchingScore).toBeGreaterThanOrEqual(20);
      expect(result[0].matchReasons.length).toBeGreaterThan(0);
    });

    it('should filter low-score matches', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: 'b1',
        type: 'RESTAURANT',
        city: '',
        country: '',
        skills: [],
        modules: [],
      });
      mockPrisma.developerProfile.findMany.mockResolvedValue([
        {
          ...mockDevProfile,
          skills: [],
          specialties: [],
          technologies: [],
          experience: 0,
          rating: 0,
          isVerified: false,
        },
      ]);
      mockPrisma.developerModule.findMany.mockResolvedValue([]);

      const result = await getDevMatches('b1');
      expect(result).toEqual([]);
    });
  });

  describe('getBusinessMatches', () => {
    it('should return empty if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const result = await getBusinessMatches('invalid');
      expect(result).toEqual([]);
    });

    it('should return complementary business matches', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.business.findMany.mockResolvedValue([
        {
          id: 'b2',
          name: 'FastFood',
          slug: 'ff',
          type: 'FAST_FOOD',
          description: '',
          logo: null,
          city: 'Douala',
          country: 'Cameroun',
          rating: 4.2,
          reviewCount: 20,
          isVerified: true,
          isPremium: false,
        },
      ]);
      mockPrisma.partner.groupBy.mockResolvedValue([]);
      mockPrisma.businessScore.findMany.mockResolvedValue([]);

      const result = await getBusinessMatches('b1', 10);
      await flush();
      expect(result).toHaveLength(1);
      expect(result[0].businessId).toBe('b2');
      expect(result[0].matchingScore).toBeGreaterThanOrEqual(25);
    });

    it('should return empty for non-matching candidates', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.business.findMany.mockResolvedValue([]);
      mockPrisma.partner.groupBy.mockResolvedValue([]);
      mockPrisma.businessScore.findMany.mockResolvedValue([]);

      const result = await getBusinessMatches('b1');
      expect(result).toEqual([]);
    });
  });

  describe('getBizForDevMatches', () => {
    it('should return empty if developer not found', async () => {
      mockPrisma.developerProfile.findUnique.mockResolvedValue(null);
      const result = await getBizForDevMatches('invalid');
      expect(result).toEqual([]);
    });

    it('should return businesses matching dev skills', async () => {
      mockPrisma.developerProfile.findUnique.mockResolvedValue({
        id: 'dev1',
        userId: 'u1',
        skills: ['php', 'react'],
        specialties: ['pos'],
        technologies: ['laravel'],
        city: 'Douala',
      });
      mockPrisma.business.findMany.mockResolvedValue([
        {
          id: 'b1',
          name: 'Biz',
          slug: 'biz',
          type: 'RESTAURANT',
          description: '',
          logo: null,
          city: 'Douala',
          country: 'Cameroun',
          rating: 4,
          reviewCount: 5,
          isVerified: true,
          isPremium: false,
          skills: ['php'],
        },
      ]);
      mockPrisma.businessScore.findMany.mockResolvedValue([]);
      mockPrisma.developerModuleInstallation.findMany.mockResolvedValue([]);

      const result = await getBizForDevMatches('dev1', 10);
      await flush();
      expect(result).toHaveLength(1);
      expect(result[0].businessId).toBe('b1');
      expect(result[0].matchingScore).toBeGreaterThanOrEqual(20);
    });

    it('should penalize businesses with installed modules', async () => {
      mockPrisma.developerProfile.findUnique.mockResolvedValue({
        id: 'dev1',
        userId: 'u1',
        skills: ['php'],
        specialties: [],
        technologies: [],
        city: '',
      });
      mockPrisma.business.findMany.mockResolvedValue([
        {
          id: 'b1',
          name: 'Biz',
          slug: 'biz',
          type: 'RESTAURANT',
          description: '',
          logo: null,
          city: '',
          country: '',
          rating: 3,
          reviewCount: 1,
          isVerified: false,
          isPremium: false,
          skills: ['php'],
        },
      ]);
      mockPrisma.businessScore.findMany.mockResolvedValue([]);
      mockPrisma.developerModuleInstallation.findMany.mockResolvedValue([{ businessId: 'b1' }]);

      const result = await getBizForDevMatches('dev1');
      await flush();
      expect(result).toHaveLength(0);
    });
  });
});
