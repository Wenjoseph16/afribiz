import { metricsMiddleware, metricsHandler, trackDbQuery } from '../../middlewares/metrics';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('metricsMiddleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/test',
      route: { path: '/api/test' },
      user: { id: 'user-1' },
    };
    mockRes = { on: jest.fn(), statusCode: 200 };
    mockNext = jest.fn();
  });

  it('should listen for finish event', () => {
    metricsMiddleware(mockReq, mockRes, mockNext);
    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('metricsHandler', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = {};
    mockRes = { set: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
  });

  it('should return Prometheus-style metrics', () => {
    metricsHandler(mockReq, mockRes);
    expect(mockRes.set).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('http_requests_total'));
    expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('process_uptime_seconds'));
    expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('active_users'));
  });
});

describe('trackDbQuery', () => {
  it('should track query duration', () => {
    expect(() => trackDbQuery(42)).not.toThrow();
    expect(() => trackDbQuery(100)).not.toThrow();
  });

  it('should not throw with large number of queries', () => {
    for (let i = 0; i < 2000; i++) trackDbQuery(i);
    expect(() => trackDbQuery(1)).not.toThrow();
  });
});
