import { mockPrisma } from '../setup';

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((data) => ({ success: true, data })),
}));

jest.mock('../../services/simulation', () => ({
  getSimulationEnvironments: jest.fn(),
  testEndpoint: jest.fn(),
  getSimulationLogs: jest.fn(),
  getMockData: jest.fn(),
  getAvailableEndpoints: jest.fn(),
}));

import * as simulationService from '../../services/simulation';
import {
  getSimulationEnvironments,
  testEndpoint,
  getSimulationLogs,
  getMockData,
  getAvailableEndpoints,
} from '../../controllers/simulation';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.cookie = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('simulation controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSimulationEnvironments', () => {
    it('should return simulation environments', async () => {
      const mockEnvs = [
        {
          id: 'm1',
          name: 'Module Un',
          slug: 'module-un',
          version: '1.0.0',
          category: 'core',
          status: 'ready',
          apiUrl: '/api/sandbox/module-un',
          lastTested: null,
        },
      ];
      (simulationService.getSimulationEnvironments as jest.Mock).mockResolvedValue(mockEnvs);
      const res = mockRes();
      const next = jest.fn();
      getSimulationEnvironments(req(), res, next);
      await flush();
      expect(simulationService.getSimulationEnvironments).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      getSimulationEnvironments({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('testEndpoint', () => {
    it('should test an endpoint', async () => {
      const mockResult = {
        statusCode: 200,
        latency: 85,
        response: { success: true, data: { status: 'healthy' } },
        endpoint: '/health',
        method: 'GET',
        timestamp: '2025-01-01T00:00:00.000Z',
      };
      (simulationService.testEndpoint as jest.Mock).mockResolvedValue(mockResult);
      const res = mockRes();
      const next = jest.fn();
      testEndpoint(
        req({ params: { moduleSlug: 'my-module' }, body: { endpoint: '/health', method: 'GET' } }),
        res,
        next
      );
      await flush();
      expect(simulationService.testEndpoint).toHaveBeenCalledWith(
        'u1',
        'my-module',
        '/health',
        'GET',
        undefined
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      testEndpoint({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getSimulationLogs', () => {
    it('should return simulation logs', async () => {
      (simulationService.getSimulationLogs as jest.Mock).mockResolvedValue([
        { id: 'log1', action: 'tested', createdAt: '2025-01-01T00:00:00.000Z' },
      ]);
      const res = mockRes();
      const next = jest.fn();
      getSimulationLogs(req({ query: { moduleSlug: 'my-module' } }), res, next);
      await flush();
      expect(simulationService.getSimulationLogs).toHaveBeenCalledWith('u1', 'my-module');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      getSimulationLogs({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getMockData', () => {
    it('should return mock data', async () => {
      (simulationService.getMockData as jest.Mock).mockResolvedValue([
        { id: 'biz_1', name: 'Entreprise 1' },
      ]);
      const res = mockRes();
      const next = jest.fn();
      getMockData(req({ params: { moduleSlug: 'my-module', dataType: 'businesses' } }), res, next);
      await flush();
      expect(simulationService.getMockData).toHaveBeenCalledWith('u1', 'my-module', 'businesses');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      getMockData({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getAvailableEndpoints', () => {
    it('should return available endpoints', async () => {
      (simulationService.getAvailableEndpoints as jest.Mock).mockResolvedValue([
        {
          path: '/install',
          method: 'POST',
          description: 'Installer le module',
          params: { businessId: 'string (required)' },
        },
      ]);
      const res = mockRes();
      const next = jest.fn();
      getAvailableEndpoints(req(), res, next);
      await flush();
      expect(simulationService.getAvailableEndpoints).toHaveBeenCalledWith();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      getAvailableEndpoints({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
