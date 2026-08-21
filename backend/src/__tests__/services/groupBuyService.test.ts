import { mockPrisma } from '../setup';
import * as groupBuy from '../../services/groupBuyService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../services/socket', () => ({ getIO: jest.fn(() => null) }));
jest.mock('../../events/publishers', () => ({ publishOrderPlaced: jest.fn() }));
jest.mock('../../services/crm', () => ({
  syncClientFromOrder: jest.fn().mockResolvedValue(undefined),
  recalculateAllDynamicSegments: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/customer360', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/analyticsService', () => ({
  trackAnalyticsEvent: jest.fn().mockResolvedValue(undefined),
}));

const mockBusiness = { id: 'biz-1' };
const mockGroupBuy = {
  id: 'gb-1',
  businessId: 'biz-1',
  title: 'Test Group',
  description: '',
  price: 5000,
  groupPrice: 4500,
  minParticipants: 5,
  maxParticipants: null,
  discountPercent: 10,
  currentCount: 0,
  endAt: null,
  status: 'ACTIVE',
  createdAt: new Date(),
};
const mockParticipant = { id: 'p-1', groupBuyId: 'gb-1', name: 'John', quantity: 1, amount: 4500 };

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
      expect(r[0].progress).toBe(0);
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
        price: 5000,
        groupPrice: 4500,
        minParticipants: 5,
        discountPercent: 10,
      });
      expect(r.id).toBe('gb-1');
      expect(mockPrisma.groupBuy.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'ACTIVE' }) })
      );
    });

    test('rejects groupPrice >= price', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      await expect(
        groupBuy.createGroupBuy('u1', {
          title: 'Test',
          price: 5000,
          groupPrice: 5000,
          minParticipants: 5,
          discountPercent: 0,
        })
      ).rejects.toThrow('Le prix groupe doit être inférieur au prix normal');
      expect(mockPrisma.groupBuy.create).not.toHaveBeenCalled();
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
        amount: 4500,
      });
      expect(r.participant.id).toBe('p-1');
      expect(r.reached).toBe(false);
      expect(mockPrisma.groupBuy.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentCount: { increment: 1 } }),
        })
      );
    });

    test('marks group buy REACHED atomically when threshold hit', async () => {
      const gb = { ...mockGroupBuy, currentCount: 4 };
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuy.findFirst as jest.Mock).mockResolvedValue(gb);
      (mockPrisma.groupBuyParticipant.create as jest.Mock).mockResolvedValue(mockParticipant);
      (mockPrisma.groupBuy.update as jest.Mock).mockResolvedValue({
        ...gb,
        currentCount: 5,
        status: 'REACHED',
      });
      (mockPrisma.business.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockBusiness)
        .mockResolvedValueOnce({ ownerId: 'owner-1', name: 'Biz' });
      (mockPrisma.groupBuyParticipant.findMany as jest.Mock).mockResolvedValue([]);
      const r = await groupBuy.addParticipant('u1', {
        groupBuyId: 'gb-1',
        name: 'John',
        quantity: 1,
        amount: 4500,
      });
      expect(r.reached).toBe(true);
      expect(r.groupBuy.status).toBe('REACHED');
      expect(mockPrisma.groupBuy.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'REACHED', currentCount: { increment: 1 } }),
        })
      );
    });

    test('rejects duplicate connected participant', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuy.findFirst as jest.Mock).mockResolvedValue(mockGroupBuy);
      (mockPrisma.groupBuyParticipant.findFirst as jest.Mock).mockResolvedValue(mockParticipant);
      await expect(
        groupBuy.addParticipant('u1', {
          groupBuyId: 'gb-1',
          userId: 'u-2',
          name: 'John',
          quantity: 1,
          amount: 4500,
        })
      ).rejects.toThrow('Vous participez déjà');
      expect(mockPrisma.groupBuyParticipant.create).not.toHaveBeenCalled();
    });

    test('throws if group buy not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuy.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        groupBuy.addParticipant('u1', {
          groupBuyId: 'bad-id',
          name: 'John',
          quantity: 1,
          amount: 4500,
        })
      ).rejects.toThrow('Achat groupé non trouvé');
    });
  });

  describe('removeParticipant', () => {
    test('removes participant via groupBuyParticipant.delete and decrements count', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.groupBuyParticipant.findFirst as jest.Mock).mockResolvedValue(mockParticipant);
      (mockPrisma.groupBuyParticipant.delete as jest.Mock).mockResolvedValue(mockParticipant);
      (mockPrisma.groupBuy.update as jest.Mock).mockResolvedValue({
        ...mockGroupBuy,
        currentCount: 0,
      });
      await groupBuy.removeParticipant('u1', 'p-1');
      expect(mockPrisma.groupBuyParticipant.delete).toHaveBeenCalledWith({
        where: { id: 'p-1' },
      });
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

  describe('confirmParticipantOrder', () => {
    test('creates a real order at group price when threshold reached', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      const gb = { ...mockGroupBuy, status: 'REACHED', currentCount: 5 };
      const part = {
        id: 'p-1',
        groupBuyId: 'gb-1',
        userId: 'u-2',
        name: 'John',
        phone: '+2250100000000',
        quantity: 1,
        amount: 4500,
        status: 'PENDING',
        groupBuy: gb,
      };
      (mockPrisma.groupBuyParticipant.findFirst as jest.Mock).mockResolvedValue(part);
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
        const tx = {
          groupBuyParticipant: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          order: {
            create: jest.fn().mockResolvedValue({
              id: 'ord-gb-1',
              orderNumber: 'CMD-GB-20260809-00001',
              totalAmount: 4500,
            }),
          },
          product: { update: jest.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });
      const r = await groupBuy.confirmParticipantOrder('u1', 'p-1');
      expect(r.total).toBe(4500);
      expect(r.discount).toBe(500);
      expect(r.message).toContain('économie');
    });

    test('rejects when group buy still ACTIVE (threshold not reached)', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      const part = {
        id: 'p-1',
        groupBuyId: 'gb-1',
        userId: 'u-2',
        name: 'John',
        quantity: 1,
        amount: 4500,
        status: 'PENDING',
        groupBuy: { ...mockGroupBuy, status: 'ACTIVE', currentCount: 2 },
      };
      (mockPrisma.groupBuyParticipant.findFirst as jest.Mock).mockResolvedValue(part);
      await expect(groupBuy.confirmParticipantOrder('u1', 'p-1')).rejects.toThrow(
        "Le seuil n'est pas encore atteint"
      );
    });
  });
});
