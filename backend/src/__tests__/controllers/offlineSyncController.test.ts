jest.mock('../../services/offlineSyncService', () => ({
  listSyncItems: jest.fn(),
  createSyncItem: jest.fn(),
  processSyncItem: jest.fn(),
  getPendingSyncCount: jest.fn(),
  bulkSync: jest.fn(),
}));

import * as ctrl from '../../controllers/offlineSyncController';
import * as syncService from '../../services/offlineSyncService';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('offlineSync controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should list sync items', async () => {
      (syncService.listSyncItems as jest.Mock).mockResolvedValue([{ id: 's1' }]);
      const res = mockRes();
      ctrl.list(req({ query: { status: 'PENDING' } }), res, jest.fn());
      await flush();
      expect(syncService.listSyncItems).toHaveBeenCalledWith('u1', 'PENDING');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 's1' }] });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.list({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('create', () => {
    it('should create sync item', async () => {
      (syncService.createSyncItem as jest.Mock).mockResolvedValue({ id: 's1' });
      const res = mockRes();
      ctrl.create(req({ body: { entityType: 'ORDER', data: {} } }), res, jest.fn());
      await flush();
      expect(syncService.createSyncItem).toHaveBeenCalledWith({
        userId: 'u1',
        entityType: 'ORDER',
        data: {},
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('process', () => {
    it('should process sync item', async () => {
      (syncService.processSyncItem as jest.Mock).mockResolvedValue({ id: 's1', status: 'SYNCED' });
      const res = mockRes();
      ctrl.process(req({ params: { id: 's1' } }), res, jest.fn());
      await flush();
      expect(syncService.processSyncItem).toHaveBeenCalledWith('s1');
    });
  });

  describe('pendingCount', () => {
    it('should return pending count', async () => {
      (syncService.getPendingSyncCount as jest.Mock).mockResolvedValue(5);
      const res = mockRes();
      ctrl.pendingCount(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { count: 5 } });
    });
  });

  describe('bulkSync', () => {
    it('should bulk sync', async () => {
      (syncService.bulkSync as jest.Mock).mockResolvedValue({ synced: 3, errors: 0 });
      const res = mockRes();
      ctrl.bulkSync(req({ body: { items: [{ type: 'ORDER' }] } }), res, jest.fn());
      await flush();
      expect(syncService.bulkSync).toHaveBeenCalledWith('u1', [{ type: 'ORDER' }]);
    });
  });
});
