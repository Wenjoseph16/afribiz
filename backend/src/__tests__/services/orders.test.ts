import { mockPrisma } from '../setup';
import {
  listBusinessOrders,
  getBusinessOrder,
  createOrder,
  updateOrderStatus,
  updateDeliveryStatus,
  updateOrderPayment,
  deleteOrder,
  getOrderStats,
  listDebts,
  payDebt,
  settleDebt,
} from '../../services/orders';
import { AppError } from '../../middlewares/errorHandler';

jest.mock('../../events/publishers', () => ({
  publishOrderPlaced: jest.fn(),
  publishOrderStatusChanged: jest.fn(),
  publishNewClient: jest.fn(),
  publishInvoiceSent: jest.fn(),
  publishInvoicePaid: jest.fn(),
}));

const mockBusiness = {
  id: 'business-1',
  name: 'Test Shop',
  modules: ['ORDERS'],
  settings: { currency: 'FCFA' },
};

const mockOrder = {
  id: 'order-1',
  orderNumber: 'CMD-20250101-00001',
  businessId: 'business-1',
  buyerId: 'buyer-1',
  status: 'PENDING',
  totalAmount: 15000,
  items: [{ id: 'item-1', name: 'Item', quantity: 2, unitPrice: 7500 }],
  buyer: { id: 'buyer-1', firstName: 'Jean', lastName: 'Test' },
  debts: [],
  deliveryZone: null,
  payments: [],
  createdAt: new Date('2025-01-01'),
};

