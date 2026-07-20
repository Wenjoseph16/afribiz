jest.mock('../../services/whatsappService', () => ({
  listTemplates: jest.fn(),
  createTemplate: jest.fn(),
  updateTemplate: jest.fn(),
  deleteTemplate: jest.fn(),
  listSessions: jest.fn(),
  getSessionMessages: jest.fn(),
  sendMessage: jest.fn(),
  getWhatsAppStats: jest.fn(),
}));

import * as ctrl from '../../controllers/whatsappController';
import * as svc from '../../services/whatsappService';

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
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('whatsapp controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listTemplates', () => {
    it('should list templates', async () => {
      (svc.listTemplates as jest.Mock).mockResolvedValue([{ id: 't1' }]);
      const res = mockRes();
      ctrl.listTemplates(req(), res, jest.fn());
      await flush();
      expect(svc.listTemplates).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 't1' }] });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.listTemplates({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('createTemplate', () => {
    it('should create and return 201', async () => {
      (svc.createTemplate as jest.Mock).mockResolvedValue({ id: 't1' });
      const res = mockRes();
      ctrl.createTemplate(req({ body: { name: 'Welcome' } }), res, jest.fn());
      await flush();
      expect(svc.createTemplate).toHaveBeenCalledWith('u1', { name: 'Welcome' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 't1' } });
    });
  });

  describe('updateTemplate', () => {
    it('should update template', async () => {
      (svc.updateTemplate as jest.Mock).mockResolvedValue({ id: 't1', name: 'Updated' });
      const res = mockRes();
      ctrl.updateTemplate(req({ params: { id: 't1' }, body: { name: 'Updated' } }), res, jest.fn());
      await flush();
      expect(svc.updateTemplate).toHaveBeenCalledWith('u1', 't1', { name: 'Updated' });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 't1', name: 'Updated' } });
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template', async () => {
      (svc.deleteTemplate as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.deleteTemplate(req({ params: { id: 't1' } }), res, jest.fn());
      await flush();
      expect(svc.deleteTemplate).toHaveBeenCalledWith('u1', 't1');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Template supprimé' });
    });
  });

  describe('listSessions', () => {
    it('should list sessions', async () => {
      (svc.listSessions as jest.Mock).mockResolvedValue([{ id: 's1' }]);
      const res = mockRes();
      ctrl.listSessions(req(), res, jest.fn());
      await flush();
      expect(svc.listSessions).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 's1' }] });
    });
  });

  describe('getSessionMessages', () => {
    it('should get session messages', async () => {
      (svc.getSessionMessages as jest.Mock).mockResolvedValue([{ id: 'm1' }]);
      const res = mockRes();
      ctrl.getSessionMessages(req({ params: { sessionId: 's1' } }), res, jest.fn());
      await flush();
      expect(svc.getSessionMessages).toHaveBeenCalledWith('u1', 's1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 'm1' }] });
    });
  });

  describe('sendMessage', () => {
    it('should send and return 201', async () => {
      (svc.sendMessage as jest.Mock).mockResolvedValue({ id: 'm1' });
      const res = mockRes();
      ctrl.sendMessage(req({ body: { to: '+23760000000', message: 'Hello' } }), res, jest.fn());
      await flush();
      expect(svc.sendMessage).toHaveBeenCalledWith('u1', { to: '+23760000000', message: 'Hello' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'm1' } });
    });
  });

  describe('stats', () => {
    it('should return stats', async () => {
      (svc.getWhatsAppStats as jest.Mock).mockResolvedValue({ total: 10 });
      const res = mockRes();
      ctrl.stats(req(), res, jest.fn());
      await flush();
      expect(svc.getWhatsAppStats).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { total: 10 } });
    });
  });

  describe('auth guard', () => {
    it('should return 401 for all endpoints if no user', async () => {
      const fns = [
        ctrl.listTemplates,
        ctrl.createTemplate,
        ctrl.updateTemplate,
        ctrl.deleteTemplate,
        ctrl.listSessions,
        ctrl.getSessionMessages,
        ctrl.sendMessage,
        ctrl.stats,
      ];
      for (const fn of fns) {
        const res = mockRes();
        const next = jest.fn();
        fn({} as any, res, next);
        await flush();
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
        jest.clearAllMocks();
      }
    });
  });
});
