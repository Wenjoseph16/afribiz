import { mockPrisma } from '../setup';
import * as attentionCtrl from '../../controllers/attentionController';

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((data) => ({ success: true, data })),
}));

jest.mock('../../services/attentionService', () => ({
  getAttentionItems: jest.fn(),
}));

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides = {}) {
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, ...overrides } as any;
}

function mockGetAttentionItems() {
  return (jest.requireMock('../../services/attentionService') as any)
    .getAttentionItems as jest.Mock;
}

describe('attention controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAttentionCenter', () => {
    it('should return attention items when businessId is provided', async () => {
      const data = { items: [], criticalCount: 0, highCount: 0, totalCount: 0 };
      mockGetAttentionItems().mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      attentionCtrl.getAttentionCenter(req({ query: { businessId: 'b1' } }), res, next);
      await flush();
      expect(mockGetAttentionItems()).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      attentionCtrl.getAttentionCenter({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 400 if businessId is missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      attentionCtrl.getAttentionCenter(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('getUrgencyStatus', () => {
    it('should return ATTENTION_REQUIRED when criticalCount > 0', async () => {
      mockGetAttentionItems().mockResolvedValue({
        criticalCount: 1,
        highCount: 0,
        totalCount: 5,
      });
      const res = mockRes();
      const next = jest.fn();
      attentionCtrl.getUrgencyStatus(req({ query: { businessId: 'b1' } }), res, next);
      await flush();
      expect(mockGetAttentionItems()).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { status: 'ATTENTION_REQUIRED', criticalCount: 1, highCount: 0, totalCount: 5 },
      });
    });

    it('should return ATTENTION_REQUIRED when highCount > 5', async () => {
      mockGetAttentionItems().mockResolvedValue({
        criticalCount: 0,
        highCount: 6,
        totalCount: 10,
      });
      const res = mockRes();
      const next = jest.fn();
      attentionCtrl.getUrgencyStatus(req({ query: { businessId: 'b1' } }), res, next);
      await flush();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { status: 'ATTENTION_REQUIRED', criticalCount: 0, highCount: 6, totalCount: 10 },
      });
    });

    it('should return NORMAL when no urgency', async () => {
      mockGetAttentionItems().mockResolvedValue({
        criticalCount: 0,
        highCount: 0,
        totalCount: 5,
      });
      const res = mockRes();
      const next = jest.fn();
      attentionCtrl.getUrgencyStatus(req({ query: { businessId: 'b1' } }), res, next);
      await flush();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { status: 'NORMAL', criticalCount: 0, highCount: 0, totalCount: 5 },
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      attentionCtrl.getUrgencyStatus({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 400 if businessId is missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      attentionCtrl.getUrgencyStatus(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });
});
