import { mockPrisma } from '../setup';
import { getDeveloperAnalytics } from '../../services/copilotDevAnalytics';

describe('copilotDevAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDeveloperAnalytics returns analytics', async () => {
    jest
      .spyOn(mockPrisma.developerProfile, 'findUnique')
      .mockResolvedValue({ userId: 'dev-1', companyName: 'DevCo' });
    jest.spyOn(mockPrisma.developerModule, 'findMany').mockResolvedValue([
      {
        id: 'm1',
        name: 'Module A',
        totalInstalls: 100,
        rating: 4.5,
        reviewCount: 10,
        _count: { installations: 50 },
      },
    ]);
    jest.spyOn(mockPrisma.moduleErrorLog, 'count').mockResolvedValue(2);
    jest.spyOn(mockPrisma.developerModuleInstallation, 'count').mockResolvedValue(5);
    jest
      .spyOn(mockPrisma.moduleAnalytics, 'findMany')
      .mockResolvedValue([{ apiCalls: 100, errors: 1, avgResponseTime: 200 }]);
    const result = await getDeveloperAnalytics('dev-1');
    expect(result.developerId).toBe('dev-1');
    expect(result.totalModules).toBe(1);
    expect(result.modules).toHaveLength(1);
    expect(result.overview).toBeDefined();
  });

  test('getDeveloperAnalytics handles no modules', async () => {
    jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue(null);
    jest.spyOn(mockPrisma.developerModule, 'findMany').mockResolvedValue([]);
    const result = await getDeveloperAnalytics('dev-1');
    expect(result.totalModules).toBe(0);
    expect(result.modules).toEqual([]);
  });
});
