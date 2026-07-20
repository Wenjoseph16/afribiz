import { mockPrisma } from '../setup';
import {
  listRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  evaluateTriggers,
} from '../../services/automationEngine';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockRule = {
  id: 'r1',
  businessId: 'b1',
  name: 'Rule 1',
  description: 'Desc',
  trigger: 'ORDER_CREATED',
  conditions: [],
  actionType: 'SEND_NOTIFICATION',
  actionConfig: { notificationTitle: 'Alert', notificationBody: 'Body' },
  triggerConfig: {},
  status: 'ACTIVE',
  executionCount: 5,
  lastExecutedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('automationEngine', () => {
  beforeEach(() => {
    /* cleared by config.clearMocks */
  });

  describe('listRules', () => {
    test('returns rules for business', async () => {
      jest.spyOn(mockPrisma.automationRule, 'findMany').mockResolvedValue([mockRule]);
      const r = await listRules('b1');
      expect(r).toHaveLength(1);
    });
  });

  describe('getRule', () => {
    test('returns rule by id', async () => {
      jest.spyOn(mockPrisma.automationRule, 'findFirst').mockResolvedValue(mockRule);
      const r = await getRule('b1', 'r1');
      expect(r.name).toBe('Rule 1');
    });

    test('throws if not found', async () => {
      jest.spyOn(mockPrisma.automationRule, 'findFirst').mockResolvedValue(null);
      await expect(getRule('b1', 'r1')).rejects.toThrow("Règle d'automatisation non trouvée");
    });
  });

  describe('createRule', () => {
    test('creates a rule', async () => {
      jest.spyOn(mockPrisma.automationRule, 'create').mockResolvedValue(mockRule);
      const r = await createRule('b1', {
        name: 'Rule 1',
        trigger: 'ORDER_CREATED',
        actionType: 'SEND_NOTIFICATION',
        actionConfig: {},
      });
      expect(r.name).toBe('Rule 1');
    });
  });

  describe('updateRule', () => {
    test('updates a rule', async () => {
      jest.spyOn(mockPrisma.automationRule, 'findFirst').mockResolvedValue(mockRule);
      jest
        .spyOn(mockPrisma.automationRule, 'update')
        .mockResolvedValue({ ...mockRule, name: 'Updated' });
      const r = await updateRule('b1', 'r1', { name: 'Updated' });
      expect(r.name).toBe('Updated');
    });
  });

  describe('deleteRule', () => {
    test('deletes a rule', async () => {
      jest.spyOn(mockPrisma.automationRule, 'findFirst').mockResolvedValue(mockRule);
      jest.spyOn(mockPrisma.automationRule, 'delete').mockResolvedValue(mockRule);
      await deleteRule('b1', 'r1');
      expect(mockPrisma.automationRule.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    });
  });

  describe('toggleRule', () => {
    test('toggles ACTIVE to PAUSED', async () => {
      jest.spyOn(mockPrisma.automationRule, 'findFirst').mockResolvedValue(mockRule);
      jest
        .spyOn(mockPrisma.automationRule, 'update')
        .mockResolvedValue({ ...mockRule, status: 'PAUSED' });
      const r = await toggleRule('b1', 'r1');
      expect(r.status).toBe('PAUSED');
    });

    test('toggles PAUSED to ACTIVE', async () => {
      jest
        .spyOn(mockPrisma.automationRule, 'findFirst')
        .mockResolvedValue({ ...mockRule, status: 'PAUSED' });
      jest
        .spyOn(mockPrisma.automationRule, 'update')
        .mockResolvedValue({ ...mockRule, status: 'ACTIVE' });
      const r = await toggleRule('b1', 'r1');
      expect(r.status).toBe('ACTIVE');
    });
  });

  describe('evaluateTriggers', () => {
    test('executes SEND_NOTIFICATION action', async () => {
      jest.spyOn(mockPrisma.automationRule, 'findMany').mockResolvedValue([mockRule]);
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ ownerId: 'u1' } as any);
      jest.spyOn(mockPrisma.notification, 'create').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.automationRule, 'update').mockResolvedValue(mockRule);

      await evaluateTriggers('b1', 'ORDER_CREATED', { orderId: 'o1' });
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    test('executes MOVE_DEAL action', async () => {
      const moveRule = { ...mockRule, actionType: 'MOVE_DEAL', actionConfig: { stageId: 's2' } };
      jest.spyOn(mockPrisma.automationRule, 'findMany').mockResolvedValue([moveRule]);
      jest.spyOn(mockPrisma.deal, 'update').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.automationRule, 'update').mockResolvedValue(moveRule);

      await evaluateTriggers('b1', 'ORDER_CREATED', { dealId: 'd1' });
      expect(mockPrisma.deal.update).toHaveBeenCalled();
    });

    test('executes CHANGE_PROBABILITY action', async () => {
      const probRule = {
        ...mockRule,
        actionType: 'CHANGE_PROBABILITY',
        actionConfig: { probability: 80 },
      };
      jest.spyOn(mockPrisma.automationRule, 'findMany').mockResolvedValue([probRule]);
      jest.spyOn(mockPrisma.deal, 'update').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.automationRule, 'update').mockResolvedValue(probRule);

      await evaluateTriggers('b1', 'ORDER_CREATED', { dealId: 'd1' });
      expect(mockPrisma.deal.update).toHaveBeenCalled();
    });
  });
});
