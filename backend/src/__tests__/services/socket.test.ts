import { getIO, initSocket } from '../../services/socket';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/jwt', () => ({
  verifyAccessToken: jest
    .fn()
    .mockReturnValue({ id: 'u1', email: 'test@test.com', primaryRole: 'USER', roles: [] }),
}));
jest.mock('../../config/env', () => ({
  config: { FRONTEND_URL: 'http://localhost:3000' },
}));

const mockSocketIoServer = {
  use: jest.fn(),
  on: jest.fn(),
};

jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => mockSocketIoServer),
}));

describe('socket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.VERCEL;
  });

  describe('getIO', () => {
    it('should return null initially', () => {
      expect(getIO()).toBeNull();
    });
  });

  describe('initSocket', () => {
    it('should return null on Vercel', () => {
      process.env.VERCEL = 'true';
      jest.isolateModules(() => {
        const { initSocket: initOnVercel } = require('../../services/socket');
        const r = initOnVercel({} as any);
        expect(r).toBeNull();
      });
      delete process.env.VERCEL;
    });

    it('should initialize socket.io server', () => {
      const httpServer = { on: jest.fn() } as any;
      const io = initSocket(httpServer);
      expect(io).toBeDefined();
      expect(mockSocketIoServer.use).toHaveBeenCalled();
      expect(mockSocketIoServer.on).toHaveBeenCalled();
    });
  });
});
