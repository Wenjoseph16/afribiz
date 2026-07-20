jest.mock('../../services/voiceCatalogueService', () => ({
  listVoiceCommands: jest.fn(),
  createVoiceCommand: jest.fn(),
  updateVoiceCommand: jest.fn(),
  deleteVoiceCommand: jest.fn(),
  listVoiceQueries: jest.fn(),
  createVoiceQuery: jest.fn(),
  getVoiceStats: jest.fn(),
}));

import * as ctrl from '../../controllers/voiceCatalogueController';
import * as svc from '../../services/voiceCatalogueService';

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
  return { user: { id: 'u1' }, params: {}, body: {}, ...overrides } as any;
}

describe('voiceCatalogue controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listCommands (public)', () => {
    it('should list commands without auth', async () => {
      (svc.listVoiceCommands as jest.Mock).mockResolvedValue([{ id: 'c1', command: 'order' }]);
      const res = mockRes();
      ctrl.listCommands({} as any, res, jest.fn());
      await flush();
      expect(svc.listVoiceCommands).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 'c1', command: 'order' }],
      });
    });
  });

  describe('createCommand', () => {
    it('should create and return 201', async () => {
      (svc.createVoiceCommand as jest.Mock).mockResolvedValue({ id: 'c1', command: 'order' });
      const res = mockRes();
      ctrl.createCommand(req({ body: { command: 'order', action: 'ORDER' } }), res, jest.fn());
      await flush();
      expect(svc.createVoiceCommand).toHaveBeenCalledWith({ command: 'order', action: 'ORDER' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'c1', command: 'order' },
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.createCommand({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('updateCommand', () => {
    it('should update command', async () => {
      (svc.updateVoiceCommand as jest.Mock).mockResolvedValue({ id: 'c1', command: 'new' });
      const res = mockRes();
      ctrl.updateCommand(req({ params: { id: 'c1' }, body: { command: 'new' } }), res, jest.fn());
      await flush();
      expect(svc.updateVoiceCommand).toHaveBeenCalledWith('c1', { command: 'new' });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'c1', command: 'new' } });
    });
  });

  describe('deleteCommand', () => {
    it('should delete command', async () => {
      (svc.deleteVoiceCommand as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.deleteCommand(req({ params: { id: 'c1' } }), res, jest.fn());
      await flush();
      expect(svc.deleteVoiceCommand).toHaveBeenCalledWith('c1');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Commande supprimée' });
    });
  });

  describe('listQueries', () => {
    it('should list queries', async () => {
      (svc.listVoiceQueries as jest.Mock).mockResolvedValue([{ id: 'q1', query: 'test' }]);
      const res = mockRes();
      ctrl.listQueries(req(), res, jest.fn());
      await flush();
      expect(svc.listVoiceQueries).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 'q1', query: 'test' }] });
    });
  });

  describe('createQuery', () => {
    it('should create query and return 201', async () => {
      (svc.createVoiceQuery as jest.Mock).mockResolvedValue({ id: 'q1', query: 'test' });
      const res = mockRes();
      ctrl.createQuery(req({ body: { query: 'test' } }), res, jest.fn());
      await flush();
      expect(svc.createVoiceQuery).toHaveBeenCalledWith('u1', { query: 'test' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'q1', query: 'test' } });
    });
  });

  describe('stats', () => {
    it('should return stats', async () => {
      (svc.getVoiceStats as jest.Mock).mockResolvedValue({ totalQueries: 10, byAction: [] });
      const res = mockRes();
      ctrl.stats(req(), res, jest.fn());
      await flush();
      expect(svc.getVoiceStats).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { totalQueries: 10, byAction: [] },
      });
    });
  });
});
