import { mockPrisma } from '../setup';
import { getPlatformHealth } from '../../services/copilotPlatformHealth';

describe('copilotPlatformHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getPlatformHealth returns health data', async () => {
    jest.spyOn(mockPrisma.business, 'findMany').mockResolvedValue([
      {
        id: 'biz-1',
        name: 'Biz 1',
        score: { overallScore: 800 },
        modules: ['module-a'],
        createdAt: new Date(),
      },
    ]);
    jest.spyOn(mockPrisma.business, 'count').mockResolvedValueOnce(1).mockResolvedValue(0);
    jest.spyOn(mockPrisma.developerProfile, 'count').mockResolvedValue(5);
    jest.spyOn(mockPrisma.developerModule, 'count').mockResolvedValue(10);
    jest.spyOn(mockPrisma.order, 'findFirst').mockResolvedValue({ createdAt: new Date() });
    jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(5);
    jest.spyOn(mockPrisma.product, 'groupBy').mockResolvedValue([]);
    jest.spyOn(mockPrisma.businessDailyStats, 'groupBy').mockResolvedValue([]);
    jest.spyOn(mockPrisma.developerModuleInstallation, 'count').mockResolvedValue(10);
    const result = await getPlatformHealth();
    expect(result.totalBusinesses).toBe(1);
    expect(result.averageHealthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthDistribution).toBeDefined();
    expect(result.topMissingTips).toBeDefined();
  });
});
