import { createRouter, addRouteHelpers } from '../../middlewares/createRouter';

jest.mock('../../middlewares/auth', () => ({
  authMiddleware: jest.fn((_req, _res, next) => next()),
  requireRole: jest.fn(() => (_req: any, _res: any, next: any) => next()),
}));

jest.mock('../../middlewares/cacheMiddleware', () => ({
  cacheResponse: jest.fn(() => (_req: any, _res: any, next: any) => next()),
}));

jest.mock('../../middlewares/validators', () => ({
  validateBody: jest.fn(() => (_req: any, _res: any, next: any) => next()),
  validateQuery: jest.fn(() => (_req: any, _res: any, next: any) => next()),
}));

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('createRouter', () => {
  it('should create a basic router', () => {
    const router = createRouter();
    expect(router).toBeDefined();
    expect(typeof router.get).toBe('function');
    expect(typeof router.post).toBe('function');
  });

  it('should apply auth middleware when requireAuth is true', () => {
    const router = createRouter({ requireAuth: true });
    expect(router).toBeDefined();
  });

  it('should apply role middleware when roles specified', () => {
    const router = createRouter({ roles: ['ADMIN'] });
    expect(router).toBeDefined();
  });
});

describe('addRouteHelpers', () => {
  it('should add pget, ppost, pput, ppatch, pdelete helpers', () => {
    const router = createRouter();
    expect(typeof (router as any).pget).toBe('function');
    expect(typeof (router as any).ppost).toBe('function');
    expect(typeof (router as any).pput).toBe('function');
    expect(typeof (router as any).ppatch).toBe('function');
    expect(typeof (router as any).pdelete).toBe('function');
  });

  it('should register routes via pget', () => {
    const router = createRouter();
    const handler = jest.fn();
    (router as any).pget('/test', handler);
    expect(router.stack.some((layer: any) => layer.route?.path === '/test')).toBe(true);
  });

  it('should register routes via ppost', () => {
    const router = createRouter();
    const handler = jest.fn();
    (router as any).ppost('/test', handler);
    expect(router.stack.some((layer: any) => layer.route?.path === '/test')).toBe(true);
  });

  it('should register routes via pput', () => {
    const router = createRouter();
    const handler = jest.fn();
    (router as any).pput('/test', handler);
    expect(router.stack.some((layer: any) => layer.route?.path === '/test')).toBe(true);
  });

  it('should register routes via ppatch', () => {
    const router = createRouter();
    const handler = jest.fn();
    (router as any).ppatch('/test', handler);
    expect(router.stack.some((layer: any) => layer.route?.path === '/test')).toBe(true);
  });

  it('should register routes via pdelete', () => {
    const router = createRouter();
    const handler = jest.fn();
    (router as any).pdelete('/test', handler);
    expect(router.stack.some((layer: any) => layer.route?.path === '/test')).toBe(true);
  });
});
