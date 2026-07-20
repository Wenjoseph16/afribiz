import { healthCheck, healthDb, healthRedis, healthStorage } from '../../controllers/health';

jest.mock('../../services/healthService', () => ({
  runAllChecks: jest.fn(),
  checkDatabase: jest.fn(),
  checkRedis: jest.fn(),
  checkStorage: jest.fn(),
}));

import {
  runAllChecks,
  checkDatabase,
  checkRedis,
  checkStorage,
} from '../../services/healthService';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}

const healthyDb = { status: 'connected', latency: 5 };
const healthyRedis = { status: 'connected', latency: 2 };
const healthyStorage = { status: 'connected', latency: 10 };
const healthyCron = { status: 'running' };
const healthyAll = {
  database: healthyDb,
  redis: healthyRedis,
  storage: healthyStorage,
  cron: healthyCron,
  isHealthy: true,
};

describe('healthCheck', () => {
  it('should return 200 when all services healthy', async () => {
    (runAllChecks as jest.Mock).mockResolvedValue(healthyAll);
    const res = mockRes();
    const next = jest.fn();
    healthCheck({} as any, res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Le serveur fonctionne' })
    );
  });

  it('should return 503 when db is down', async () => {
    (runAllChecks as jest.Mock).mockResolvedValue({
      ...healthyAll,
      database: { status: 'disconnected' },
      isHealthy: false,
    });
    const res = mockRes();
    const next = jest.fn();
    healthCheck({} as any, res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should handle service errors', async () => {
    (runAllChecks as jest.Mock).mockRejectedValue(new Error('DB crash'));
    const res = mockRes();
    const next = jest.fn();
    healthCheck({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'DB crash' }));
  });
});

describe('healthDb', () => {
  it('should return 200 when db connected', async () => {
    (checkDatabase as jest.Mock).mockResolvedValue(healthyDb);
    const res = mockRes();
    const next = jest.fn();
    healthDb({} as any, res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 503 when db disconnected', async () => {
    (checkDatabase as jest.Mock).mockResolvedValue({ status: 'disconnected' });
    const res = mockRes();
    const next = jest.fn();
    healthDb({} as any, res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(503);
  });
});

describe('healthRedis', () => {
  it('should return 200 when redis connected', async () => {
    (checkRedis as jest.Mock).mockResolvedValue(healthyRedis);
    const res = mockRes();
    const next = jest.fn();
    healthRedis({} as any, res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('healthStorage', () => {
  it('should return 200 when storage connected', async () => {
    (checkStorage as jest.Mock).mockResolvedValue(healthyStorage);
    const res = mockRes();
    const next = jest.fn();
    healthStorage({} as any, res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