describe('OrdersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listBusinessOrders', () => {
    it('should return paginated orders', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([mockOrder]);
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(1);

      const result = await listBusinessOrders('owner-1', { page: '1', limit: '20' });

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should throw if business not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(listBusinessOrders('owner-1', {})).rejects.toThrow(AppError);
    });

    it('should throw if ORDERS module not activated', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
        ...mockBusiness,
        modules: [],
      });

      await expect(listBusinessOrders('owner-1', {})).rejects.toThrow('Module Commandes');
    });

    it('should filter by status', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([mockOrder]);
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(1);

      await listBusinessOrders('owner-1', { status: 'PENDING' });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        })
      );
    });

    it('should filter by search term', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([mockOrder]);
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(1);

      await listBusinessOrders('owner-1', { search: 'Jean' });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ contactName: expect.anything() }),
            ]),
          }),
        })
      );
    });

    it('should handle empty results', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(0);

      const result = await listBusinessOrders('owner-1', {});

      expect(result.orders).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getBusinessOrder', () => {
    it('should return a single order', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      const result = await getBusinessOrder('owner-1', 'order-1');

      expect(result.id).toBe('order-1');
    });

    it('should throw if order not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getBusinessOrder('owner-1', 'order-1')).rejects.toThrow('Commande non trouvée');
    });
  });

  describe('createOrder', () => {
    const orderData = {
      items: [{ productId: 'prod-1', name: 'Item', unitPrice: 5000, quantity: 3 }],
      contactName: 'Jean Test',
      contactPhone: '+22890123456',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'prod-1',
        name: 'Product',
        stock: 10,
      });
      (mockPrisma.product.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.order.create as jest.Mock).mockResolvedValue(mockOrder);
      (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
    });

    it('should create an order successfully', async () => {
      const result = await createOrder('owner-1', orderData);

      expect(result.id).toBe('order-1');
    });

    it('should reject insufficient stock', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'prod-1',
        name: 'Product',
        stock: 1,
      });

      await expect(createOrder('owner-1', orderData)).rejects.toThrow('Stock insuffisant');
    });

    it('should create debt for partial payment', async () => {
      (mockPrisma.debt.create as jest.Mock).mockResolvedValue({});

      await createOrder('owner-1', {
        ...orderData,
        paymentMethod: 'CASH',
        depositAmount: 5000,
      });

      expect(mockPrisma.debt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 10000,
            remainingAmount: 10000,
          }),
        })
      );
    });
  });

  describe('updateOrderStatus', () => {
    beforeEach(() => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (mockPrisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      });
      // Facture auto : pas d'invoice existante, création réussie
      (mockPrisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.invoice.create as jest.Mock).mockResolvedValue({
        id: 'invoice-1',
        invoiceNumber: 'FAC-20250101-00001',
      });
    });

    it('should update to ACCEPTED', async () => {
      const result = await updateOrderStatus('owner-1', 'order-1', 'ACCEPTED');

      expect(result.status).toBe('ACCEPTED');
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ acceptedAt: expect.any(Date) }),
        })
      );
    });

    it('should update to DELIVERED and set payment status', async () => {
      await updateOrderStatus('owner-1', 'order-1', 'DELIVERED');

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deliveredAt: expect.any(Date),
            deliveryStatus: 'DELIVERED',
            paymentStatus: 'PAID',
          }),
        })
      );
    });

    it('should include reason when REFUSED', async () => {
      await updateOrderStatus('owner-1', 'order-1', 'REFUSED', 'Out of stock');

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            refuseReason: 'Out of stock',
          }),
        })
      );
    });

    it('should throw if order not found', async () => {
      (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(updateOrderStatus('owner-1', 'order-1', 'ACCEPTED')).rejects.toThrow(
        'Commande non trouvée'
      );
    });
  });

  describe('updateDeliveryStatus', () => {
    beforeEach(() => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (mockPrisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        deliveryStatus: 'IN_TRANSIT',
      });
    });

    it('should update delivery status', async () => {
      const result = await updateDeliveryStatus('owner-1', 'order-1', 'IN_TRANSIT');

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deliveryStatus: 'IN_TRANSIT' }),
        })
      );
    });

    it('should include notes if provided', async () => {
      await updateDeliveryStatus('owner-1', 'order-1', 'DELIVERED', 'Left at door');

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ notes: 'Left at door' }),
        })
      );
    });
  });

  describe('updateOrderPayment', () => {
    beforeEach(() => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (mockPrisma.order.update as jest.Mock).mockResolvedValue(mockOrder);
    });

    it('should update payment method and status', async () => {
      await updateOrderPayment('owner-1', 'order-1', {
        paymentMethod: 'ORANGE_MONEY',
        paymentStatus: 'PAID',
      });

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentMethod: 'ORANGE_MONEY',
            paymentStatus: 'PAID',
            paidAt: expect.any(Date),
          }),
        })
      );
    });

    it('should not set paidAt for non-PAID status', async () => {
      await updateOrderPayment('owner-1', 'order-1', {
        paymentMethod: 'CASH',
        paymentStatus: 'PENDING',
      });

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ paidAt: expect.anything() }),
        })
      );
    });
  });

  describe('deleteOrder', () => {
    it('should mark order as CANCELLED', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'CANCELLED',
      });

      await deleteOrder('owner-1', 'order-1');

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1', businessId: 'business-1' },
          data: expect.objectContaining({ status: 'CANCELLED', cancelledAt: expect.any(Date) }),
        })
      );
    });
  });

  describe('getOrderStats', () => {
    it('should return aggregated stats', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      for (const _ of [1, 2, 3, 4, 5, 6, 7]) {
        (mockPrisma.order.count as jest.Mock).mockResolvedValueOnce(1);
      }
      (mockPrisma.order.aggregate as jest.Mock).mockResolvedValueOnce({
        _sum: { totalAmount: 50000 },
      });
      (mockPrisma.order.aggregate as jest.Mock).mockResolvedValueOnce({
        _sum: { totalAmount: 10000 },
      });
      (mockPrisma.order.groupBy as jest.Mock).mockResolvedValueOnce([
        { type: 'DELIVERY', _count: 5 },
      ]);

      const result = await getOrderStats('owner-1');

      expect(result.total).toBe(7);
      expect(result.totalRevenue).toBe(50000);
      expect(result.todayRevenue).toBe(10000);
      expect(result.mostPopularType).toBe('DELIVERY');
    });

    it('should handle no popular type', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      for (const _ of [1, 2, 3, 4, 5, 6, 7]) {
        (mockPrisma.order.count as jest.Mock).mockResolvedValueOnce(0);
      }
      (mockPrisma.order.aggregate as jest.Mock).mockResolvedValueOnce({ _sum: { totalAmount: 0 } });
      (mockPrisma.order.aggregate as jest.Mock).mockResolvedValueOnce({ _sum: { totalAmount: 0 } });
      (mockPrisma.order.groupBy as jest.Mock).mockResolvedValueOnce([]);

      const result = await getOrderStats('owner-1');

      expect(result.total).toBe(0);
      expect(result.mostPopularType).toBeNull();
    });
  });

  describe('listDebts', () => {
    it('should return paginated debts', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.debt.findMany as jest.Mock).mockResolvedValue([
        { id: 'debt-1', totalAmount: 10000, remainingAmount: 5000, order: { items: [] } },
      ]);
      (mockPrisma.debt.count as jest.Mock).mockResolvedValue(1);

      const result = await listDebts('owner-1', {});

      expect(result.debts).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('payDebt', () => {
    const mockDebt = {
      id: 'debt-1',
      businessId: 'business-1',
      totalAmount: 10000,
      amountPaid: 0,
      remainingAmount: 10000,
      status: 'ACTIVE',
    };

    beforeEach(() => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.debt.findFirst as jest.Mock).mockResolvedValue(mockDebt);
    });

    it('should update debt on partial payment', async () => {
      (mockPrisma.debt.findUnique as jest.Mock).mockResolvedValue(mockDebt);
      (mockPrisma.debt.update as jest.Mock).mockResolvedValue({
        ...mockDebt,
        amountPaid: 3000,
        remainingAmount: 7000,
        status: 'PARTIALLY_PAID',
      });

      const result = await payDebt('owner-1', 'debt-1', 3000);

      expect(result.status).toBe('PARTIALLY_PAID');
      expect(result.remainingAmount).toBe(7000);
    });

    it('should mark as SETTLED when fully paid', async () => {
      (mockPrisma.debt.findUnique as jest.Mock).mockResolvedValue(mockDebt);
      (mockPrisma.debt.update as jest.Mock).mockResolvedValue({
        ...mockDebt,
        amountPaid: 10000,
        remainingAmount: 0,
        status: 'SETTLED',
      });

      const result = await payDebt('owner-1', 'debt-1', 10000);

      expect(result.status).toBe('SETTLED');
    });
  });

  describe('settleDebt', () => {
    it('should mark debt as SETTLED with full amount', async () => {
      const mockDebt = {
        id: 'debt-1',
        businessId: 'business-1',
        totalAmount: 10000,
        amountPaid: 3000,
        remainingAmount: 7000,
      };

      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.debt.findFirst as jest.Mock).mockResolvedValue(mockDebt);
      (mockPrisma.debt.findUnique as jest.Mock).mockResolvedValue(mockDebt);
      (mockPrisma.debt.update as jest.Mock).mockResolvedValue({
        ...mockDebt,
        status: 'SETTLED',
        remainingAmount: 0,
        amountPaid: 10000,
      });

      const result = await settleDebt('owner-1', 'debt-1');

      expect(result.status).toBe('SETTLED');
      expect(result.remainingAmount).toBe(0);
      expect(result.amountPaid).toBe(10000);
    });
  });
});
