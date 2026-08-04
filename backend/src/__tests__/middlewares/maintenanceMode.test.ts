import { maintenanceMode, resetMaintenanceCache } from '../../middlewares/maintenanceMode';

jest.mock('../../lib/db', () => ({
  prisma: { platformSetting: { findUnique: jest.fn() } },
}));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const { prisma } = jest.requireMock('../../lib/db') as any;

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(path: string) {
  return { path } as any;
}

describe('maintenanceMode middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMaintenanceCache();
  });

  test('renvoie 503 MAINTENANCE_MODE quand le flag est actif', async () => {
    prisma.platformSetting.findUnique.mockResolvedValue({
      key: 'maintenanceMode',
      value: true,
    });
    const res = mockRes();
    const next = jest.fn();

    await new Promise<void>((resolve) => {
      res.json.mockImplementation(() => {
        resolve();
        return res;
      });
      maintenanceMode(mockReq('/marketplace'), res, next);
    });

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'MAINTENANCE_MODE' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('laisse passer quand le flag est inactif', async () => {
    prisma.platformSetting.findUnique.mockResolvedValue({
      key: 'maintenanceMode',
      value: false,
    });
    const res = mockRes();
    const next = jest.fn();

    await new Promise<void>((resolve) => {
      maintenanceMode(mockReq('/marketplace'), res, () => {
        next();
        resolve();
      });
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('laisse toujours passer /admin /auth /health et /public/maintenance-status', async () => {
    prisma.platformSetting.findUnique.mockResolvedValue({
      key: 'maintenanceMode',
      value: true,
    });

    const paths = [
      '/admin/dashboard',
      '/auth/login',
      '/health',
      '/metrics',
      '/public/maintenance-status',
    ];
    for (const p of paths) {
      const res = mockRes();
      const next = jest.fn();
      await new Promise<void>((resolve) => {
        maintenanceMode(mockReq(p), res, () => {
          next();
          resolve();
        });
      });
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  test('gère une erreur de lecture en considérant la maintenance levée', async () => {
    prisma.platformSetting.findUnique.mockRejectedValue(new Error('db down'));
    const res = mockRes();
    const next = jest.fn();

    await new Promise<void>((resolve) => {
      maintenanceMode(mockReq('/marketplace'), res, () => {
        next();
        resolve();
      });
    });

    expect(next).toHaveBeenCalledTimes(1);
  });
});
