import { cacheResponse, invalidateCache } from '../../middlewares/cacheMiddleware';

jest.mock('../../lib/cache', () => ({
  cache: { get: jest.fn(), set: jest.fn().mockResolvedValue(undefined), invalidate: jest.fn() },
  CacheTTL: { SHORT: 30000, MEDIUM: 60000, LONG: 300000 },
}));

const { cache } = jest.requireMock('../../lib/cache') as any;

describe('cacheResponse', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = { method: 'GET', originalUrl: '/api/test', query: {} };
    mockRes = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };
    jest.clearAllMocks();
  });

  it('should skip non-GET requests', () => {
    const next = jest.fn();
    mockReq.method = 'POST';
    cacheResponse({ prefix: 'test' })(mockReq, mockRes, next);
    expect(next).toHaveBeenCalled();
  });

  it('should serve cached response if available', async () => {
    const next = jest.fn();
    cache.get.mockResolvedValue({ data: 'cached' });
    await cacheResponse({ prefix: 'test' })(mockReq, mockRes, next);
    expect(mockRes.json).toHaveBeenCalledWith({ data: 'cached' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should proceed on cache miss', async () => {
    const next = jest.fn();
    cache.get.mockResolvedValue(null);
    await cacheResponse({ prefix: 'test' })(mockReq, mockRes, next);
    expect(next).toHaveBeenCalled();
  });

  it('should bypass cache with refresh', async () => {
    const next = jest.fn();
    mockReq.query.cache = 'refresh';
    await cacheResponse({ prefix: 'test' })(mockReq, mockRes, next);
    expect(cache.get).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should cache 2xx responses', async () => {
    const next = jest.fn();
    cache.get.mockResolvedValue(null);
    await cacheResponse({ prefix: 'test', ttl: 60000 })(mockReq, mockRes, next);
    mockRes.json({ data: 'fresh' });
    expect(cache.set).toHaveBeenCalledWith(
      expect.stringContaining('test:'),
      { data: 'fresh' },
      60000
    );
  });

  it('should handle cache errors', async () => {
    const next = jest.fn();
    cache.get.mockRejectedValue(new Error('cache down'));
    await cacheResponse({ prefix: 'test' })(mockReq, mockRes, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('invalidateCache', () => {
  it('should invalidate by pattern', async () => {
    const next = jest.fn();
    cache.invalidate.mockResolvedValue(undefined);
    await invalidateCache('products')({} as any, {} as any, next);
    expect(cache.invalidate).toHaveBeenCalledWith('products:*');
    expect(next).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const next = jest.fn();
    cache.invalidate.mockRejectedValue(new Error('error'));
    await invalidateCache('products')({} as any, {} as any, next);
    expect(next).toHaveBeenCalled();
  });
});
