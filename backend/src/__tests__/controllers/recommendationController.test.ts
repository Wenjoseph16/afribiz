jest.mock('../../services/recommendationService', () => ({
  getRecommendations: jest.fn(),
}));

import * as ctrl from '../../controllers/recommendationController';
import * as svc from '../../services/recommendationService';

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

describe('recommendation controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return recommendations with default type', async () => {
    const result = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    (svc.getRecommendations as jest.Mock).mockResolvedValue(result);
    const res = mockRes();
    ctrl.getRecommendations(req(), res, jest.fn());
    await flush();
    expect(svc.getRecommendations).toHaveBeenCalledWith('u1', 'PRODUCT', 1, 20);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
  });

  it('should use specified type', async () => {
    (svc.getRecommendations as jest.Mock).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
    const res = mockRes();
    ctrl.getRecommendations(
      req({ query: { type: 'EVENT', page: '2', limit: '10' } }),
      res,
      jest.fn()
    );
    await flush();
    expect(svc.getRecommendations).toHaveBeenCalledWith('u1', 'EVENT', 2, 10);
  });

  it('should return 400 for invalid type', async () => {
    const res = mockRes();
    const next = jest.fn();
    ctrl.getRecommendations(req({ query: { type: 'INVALID' } }), res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining('Type invalide'),
      })
    );
  });

  it('should use anonymous for unauthenticated requests', async () => {
    const result = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    (svc.getRecommendations as jest.Mock).mockResolvedValue(result);
    const res = mockRes();
    ctrl.getRecommendations({ query: {} } as any, res, jest.fn());
    await flush();
    expect(svc.getRecommendations).toHaveBeenCalledWith('anonymous', 'PRODUCT', 1, 20);
  });
});
