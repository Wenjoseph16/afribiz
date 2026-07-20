import { mockPrisma } from '../setup';

jest.mock('../../services/portfolio', () => ({
  listPortfolioItems: jest.fn(),
  createPortfolioItem: jest.fn(),
  deletePortfolioItem: jest.fn(),
  getPortfolioStats: jest.fn(),
  listPortfolioCategories: jest.fn(),
}));

import * as portfolioCtrl from '../../controllers/portfolio';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('portfolio controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listPortfolioItems', async () => {
    const svc = jest.requireMock('../../services/portfolio');
    svc.listPortfolioItems.mockResolvedValue({ items: [], total: 0 });
    const res = mockRes();
    portfolioCtrl.listPortfolioItems(req({ query: { page: '1' } }), res, jest.fn());
    await flush();
    expect(svc.listPortfolioItems).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ page: '1' })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('listPortfolioItems returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    portfolioCtrl.listPortfolioItems({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('createPortfolioItem returns 201', async () => {
    const svc = jest.requireMock('../../services/portfolio');
    svc.createPortfolioItem.mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    portfolioCtrl.createPortfolioItem(req({ body: { title: 'Project' } }), res, jest.fn());
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('deletePortfolioItem', async () => {
    const svc = jest.requireMock('../../services/portfolio');
    svc.deletePortfolioItem.mockResolvedValue({});
    const res = mockRes();
    portfolioCtrl.deletePortfolioItem(req({ params: { id: 'p1' } }), res, jest.fn());
    await flush();
    expect(svc.deletePortfolioItem).toHaveBeenCalledWith('u1', 'p1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getPortfolioStats', async () => {
    const svc = jest.requireMock('../../services/portfolio');
    svc.getPortfolioStats.mockResolvedValue({ totalItems: 10, totalViews: 100 });
    const res = mockRes();
    portfolioCtrl.getPortfolioStats(req(), res, jest.fn());
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('listPortfolioCategories', async () => {
    const svc = jest.requireMock('../../services/portfolio');
    svc.listPortfolioCategories.mockResolvedValue([{ id: 'c1', name: 'Design' }]);
    const res = mockRes();
    portfolioCtrl.listPortfolioCategories(req(), res, jest.fn());
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
