import { mockPrisma } from '../setup';

jest.mock('../../services/notificationTemplateService', () => ({
  notificationTemplateService: {
    getTemplates: jest.fn(),
    upsertTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    toggleTemplate: jest.fn(),
    getAvailableTypes: jest.fn(),
  },
}));

import * as ctrl from '../../controllers/notificationTemplate';
import { notificationTemplateService } from '../../services/notificationTemplateService';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, query: {}, body: {}, ...overrides } as any;
}

describe('notificationTemplate controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTemplates', () => {
    it('should return templates for businessId', async () => {
      const data = [{ id: 't1', type: 'ORDER_CONFIRMATION' }];
      (notificationTemplateService.getTemplates as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.getTemplates(req({ query: { businessId: 'b1' } }), res, jest.fn());
      await flush();
      expect(notificationTemplateService.getTemplates).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should return 400 if businessId missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getTemplates(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('upsertTemplate', () => {
    it('should upsert template successfully', async () => {
      const data = { id: 't1', customTitle: 'New' };
      (notificationTemplateService.upsertTemplate as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.upsertTemplate(
        req({
          params: { businessId: 'b1' },
          body: { type: 'ORDER_CONFIRMATION', customTitle: 'New' },
        }),
        res,
        jest.fn()
      );
      await flush();
      expect(notificationTemplateService.upsertTemplate).toHaveBeenCalledWith(
        'b1',
        'u1',
        'ORDER_CONFIRMATION',
        { customTitle: 'New', customDescription: undefined, isActive: undefined }
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should return 400 if type or customTitle missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.upsertTemplate(req({ params: { businessId: 'b1' }, body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template', async () => {
      (notificationTemplateService.deleteTemplate as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.deleteTemplate(
        req({ params: { businessId: 'b1' }, query: { type: 'ORDER_CONFIRMATION' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(notificationTemplateService.deleteTemplate).toHaveBeenCalledWith(
        'b1',
        'u1',
        'ORDER_CONFIRMATION'
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: null });
    });

    it('should return 400 if type missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.deleteTemplate(req({ params: { businessId: 'b1' }, query: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('toggleTemplate', () => {
    it('should toggle template', async () => {
      (notificationTemplateService.toggleTemplate as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.toggleTemplate(
        req({ params: { businessId: 'b1' }, body: { type: 'ORDER_CONFIRMATION', isActive: true } }),
        res,
        jest.fn()
      );
      await flush();
      expect(notificationTemplateService.toggleTemplate).toHaveBeenCalledWith(
        'b1',
        'u1',
        'ORDER_CONFIRMATION',
        true
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: null });
    });

    it('should return 400 if type missing or isActive not boolean', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.toggleTemplate(
        req({
          params: { businessId: 'b1' },
          body: { type: 'ORDER_CONFIRMATION', isActive: 'yes' },
        }),
        res,
        next
      );
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('getAvailableTypes', () => {
    it('should return available types', async () => {
      const types = ['ORDER_CONFIRMATION', 'SHIPPING_UPDATE'];
      (notificationTemplateService.getAvailableTypes as jest.Mock).mockResolvedValue(types);
      const res = mockRes();
      ctrl.getAvailableTypes(req(), res, jest.fn());
      await flush();
      expect(notificationTemplateService.getAvailableTypes).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: types });
    });
  });
});
