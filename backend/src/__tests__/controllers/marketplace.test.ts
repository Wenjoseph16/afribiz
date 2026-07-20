import { mockPrisma } from '../setup';
import * as marketplaceCtrl from '../../controllers/marketplace';

jest.mock('../../services/marketplace', () => ({
  searchMarketplace: jest.fn(),
  getTrending: jest.fn(),
  getMarketplaceStats: jest.fn(),
  getSimilarBusinesses: jest.fn(),
  getProductBySlug: jest.fn(),
  getPriceDistribution: jest.fn(),
  getActiveMarketplaceAds: jest.fn(),
}));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import * as marketplaceService from '../../services/marketplace';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}

describe('marketplace controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('search', async () => {
    (marketplaceService.searchMarketplace as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });
    mockPrisma.searchLog.create.mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    marketplaceCtrl.search({ query: { q: 'phone', page: '1' } } as any, res, next);
    await flush();
    expect(marketplaceService.searchMarketplace).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('trending', async () => {
    (marketplaceService.getTrending as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    marketplaceCtrl.trending({} as any, res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('stats', async () => {
    (marketplaceService.getMarketplaceStats as jest.Mock).mockResolvedValue({ total: 100 });
    const res = mockRes();
    const next = jest.fn();
    marketplaceCtrl.stats({} as any, res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('similar', async () => {
    (marketplaceService.getSimilarBusinesses as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    marketplaceCtrl.similar({ params: { id: 'p1' }, query: { limit: '6' } } as any, res, next);
    await flush();
    expect(marketplaceService.getSimilarBusinesses).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('productBySlug', async () => {
    (marketplaceService.getProductBySlug as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    const next = jest.fn();
    marketplaceCtrl.productBySlug({ params: { slug: 'my-product' } } as any, res, next);
    await flush();
    expect(marketplaceService.getProductBySlug).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('priceDistribution', async () => {
    (marketplaceService.getPriceDistribution as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    marketplaceCtrl.priceDistribution({ query: {} } as any, res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('activeAds', async () => {
    (marketplaceService.getActiveMarketplaceAds as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    marketplaceCtrl.activeAds({ query: {} } as any, res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
