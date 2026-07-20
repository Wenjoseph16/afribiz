import { getSeasonalOpportunities } from '../../services/copilotSeasonal';

describe('copilotSeasonal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getSeasonalOpportunities returns opportunities', async () => {
    const result = await getSeasonalOpportunities('biz-1', 'RESTAURANT');
    expect(result.businessId).toBe('biz-1');
    expect(result.opportunities.length).toBeLessThanOrEqual(5);
    expect(result.opportunities.length).toBeGreaterThanOrEqual(0);
  });

  test('getSeasonalOpportunities returns type-specific suggestions', async () => {
    const result = await getSeasonalOpportunities('biz-1', 'RETAIL');
    expect(result.businessId).toBe('biz-1');
    result.opportunities.forEach((o) => {
      expect(o.event).toBeDefined();
      expect(o.suggestion).toBeDefined();
      expect(o.action).toBeDefined();
    });
  });
});
