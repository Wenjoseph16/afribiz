/**
 * Tests pour le module Business
 */

import { mockPrisma } from './setup';
import * as businessService from '../services/business';

describe('Business - Creation', () => {
  const mockBusiness = {
    id: 'biz-1',
    ownerId: 'user-1',
    name: 'Mon Business Test',
    slug: 'mon-business-test',
    type: 'RESTAURANT',
    description: 'Description test',
    modules: ['PRODUCTS', 'SERVICES'],
    isActive: true,
    isVerified: false,
    onboardingCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.business.create as jest.Mock).mockResolvedValue(mockBusiness);
    (mockPrisma.$transaction as jest.Mock).mockImplementation((fn: (tx: any) => Promise<any>) =>
      fn(mockPrisma)
    );
  });

  test('createBusiness: creates with valid data', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(null);

    const data = {
      name: 'Mon Business Test',
      type: 'RESTAURANT' as const,
      phone: '+22890123456',
      address: 'Lomé',
      country: 'Togo',
      city: 'Lomé',
      modules: ['PRODUCTS' as const, 'SERVICES' as const],
      shortDescription: 'Description test',
      latitude: 6.1319,
      longitude: 1.2228,
      logo: '',
      coverImage: '',
    };

    const result = await businessService.createBusiness('user-1', data);
    expect(result).toBeDefined();
    expect(mockPrisma.business.create).toHaveBeenCalled();
  });

  test('createBusiness: assigns default modules', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(null);

    const data = {
      name: 'Test Minimal',
      type: 'BOUTIQUE_VETEMENTS' as const,
      phone: '+22890123456',
      address: 'Lomé',
      country: 'Togo',
      city: 'Lomé',
      shortDescription: 'Description test',
      latitude: 6.1319,
      longitude: 1.2228,
      logo: '',
      coverImage: '',
      modules: ['PRODUCTS' as const],
    };

    const result = await businessService.createBusiness('user-1', data);
    expect(result).toBeDefined();
  });

  test('getMyBusiness: returns business for owner', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
      ...mockBusiness,
      owner: { id: 'user-1', firstName: 'Jean', lastName: 'Test', email: 'test@test.com' },
      settings: null,
    });

    const result = await businessService.getMyBusiness('user-1');
    expect(result).toBeDefined();
    expect(mockPrisma.business.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 'user-1', deletedAt: null },
      })
    );
  });
});
