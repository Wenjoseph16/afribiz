import { mockPrisma } from '../setup';
import {
  logActivity,
  getModuleActivity,
  getDeveloperActivity,
  getBusinessActivity,
  getActivityStats,
} from '../../services/developerActivityLog';

describe('developerActivityLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logActivity creates activity log', async () => {
    jest.spyOn(mockPrisma.moduleActivityLog, 'create').mockResolvedValue({ id: 'al-1' });
    const result = await logActivity('u1', 'm1', 'INSTALL', {
      businessId: 'biz-1',
      description: 'Module installed',
    });
    expect(result).toBeDefined();
  });

  test('getModuleActivity returns activity feed', async () => {
    jest.spyOn(mockPrisma.moduleActivityLog, 'findMany').mockResolvedValue([
      {
        id: 'al-1',
        activityType: 'INSTALL',
        description: 'Installed',
        business: { id: 'biz-1', name: 'Biz', slug: 'biz', logo: null },
      },
    ]);
    const result = await getModuleActivity('m1', 10);
    expect(result).toHaveLength(1);
  });

  test('getDeveloperActivity returns developer activity', async () => {
    jest.spyOn(mockPrisma.moduleActivityLog, 'findMany').mockResolvedValue([
      {
        id: 'al-1',
        activityType: 'INSTALL',
        module: { id: 'm1', name: 'Mod', slug: 'mod' },
        business: { id: 'biz-1', name: 'Biz', slug: 'biz' },
      },
    ]);
    const result = await getDeveloperActivity('dev-1', 10);
    expect(result).toHaveLength(1);
  });

  test('getBusinessActivity returns business activity', async () => {
    jest.spyOn(mockPrisma.moduleActivityLog, 'findMany').mockResolvedValue([
      {
        id: 'al-1',
        activityType: 'INSTALL',
        module: { id: 'm1', name: 'Mod', slug: 'mod', logo: null },
      },
    ]);
    const result = await getBusinessActivity('biz-1', 10);
    expect(result).toHaveLength(1);
  });

  test('getActivityStats returns stats', async () => {
    jest.spyOn(mockPrisma.moduleActivityLog, 'count').mockResolvedValue(50);
    jest
      .spyOn(mockPrisma.moduleActivityLog, 'groupBy')
      .mockResolvedValue([{ activityType: 'INSTALL', _count: 30 }]);
    jest.spyOn(mockPrisma.moduleActivityLog, 'findMany').mockResolvedValue([{ id: 'al-1' }]);
    const result = await getActivityStats('m1');
    expect(result.total).toBe(50);
    expect(result.byType).toHaveLength(1);
  });
});
