import { mockPrisma } from '../setup';
import * as groupBuy from '../../services/groupBuyService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

const mockBusiness = { id: 'biz-1' };
const mockGroupBuy = {
  id: 'gb-1',
  businessId: 'biz-1',
  title: 'Test Group',
  description: '',
  targetPrice: 5000,
  minParticipants: 5,
  discountPercent: 10,
  currentCount: 0,
  endAt: null,
  createdAt: new Date(),
  _count: { participants: 0 },
};
const mockParticipant = { id: 'p-1', groupBuyId: 'gb-1', name: 'John', quantity: 1, amount: 5000 };

describe('groupBuyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listGroupBuys', () => {
    test('lists group buys for owner', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuy.findMany as jest.Mock).mockResolvedValue([mockGroupBuy]);
      const r = await groupBuy.listGroupBuys('u1');
      expect(r).toHaveLength(1);
    });

    test('throws if business not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(groupBuy.listGroupBuys('u-x')).rejects.toThrow('Business non trouvé');
    });
  });

  describe('getGroupBuy', () => {
    test('returns group buy with participants', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuy.findFirst as jest.Mock).mockResolvedValue({
        ...mockGroupBuy,
        participants: [],
      });
      const r = await groupBuy.getGroupBuy('u1', 'gb-1');
      expect(r.id).toBe('gb-1');
    });

    test('throws if not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuy.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(groupBuy.getGroupBuy('u1', 'bad-id')).rejects.toThrow('Achat groupé non trouvé');
    });
  });

  describe('createGroupBuy', () => {
    test('creates group buy', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuy.create as jest.Mock).mockResolvedValue(mockGroupBuy);
      const r = await groupBuy.createGroupBuy('u1', {
        title: 'Test Group',
        targetPrice: 5000,
        minParticipants: 5,
        discountPercent: 10,
      });
      expect(r.id).toBe('gb-1');
    });
  });

  describe('updateGroupBuy', () => {
    test('updates group buy', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuy.findFirst as jest.Mock).mockResolvedValue(mockGroupBuy);
      (mockPrisma.groupBuy.update as jest.Mock).mockResolvedValue({
        ...mockGroupBuy,
        title: 'Updated',
      });
      const r = await groupBuy.updateGroupBuy('u1', 'gb-1', { title: 'Updated' });
      expect(mockPrisma.groupBuy.update).toHaveBeenCalled();
    });

    test('throws if not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuy.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(groupBuy.updateGroupBuy('u1', 'bad-id', {})).rejects.toThrow(
        'Achat groupé non trouvé'
      );
    });
  });

  describe('deleteGroupBuy', () => {
    test('deletes group buy', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuy.findFirst as jest.Mock).mockResolvedValue(mockGroupBuy);
      (mockPrisma.groupBuy.delete as jest.Mock).mockResolvedValue(mockGroupBuy);
      const r = await groupBuy.deleteGroupBuy('u1', 'gb-1');
      expect(r.id).toBe('gb-1');
    });
  });

  describe('addParticipant', () => {
    test('adds participant and increments count', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuy.findFirst as jest.Mock).mockResolvedValue(mockGroupBuy);
      (mockPrisma.groupBuyParticipant.create as jest.Mock).mockResolvedValue(mockParticipant);
      (mockPrisma.groupBuy.update as jest.Mock).mockResolvedValue({
        ...mockGroupBuy,
        currentCount: 1,
      });
      const r = await groupBuy.addParticipant('u1', {
        groupBuyId: 'gb-1',
        name: 'John',
        quantity: 1,
        amount: 5000,
      });
      expect(r.id).toBe('p-1');
      expect(mockPrisma.groupBuy.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { currentCount: { increment: 1 } } })
      );
    });

    test('throws if group buy not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuy.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        groupBuy.addParticipant('u1', {
          groupBuyId: 'bad-id',
          name: 'John',
          quantity: 1,
          amount: 5000,
        })
      ).rejects.toThrow('Achat groupé non trouvé');
    });
  });

  describe('removeParticipant', () => {
    test('removes participant and decrements count', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuyParticipant.findFirst as jest.Mock).mockResolvedValue(mockParticipant);
      (mockPrisma.groupBuy.delete as jest.Mock).mockResolvedValue(mockParticipant);
      (mockPrisma.groupBuy.update as jest.Mock).mockResolvedValue({
        ...mockGroupBuy,
        currentCount: 0,
      });
      await groupBuy.removeParticipant('u1', 'p-1');
      expect(mockPrisma.groupBuy.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { currentCount: { decrement: 1 } } })
      );
    });

    test('throws if participant not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuyParticipant.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(groupBuy.removeParticipant('u1', 'bad-id')).rejects.toThrow(
        'Participant non trouvé'
      );
    });
  });
});
