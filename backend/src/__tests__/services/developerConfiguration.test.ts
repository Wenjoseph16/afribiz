import { mockPrisma } from '../setup';
import * as devConfig from '../../services/developerConfiguration';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

const mockConfig = {
  id: 'cfg-1',
  moduleId: 'mod-1',
  businessId: 'biz-1',
  installationId: 'inst-1',
  settings: { key: 'val' },
  isActive: true,
  updatedAt: new Date(),
};
const mockBusiness = { id: 'biz-1', name: 'Biz', slug: 'biz', logo: null };

describe('developerConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveModuleConfiguration', () => {
    test('creates new configuration when none exists', async () => {
      (mockPrisma.moduleConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.moduleConfiguration.create as jest.Mock).mockResolvedValue(mockConfig);
      const r = await devConfig.saveModuleConfiguration('mod-1', 'biz-1', 'inst-1', { key: 'val' });
      expect(r.id).toBe('cfg-1');
      expect(mockPrisma.moduleConfiguration.create).toHaveBeenCalled();
    });

    test('updates existing configuration', async () => {
      (mockPrisma.moduleConfiguration.findUnique as jest.Mock).mockResolvedValue(mockConfig);
      (mockPrisma.moduleConfiguration.update as jest.Mock).mockResolvedValue(mockConfig);
      const r = await devConfig.saveModuleConfiguration('mod-1', 'biz-1', 'inst-1', { key: 'new' });
      expect(r.id).toBe('cfg-1');
      expect(mockPrisma.moduleConfiguration.update).toHaveBeenCalled();
    });
  });

  describe('getModuleConfiguration', () => {
    test('returns config when found', async () => {
      (mockPrisma.moduleConfiguration.findUnique as jest.Mock).mockResolvedValue(mockConfig);
      const r: any = await devConfig.getModuleConfiguration('mod-1', 'biz-1');
      expect(r.id).toBe('cfg-1');
    });

    test('returns default when not found', async () => {
      (mockPrisma.moduleConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
      const r = await devConfig.getModuleConfiguration('mod-1', 'biz-1');
      expect(r).toEqual({ settings: {}, isActive: false });
    });
  });

  describe('toggleModuleActive', () => {
    test('toggles active state', async () => {
      (mockPrisma.moduleConfiguration.findUnique as jest.Mock).mockResolvedValue(mockConfig);
      (mockPrisma.moduleConfiguration.update as jest.Mock).mockResolvedValue({
        ...mockConfig,
        isActive: false,
      });
      const r = await devConfig.toggleModuleActive('mod-1', 'biz-1', false);
      expect(mockPrisma.moduleConfiguration.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } })
      );
    });

    test('throws if config not found', async () => {
      (mockPrisma.moduleConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(devConfig.toggleModuleActive('mod-1', 'biz-1', true)).rejects.toThrow(
        'Configuration non trouvée'
      );
    });
  });

  describe('getModuleConfigurations', () => {
    test('returns all configs for a module', async () => {
      (mockPrisma.moduleConfiguration.findMany as jest.Mock).mockResolvedValue([
        {
          ...mockConfig,
          business: mockBusiness,
          installation: { status: 'ACTIVE', createdAt: new Date() },
        },
      ]);
      const r = await devConfig.getModuleConfigurations('mod-1');
      expect(r).toHaveLength(1);
    });
  });

  describe('getBusinessModules', () => {
    test('returns all modules for a business', async () => {
      (mockPrisma.moduleConfiguration.findMany as jest.Mock).mockResolvedValue([
        {
          ...mockConfig,
          module: {
            id: 'mod-1',
            name: 'Module',
            slug: 'module',
            logo: null,
            description: '',
            version: '1.0',
            category: 'COMMERCE',
            developer: { id: 'dev-1', companyName: 'Dev', user: { firstName: 'A', lastName: 'B' } },
          },
          installation: { status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
        },
      ]);
      const r = await devConfig.getBusinessModules('biz-1');
      expect(r).toHaveLength(1);
    });
  });
});
