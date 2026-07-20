jest.mock('../../services/smartSearchService', () => ({
  searchMarketplace: jest.fn(),
  getSearchSuggestions: jest.fn(),
  getSearchHistory: jest.fn(),
}));

import * as ctrl from '../../controllers/smartSearchController';
import * as svc from '../../services/smartSearchService';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, query: {}, ...overrides } as any;
}

describe('smartSearch controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should search marketplace with filters', async () => {
      const result = { items: [], total: 0, facets: undefined };
      (svc.searchMarketplace as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      ctrl.search(
        req({
          query: {
            q: 'phone',
            type: 'PRODUCT',
            categoryId: 'c1',
            city: 'Yaounde',
            minPrice: '1000',
            maxPrice: '50000',
            sort: 'price_asc',
            page: '1',
            limit: '10',
          },
        }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.searchMarketplace).toHaveBeenCalledWith('phone', {
        type: 'PRODUCT',
        categoryId: 'c1',
        city: 'Yaounde',
        businessType: undefined,
        minPrice: 1000,
        maxPrice: 50000,
        sort: 'price_asc',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, ...result });
    });

    it('should handle empty search query', async () => {
      (svc.searchMarketplace as jest.Mock).mockResolvedValue({ items: [], total: 0 });
      const res = mockRes();
      ctrl.search(req({ query: {} }), res, jest.fn());
      await flush();
      expect(svc.searchMarketplace).toHaveBeenCalledWith('', {
        type: undefined,
        categoryId: undefined,
        city: undefined,
        businessType: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        sort: undefined,
        page: 1,
        limit: 20,
      });
    });

    it('should handle numeric parse safely', async () => {
      (svc.searchMarketplace as jest.Mock).mockResolvedValue({ items: [], total: 0 });
      const res = mockRes();
      ctrl.search(req({ query: { minPrice: 'abc', maxPrice: 'xyz' } }), res, jest.fn());
      await flush();
      expect(svc.searchMarketplace).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          minPrice: NaN,
          maxPrice: NaN,
        })
      );
    });
  });

  describe('suggestions', () => {
    it('should return search suggestions', async () => {
      const suggestions = [{ id: 'p1', text: 'Phone', type: 'PRODUCT' }];
      (svc.getSearchSuggestions as jest.Mock).mockResolvedValue(suggestions);
      const res = mockRes();
      ctrl.suggestions(req({ query: { q: 'pho' } }), res, jest.fn());
      await flush();
      expect(svc.getSearchSuggestions).toHaveBeenCalledWith('pho');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: suggestions });
    });

    it('should handle empty query', async () => {
      (svc.getSearchSuggestions as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.suggestions(req({ query: {} }), res, jest.fn());
      await flush();
      expect(svc.getSearchSuggestions).toHaveBeenCalledWith('');
    });
  });

  describe('getHistory', () => {
    it('should return search history for authenticated user', async () => {
      const history = [{ id: 'h1', query: 'phone', date: new Date() }];
      (svc.getSearchHistory as jest.Mock).mockResolvedValue(history);
      const res = mockRes();
      ctrl.getHistory(req(), res, jest.fn());
      await flush();
      expect(svc.getSearchHistory).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { history } });
    });

    it('should return empty for unauthenticated', async () => {
      (svc.getSearchHistory as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getHistory({} as any, res, jest.fn());
      await flush();
      expect(svc.getSearchHistory).toHaveBeenCalledWith(undefined);
    });
  });
});
