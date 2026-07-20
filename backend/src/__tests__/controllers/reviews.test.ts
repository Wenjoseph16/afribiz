import * as reviewCtrl from '../../controllers/reviews';

jest.mock('../../services/reviewService', () => ({
  createReview: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
  getReviews: jest.fn(),
}));

import * as reviewService from '../../services/reviewService';

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

describe('reviews controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createReview returns 201', async () => {
    (reviewService.createReview as jest.Mock).mockResolvedValue({ id: 'r1' });
    const res = mockRes();
    const next = jest.fn();
    reviewCtrl.createReview(req({ body: { productId: 'p1', rating: 5 } }), res, next);
    await flush();
    expect(reviewService.createReview).toHaveBeenCalledWith('u1', { productId: 'p1', rating: 5 });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateReview', async () => {
    (reviewService.updateReview as jest.Mock).mockResolvedValue({ id: 'r1', rating: 4 });
    const res = mockRes();
    const next = jest.fn();
    reviewCtrl.updateReview(req({ params: { id: 'r1' }, body: { rating: 4 } }), res, next);
    await flush();
    expect(reviewService.updateReview).toHaveBeenCalledWith('u1', 'r1', { rating: 4 });
  });

  it('deleteReview', async () => {
    (reviewService.deleteReview as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    reviewCtrl.deleteReview(req({ params: { id: 'r1' } }), res, next);
    await flush();
    expect(reviewService.deleteReview).toHaveBeenCalledWith('u1', 'r1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getReviews', async () => {
    (reviewService.getReviews as jest.Mock).mockResolvedValue({ data: [], total: 0 });
    const res = mockRes();
    const next = jest.fn();
    reviewCtrl.getReviews(req({ query: { productId: 'p1', page: '1', limit: '10' } }), res, next);
    await flush();
    expect(reviewService.getReviews).toHaveBeenCalledWith({
      productId: 'p1',
      userId: undefined,
      serviceId: undefined,
      page: 1,
      limit: 10,
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 401 if no user on createReview', async () => {
    const res = mockRes();
    const next = jest.fn();
    reviewCtrl.createReview({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
