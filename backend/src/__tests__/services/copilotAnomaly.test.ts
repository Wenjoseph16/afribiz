import { mockPrisma } from '../setup';
import { detectAnomalies } from '../../services/copilotAnomaly';

describe('copilotAnomaly', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('detectAnomalies returns empty when no change', async () => {
    jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(5);
    jest.spyOn(mockPrisma.businessReview, 'count').mockResolvedValue(2);
    jest.spyOn(mockPrisma.businessPageView, 'count').mockResolvedValue(100);
    jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(3);
    const result = await detectAnomalies('biz-1');
    expect(result.businessId).toBe('biz-1');
    expect(result.anomalies).toEqual([]);
  });

  test('detectAnomalies detects critical drop', async () => {
    jest.spyOn(mockPrisma.order, 'count').mockResolvedValueOnce(10).mockResolvedValueOnce(100);
    jest.spyOn(mockPrisma.businessReview, 'count').mockResolvedValue(5);
    jest.spyOn(mockPrisma.businessPageView, 'count').mockResolvedValue(200);
    jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(10);
    const result = await detectAnomalies('biz-1');
    expect(result.anomalies.length).toBeGreaterThan(0);
    expect(result.anomalies[0].direction).toBe('down');
  });

  test('detectAnomalies returns empty when values are zero', async () => {
    jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(0);
    jest.spyOn(mockPrisma.businessReview, 'count').mockResolvedValue(0);
    jest.spyOn(mockPrisma.businessPageView, 'count').mockResolvedValue(0);
    jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(0);
    const result = await detectAnomalies('biz-1');
    expect(result.anomalies).toEqual([]);
  });
});
