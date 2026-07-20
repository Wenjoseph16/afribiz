import { mockPrisma } from '../setup';
import * as autoCtrl from '../../controllers/automationController';

jest.mock('../../services/automationEngine', () => ({
  listRules: jest.fn(),
  getRule: jest.fn(),
  createRule: jest.fn(),
  updateRule: jest.fn(),
  deleteRule: jest.fn(),
  toggleRule: jest.fn(),
}));

import * as automationEngine from '../../services/automationEngine';

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

describe('automation controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getExecutionLogs', () => {
    it('should return formatted logs', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      mockPrisma.automationRule.findMany.mockResolvedValue([
        {
          id: 'r1',
          name: 'Rule 1',
          executionCount: 5,
          lastExecutedAt: new Date('2024-01-01'),
          status: 'ACTIVE',
        },
        { id: 'r2', name: 'Rule 2', executionCount: 0, lastExecutedAt: null, status: 'PAUSED' },
      ]);
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.getExecutionLogs(req(), res, next);
      await flush();
      expect(mockPrisma.business.findUnique).toHaveBeenCalledWith({
        where: { ownerId: 'u1' },
        select: { id: true },
      });
      expect(mockPrisma.automationRule.findMany).toHaveBeenCalledWith({
        where: { businessId: 'b1', executionCount: { gt: 0 } },
        select: { id: true, name: true, executionCount: true, lastExecutedAt: true, status: true },
        orderBy: { lastExecutedAt: 'desc' },
        take: 50,
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            id: 'r1',
            ruleName: 'Rule 1',
            ruleId: 'r1',
            status: 'ACTIVE',
            createdAt: expect.any(Date),
            executionCount: 5,
          },
        ],
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.getExecutionLogs({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.getExecutionLogs(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('listRules', () => {
    it('should return all rules', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      (automationEngine.listRules as jest.Mock).mockResolvedValue([{ id: 'r1', name: 'Rule 1' }]);
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.listRules(req(), res, next);
      await flush();
      expect(automationEngine.listRules).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 'r1', name: 'Rule 1' }],
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.listRules({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.listRules(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('getRule', () => {
    it('should return a rule by id', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      (automationEngine.getRule as jest.Mock).mockResolvedValue({ id: 'r1', name: 'My Rule' });
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.getRule(req({ params: { ruleId: 'r1' } }), res, next);
      await flush();
      expect(automationEngine.getRule).toHaveBeenCalledWith('b1', 'r1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'r1', name: 'My Rule' } });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.getRule({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.getRule(req({ params: { ruleId: 'r1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('createRule', () => {
    const ruleData = {
      name: 'New Rule',
      description: 'Desc',
      trigger: 'ON_DEAL_WON',
      conditions: [],
      actionType: 'SEND_NOTIFICATION',
      actionConfig: {},
    };

    it('should create and return 201', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      (automationEngine.createRule as jest.Mock).mockResolvedValue({ id: 'r1', ...ruleData });
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.createRule(req({ body: ruleData }), res, next);
      await flush();
      expect(automationEngine.createRule).toHaveBeenCalledWith('b1', ruleData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'r1', ...ruleData } });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.createRule({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.createRule(req({ body: ruleData }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('updateRule', () => {
    const updateData = {
      name: 'Updated',
      actionType: 'MOVE_DEAL',
      actionConfig: { stageId: 's1' },
    };

    it('should update and return the rule', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      (automationEngine.updateRule as jest.Mock).mockResolvedValue({ id: 'r1', name: 'Updated' });
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.updateRule(req({ params: { ruleId: 'r1' }, body: updateData }), res, next);
      await flush();
      expect(automationEngine.updateRule).toHaveBeenCalledWith('b1', 'r1', updateData);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'r1', name: 'Updated' } });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.updateRule({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.updateRule(req({ params: { ruleId: 'r1' }, body: updateData }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('deleteRule', () => {
    it('should delete and return null', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      (automationEngine.deleteRule as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.deleteRule(req({ params: { ruleId: 'r1' } }), res, next);
      await flush();
      expect(automationEngine.deleteRule).toHaveBeenCalledWith('b1', 'r1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: null });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.deleteRule({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.deleteRule(req({ params: { ruleId: 'r1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('toggleRule', () => {
    it('should toggle and return the updated rule', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      (automationEngine.toggleRule as jest.Mock).mockResolvedValue({ id: 'r1', status: 'PAUSED' });
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.toggleRule(req({ params: { ruleId: 'r1' } }), res, next);
      await flush();
      expect(automationEngine.toggleRule).toHaveBeenCalledWith('b1', 'r1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'r1', status: 'PAUSED' },
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.toggleRule({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      autoCtrl.toggleRule(req({ params: { ruleId: 'r1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
