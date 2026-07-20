import { mockPrisma } from '../setup';

jest.mock('../../lib/db', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('BusinessAccess Lib', () => {
  let resolveBusinessAccess: any;
  let getBusinessByOwner: any;

  beforeAll(async () => {
    const mod = await import('../../lib/businessAccess');
    resolveBusinessAccess = mod.resolveBusinessAccess;
    getBusinessByOwner = mod.getBusinessByOwner;
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('resolveBusinessAccess', () => {
    const baseParams = {
      userId: 'user-1',
      roles: ['BUSINESS'],
    };

    it('should return business for BUSINESS owner', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
        id: 'biz-1',
        name: 'Mon Business',
      });

      const result = await resolveBusinessAccess(baseParams);
      expect(result).toEqual({ businessId: 'biz-1', businessName: 'Mon Business' });
    });

    it('should return null if BUSINESS owner has no business', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await resolveBusinessAccess(baseParams);
      expect(result).toBeNull();
    });

    it('should resolve business for ADMIN with bodyBusinessId', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'biz-admin',
        name: 'Admin Biz',
      });

      const result = await resolveBusinessAccess({
        userId: 'admin-1',
        roles: ['ADMIN'],
        bodyBusinessId: 'biz-admin',
      });
      expect(result).toEqual({ businessId: 'biz-admin', businessName: 'Admin Biz' });
    });

    it('should fallback to ADMIN own business when no bodyBusinessId', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'biz-own',
        name: 'My Own Biz',
        latitude: null,
        longitude: null,
      });

      const result = await resolveBusinessAccess({
        userId: 'admin-1',
        roles: ['ADMIN'],
      });
      expect(result).toEqual({ businessId: 'biz-own', businessName: 'My Own Biz' });
    });

    it('should return null if no role matches', async () => {
      const result = await resolveBusinessAccess({
        userId: 'user-1',
        roles: ['UNKNOWN_ROLE'],
      });
      expect(result).toBeNull();
    });
  });

  describe('getBusinessByOwner', () => {
    it('should return business if found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'biz-1',
        name: 'Mon Business',
        latitude: 1.0,
        longitude: 1.0,
      });

      const result = await getBusinessByOwner('user-1');
      expect(result).toEqual({ id: 'biz-1', name: 'Mon Business', latitude: 1.0, longitude: 1.0 });
    });

    it('should throw AppError if business not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(getBusinessByOwner('user-1')).rejects.toThrow('Business non trouvé ou inactif');
    });
  });
});
