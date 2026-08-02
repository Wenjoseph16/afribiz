import * as health from '../../services/healthService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../config/env', () => ({ config: { UPLOAD_DIR: './uploads' } }));

const mockQueryRaw = jest.fn();
const mockCacheGet = jest.fn();

jest.mock('../../lib/db', () => ({ prisma: { $queryRaw: mockQueryRaw } }));
jest.mock('../../lib/cache', () => ({ cache: { get: mockCacheGet } }));

describe('healthService', () => {
  beforeAll(() => {
    const fs = require('fs');
    if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads', { recursive: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDatabase', () => {
    test('returns connected when db is reachable', async () => {
      mockQueryRaw.mockResolvedValue([{ 1: 1 }]);
      const r = await health.checkDatabase();
      expect(r.status).toBe('connected');
      expect(r.latencyMs).toBeGreaterThanOrEqual(0);
    });

    test('returns error when db throws', async () => {
      mockQueryRaw.mockRejectedValue(new Error('Connection refused'));
      const r = await health.checkDatabase();
      expect(r.status).toBe('error');
      expect(r.detail).toContain('Connection refused');
    });
  });

  describe('checkRedis', () => {
    test('returns connected when redis is reachable', async () => {
      mockCacheGet.mockResolvedValue(null);
      const r = await health.checkRedis();
      expect(r.status).toBe('connected');
    });

    test('returns error on unexpected error', async () => {
      mockCacheGet.mockRejectedValue(new Error('Timeout'));
      const r = await health.checkRedis();
      expect(r.status).toBe('error');
    });
  });

  describe('checkStorage', () => {
    test('returns connected when directory exists', async () => {
      const r = await health.checkStorage();
      expect(r.status).toBe('connected');
    });
  });

  describe('runAllChecks', () => {
    test('returns aggregated health status', async () => {
      mockQueryRaw.mockResolvedValue([{ 1: 1 }]);
      mockCacheGet.mockResolvedValue(null);
      const r = await health.runAllChecks();
      expect(r.database.status).toBe('connected');
      expect(r.redis.status).toBe('connected');
      expect(r.storage).toBeDefined();
      expect(r.cron.status).toBe('active');
      expect(r.isHealthy).toBe(true);
    });
  });
});
