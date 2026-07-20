import { mockPrisma } from '../setup';
import {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  recordAgentTransaction,
  listAgentTransactions,
  getAgentStats,
} from '../../services/agentNetworkService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBiz = { id: 'b1' };
const mockAgent = {
  id: 'a1',
  name: 'Agent A',
  businessId: 'b1',
  phone: '123',
  commissionRate: 5,
  maxTransactionAmount: 10000,
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockTransaction = {
  id: 't1',
  agentId: 'a1',
  type: 'DEPOSIT',
  amount: 5000,
  createdAt: new Date(),
};

describe('agentNetworkService', () => {
  beforeEach(() => {
    /* cleared by config.clearMocks */
  });

  describe('listAgents', () => {
    test('returns agents for the business', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.agent, 'findMany').mockResolvedValue([mockAgent]);
      const r = await listAgents('u1');
      expect(r).toHaveLength(1);
      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith({
        where: { businessId: 'b1' },
        include: { _count: { select: { transactions: true, commissions: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    test('throws if business not found', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
      await expect(listAgents('u1')).rejects.toThrow('Business non trouvé');
    });
  });

  describe('getAgent', () => {
    test('returns agent by id', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.agent, 'findFirst').mockResolvedValue(mockAgent);
      const r = await getAgent('u1', 'a1');
      expect(r.name).toBe('Agent A');
    });

    test('throws if agent not found', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.agent, 'findFirst').mockResolvedValue(null);
      await expect(getAgent('u1', 'a1')).rejects.toThrow('Agent non trouvé');
    });
  });

  describe('createAgent', () => {
    test('creates an agent', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.agent, 'create').mockResolvedValue(mockAgent);
      const r = await createAgent('u1', { name: 'Agent A', phone: '123' });
      expect(r.name).toBe('Agent A');
    });
  });

  describe('updateAgent', () => {
    test('updates an agent', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.agent, 'findFirst').mockResolvedValue(mockAgent);
      jest.spyOn(mockPrisma.agent, 'update').mockResolvedValue({ ...mockAgent, name: 'Updated' });
      const r = await updateAgent('u1', 'a1', { name: 'Updated' });
      expect(r.name).toBe('Updated');
    });

    test('throws if agent not found', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.agent, 'findFirst').mockResolvedValue(null);
      await expect(updateAgent('u1', 'a1', {})).rejects.toThrow('Agent non trouvé');
    });
  });

  describe('deleteAgent', () => {
    test('deletes an agent', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.agent, 'findFirst').mockResolvedValue(mockAgent);
      jest.spyOn(mockPrisma.agent, 'delete').mockResolvedValue(mockAgent);
      const r = await deleteAgent('u1', 'a1');
      expect(r.id).toBe('a1');
    });

    test('throws if agent not found', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.agent, 'findFirst').mockResolvedValue(null);
      await expect(deleteAgent('u1', 'a1')).rejects.toThrow('Agent non trouvé');
    });
  });

  describe('recordAgentTransaction', () => {
    test('creates a transaction', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.agent, 'findFirst').mockResolvedValue(mockAgent);
      jest.spyOn(mockPrisma.agentTransaction, 'create').mockResolvedValue(mockTransaction);
      const r = await recordAgentTransaction('u1', {
        agentId: 'a1',
        type: 'DEPOSIT',
        amount: 5000,
      });
      expect(r.type).toBe('DEPOSIT');
    });

    test('throws if agent not found', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.agent, 'findFirst').mockResolvedValue(null);
      await expect(
        recordAgentTransaction('u1', { agentId: 'a1', type: 'DEPOSIT', amount: 5000 })
      ).rejects.toThrow('Agent non trouvé');
    });
  });

  describe('listAgentTransactions', () => {
    test('returns all transactions for business', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.agentTransaction, 'findMany').mockResolvedValue([mockTransaction]);
      const r = await listAgentTransactions('u1');
      expect(r).toHaveLength(1);
    });

    test('filters by agentId', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.agentTransaction, 'findMany').mockResolvedValue([mockTransaction]);
      const r = await listAgentTransactions('u1', 'a1');
      expect(r).toHaveLength(1);
    });
  });

  describe('getAgentStats', () => {
    test('returns aggregated stats', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.agent, 'count').mockResolvedValue(10);
      jest.spyOn(mockPrisma.agentTransaction, 'count').mockResolvedValue(50);
      jest.spyOn(mockPrisma.agentCommission, 'aggregate').mockResolvedValue({
        _sum: { amount: { toNumber: () => 5000, valueOf: () => 5000 } },
      } as any);
      const r = await getAgentStats('u1');
      expect(r.totalAgents).toBe(10);
      expect(r.totalCommissions).toBe(5000);
    });
  });
});
