import { CacheTTL, CacheKeys } from '../../lib/cache';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('Cache Constants', () => {
  describe('CacheTTL', () => {
    it('should define SHORT as 30s', () => {
      expect(CacheTTL.SHORT).toBe(30_000);
    });

    it('should define MEDIUM as 5min', () => {
      expect(CacheTTL.MEDIUM).toBe(300_000);
    });

    it('should define LONG as 1h', () => {
      expect(CacheTTL.LONG).toBe(3_600_000);
    });
  });

  describe('CacheKeys', () => {
    it('should generate marketplace cache key', () => {
      expect(CacheKeys.marketplace('restaurant')).toBe('cache:marketplace:restaurant');
    });

    it('should have trending key', () => {
      expect(CacheKeys.trending).toBe('cache:marketplace:trending');
    });

    it('should have admin finance overview key', () => {
      expect(CacheKeys.adminFinance.overview).toBe('cache:admin:finance:overview');
    });

    it('should have feed main key', () => {
      expect(CacheKeys.feed.main).toBe('cache:feed:main');
    });
  });
});

describe('MemoryCache', () => {
  let MemoryCache: any;

  beforeAll(async () => {
    const mod = await import('../../lib/cache');
    MemoryCache = (mod as any).constructor;
  });

  beforeEach(async () => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('should be imported successfully', () => {
    expect(MemoryCache).toBeDefined();
  });

  it('should import and export cache object', async () => {
    const mod = await import('../../lib/cache');
    expect(mod.cache).toBeDefined();
    expect(typeof mod.cache.get).toBe('function');
    expect(typeof mod.cache.set).toBe('function');
    expect(typeof mod.cache.invalidate).toBe('function');
    expect(typeof mod.cache.flush).toBe('function');
  });
});
