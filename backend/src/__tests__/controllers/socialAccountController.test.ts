jest.mock('../../services/socialShareService', () => ({
  connectAccount: jest.fn(),
  disconnectAccount: jest.fn(),
  listAccounts: jest.fn(),
  updateShareSettings: jest.fn(),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/socialAccountController';
import * as sss from '../../services/socialShareService';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('socialAccount controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
  });

  describe('connectAccount', () => {
    it('should connect account', async () => {
      (sss.connectAccount as jest.Mock).mockResolvedValue({ id: 'sa1' });
      const res = mockRes();
      ctrl.connectAccount(
        req({
          body: {
            platform: 'FACEBOOK',
            accountName: 'My Page',
            accountId: '123',
            accessToken: 'tok',
          },
        }),
        res,
        jest.fn()
      );
      await flush();
      expect(sss.connectAccount).toHaveBeenCalledWith(
        'b1',
        expect.objectContaining({ platform: 'FACEBOOK', accountName: 'My Page' })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'sa1' },
        message: 'Compte connecté',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.connectAccount({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('disconnectAccount', () => {
    it('should disconnect', async () => {
      (sss.disconnectAccount as jest.Mock).mockResolvedValue({ id: 'sa1' });
      const res = mockRes();
      ctrl.disconnectAccount(req({ params: { id: 'sa1' } }), res, jest.fn());
      await flush();
      expect(sss.disconnectAccount).toHaveBeenCalledWith('b1', 'sa1');
    });
  });

  describe('listAccounts', () => {
    it('should list accounts', async () => {
      (sss.listAccounts as jest.Mock).mockResolvedValue([{ id: 'sa1' }]);
      const res = mockRes();
      ctrl.listAccounts(req(), res, jest.fn());
      await flush();
      expect(sss.listAccounts).toHaveBeenCalledWith('b1');
    });
  });

  describe('updateShareSettings', () => {
    it('should update settings', async () => {
      (sss.updateShareSettings as jest.Mock).mockResolvedValue({ id: 'sa1', autoShare: true });
      const res = mockRes();
      ctrl.updateShareSettings(
        req({ params: { id: 'sa1' }, body: { autoShare: true } }),
        res,
        jest.fn()
      );
      await flush();
      expect(sss.updateShareSettings).toHaveBeenCalledWith('b1', 'sa1', {
        autoShare: true,
        autoShareTypes: undefined,
      });
    });
  });

  describe('errors', () => {
    it('should return 404 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.listAccounts(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
