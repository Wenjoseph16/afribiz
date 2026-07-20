import { mockPrisma } from '../setup';
import { notificationRepository } from '../../repositories/notificationRepository';
import {
  getAttentionItems,
  checkBusinessUrgency,
  checkAllBusinessesUrgency,
} from '../../services/attentionService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../repositories/notificationRepository', () => {
  const mockFn = jest.fn().mockResolvedValue({});
  return { notificationRepository: { create: mockFn } };
});

const mockOrder = {
  id: 'o1',
  orderNumber: 'ORD-001',
  totalAmount: { toNumber: () => 15000, valueOf: () => 15000 } as any,
  createdAt: new Date(Date.now() - 72 * 3600000),
  contactName: 'John',
};
const mockBooking = {
  id: 'bk1',
  bookingNumber: 'BK-001',
  title: 'Table 5',
  startDate: new Date(Date.now() + 1800000),
  customerName: 'Jane',
  createdAt: new Date(Date.now() - 2 * 3600000),
};
const mockQuote = {
  id: 'q1',
  quoteNumber: 'QT-001',
  title: 'Prestation',
  totalAmount: { toNumber: () => 50000, valueOf: () => 50000 } as any,
  status: 'DRAFT',
  clientName: 'Paul',
  createdAt: new Date(Date.now() - 5 * 86400000),
  validUntil: null,
};
const mockPayment = {
  id: 'p1',
  amount: { toNumber: () => 25000, valueOf: () => 25000 } as any,
  reference: 'PAY-001',
  createdAt: new Date(Date.now() - 3 * 86400000),
};
const mockDispute = {
  id: 'd1',
  title: 'Problème livraison',
  priority: 'HIGH',
  amount: { toNumber: () => 10000, valueOf: () => 10000 } as any,
  createdAt: new Date(Date.now() - 5 * 86400000),
};

describe('attentionService', () => {
  beforeEach(() => {
    (notificationRepository.create as jest.Mock).mockClear();
  });

  describe('getAttentionItems', () => {
    test('returns attention items sorted by score', async () => {
      jest.spyOn(mockPrisma.order, 'findMany').mockResolvedValue([mockOrder]);
      jest.spyOn(mockPrisma.booking, 'findMany').mockResolvedValue([mockBooking]);
      jest.spyOn(mockPrisma.quote, 'findMany').mockResolvedValue([mockQuote]);
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ ownerId: 'u1' } as any);
      jest.spyOn(mockPrisma.conversation, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.payment, 'findMany').mockResolvedValue([mockPayment]);
      jest.spyOn(mockPrisma.dispute, 'findMany').mockResolvedValue([mockDispute]);

      const r = await getAttentionItems('b1');
      expect(r.totalCount).toBeGreaterThan(0);
      expect(r.items[0].score).toBeGreaterThanOrEqual(r.items[r.items.length - 1].score);
    });

    test('handles empty results', async () => {
      jest.spyOn(mockPrisma.order, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.booking, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.quote, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null as any);
      jest.spyOn(mockPrisma.conversation, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.payment, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.dispute, 'findMany').mockResolvedValue([]);

      const r = await getAttentionItems('b1');
      expect(r.totalCount).toBe(0);
      expect(r.items).toEqual([]);
    });
  });

  describe('checkBusinessUrgency', () => {
    test('returns 0 when no urgent conditions', async () => {
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(2);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.employee, 'count').mockResolvedValue(5);
      jest.spyOn(mockPrisma.attendance, 'count').mockResolvedValue(0);
      jest.spyOn(mockPrisma.delivery, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.order, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.booking, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.quote, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null as any);
      jest.spyOn(mockPrisma.conversation, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.payment, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.dispute, 'findMany').mockResolvedValue([]);

      const r = await checkBusinessUrgency('b1', 'u1', 'Biz');
      expect(r).toBe(0);
    });

    test('creates notifications for overloaded orders', async () => {
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValueOnce(10).mockResolvedValueOnce(60);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValueOnce(1).mockResolvedValueOnce(30);
      jest.spyOn(mockPrisma.employee, 'count').mockResolvedValue(5);
      jest.spyOn(mockPrisma.attendance, 'count').mockResolvedValue(2);
      jest.spyOn(mockPrisma.delivery, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.order, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.booking, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.quote, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null as any);
      jest.spyOn(mockPrisma.conversation, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.payment, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.dispute, 'findMany').mockResolvedValue([]);

      const r = await checkBusinessUrgency('b1', 'u1', 'Biz');
      expect(r).toBeGreaterThanOrEqual(1);
      expect(notificationRepository.create).toHaveBeenCalled();
    });
  });

  describe('checkAllBusinessesUrgency', () => {
    test('checks urgency for all active businesses', async () => {
      jest
        .spyOn(mockPrisma.business, 'findMany')
        .mockResolvedValue([{ id: 'b1', name: 'Biz', ownerId: 'u1' } as any]);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(2);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.employee, 'count').mockResolvedValue(3);
      jest.spyOn(mockPrisma.attendance, 'count').mockResolvedValue(0);
      jest.spyOn(mockPrisma.delivery, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.order, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.booking, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.quote, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null as any);
      jest.spyOn(mockPrisma.conversation, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.payment, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.dispute, 'findMany').mockResolvedValue([]);

      const r = await checkAllBusinessesUrgency();
      expect(r.total).toBe(0);
      expect(r.alertsCreated).toBe(0);
    });
  });
});
