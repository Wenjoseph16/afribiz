import { mockPrisma } from '../setup';
import { registerLoyaltyAutomation } from '../../services/LoyaltyAutomation';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../events/publishers', () => ({
  publishLoyaltyPointsEarned: jest.fn(),
  publishLoyaltyTierChanged: jest.fn(),
}));
jest.mock('../../events/EventBus');
jest.mock('../../events/events', () => ({
  DomainEventType: { ORDER_PLACED: 'ORDER_PLACED', PAYMENT_RECEIVED: 'PAYMENT_RECEIVED' },
}));

const { eventBus } = require('../../events/EventBus');

const mockProgram = {
  id: 'lp-1',
  businessId: 'biz-1',
  isActive: true,
  pointsPerAmount: 10,
  bronzeMinPoints: 0,
  silverMinPoints: 100,
  goldMinPoints: 500,
  platinumMinPoints: 1000,
};
const mockLoyaltyPoints = { id: 'lp-pts-1', businessId: 'biz-1', clientId: 'u1', totalPoints: 50 };
const mockBusiness = { id: 'biz-1', ownerId: 'owner-1', name: 'Test Biz' };

describe('LoyaltyAutomation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerLoyaltyAutomation', () => {
    test('subscribes to ORDER_PLACED and PAYMENT_RECEIVED events', () => {
      registerLoyaltyAutomation();
      expect(eventBus.subscribe).toHaveBeenCalledTimes(2);
      expect(eventBus.subscribe).toHaveBeenCalledWith('ORDER_PLACED', expect.any(Function));
      expect(eventBus.subscribe).toHaveBeenCalledWith('PAYMENT_RECEIVED', expect.any(Function));
    });

    test('ORDER_PLACED handler credits points', async () => {
      let orderHandler: Function = () => {};
      eventBus.subscribe.mockImplementation((_event: string, handler: Function) => {
        orderHandler = handler;
      });
      registerLoyaltyAutomation();

      (mockPrisma.loyaltyProgram.findUnique as jest.Mock).mockResolvedValue(mockProgram);
      (mockPrisma.loyaltyPoints.upsert as jest.Mock).mockResolvedValue(mockLoyaltyPoints);
      (mockPrisma.loyaltyTransaction.create as jest.Mock).mockResolvedValue({ id: 'lt-1' });
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);

      await orderHandler({
        userId: 'u1',
        metadata: { businessId: 'biz-1', amount: '100', orderId: 'ord-12345678' },
      });

      expect(mockPrisma.loyaltyPoints.upsert).toHaveBeenCalled();
      expect(mockPrisma.loyaltyTransaction.create).toHaveBeenCalled();
    });

    test('ORDER_PLACED handler does nothing if no businessId', async () => {
      let orderHandler: Function = () => {};
      eventBus.subscribe.mockImplementation((_event: string, handler: Function) => {
        orderHandler = handler;
      });
      registerLoyaltyAutomation();

      await orderHandler({ userId: 'u1', metadata: { amount: '100' } });

      expect(mockPrisma.loyaltyProgram.findUnique).not.toHaveBeenCalled();
    });

    test('ORDER_PLACED handler does nothing if program not found', async () => {
      let orderHandler: Function = () => {};
      eventBus.subscribe.mockImplementation((_event: string, handler: Function) => {
        orderHandler = handler;
      });
      registerLoyaltyAutomation();

      (mockPrisma.loyaltyProgram.findUnique as jest.Mock).mockResolvedValue(null);

      await orderHandler({ userId: 'u1', metadata: { businessId: 'biz-1', amount: '100' } });

      expect(mockPrisma.loyaltyPoints.upsert).not.toHaveBeenCalled();
    });

    test('PAYMENT_RECEIVED handler credits points', async () => {
      let paymentHandler: Function = () => {};
      eventBus.subscribe.mockImplementation((_event: string, handler: Function) => {
        if (_event === 'PAYMENT_RECEIVED') paymentHandler = handler;
      });
      registerLoyaltyAutomation();

      (mockPrisma.loyaltyProgram.findUnique as jest.Mock).mockResolvedValue(mockProgram);
      (mockPrisma.loyaltyPoints.upsert as jest.Mock).mockResolvedValue(mockLoyaltyPoints);
      (mockPrisma.loyaltyTransaction.create as jest.Mock).mockResolvedValue({ id: 'lt-1' });
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);

      await paymentHandler({
        userId: 'u1',
        metadata: { businessId: 'biz-1', amount: '50', paymentId: 'pay-12345678' },
      });

      expect(mockPrisma.loyaltyPoints.upsert).toHaveBeenCalled();
    });

    test('handles errors gracefully', async () => {
      let orderHandler: Function = () => {};
      eventBus.subscribe.mockImplementation((_event: string, handler: Function) => {
        orderHandler = handler;
      });
      registerLoyaltyAutomation();

      (mockPrisma.loyaltyProgram.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        orderHandler({ userId: 'u1', metadata: { businessId: 'biz-1', amount: '100' } })
      ).resolves.toBeUndefined();
    });

    test('triggers tier change when points cross threshold', async () => {
      let orderHandler: Function = () => {};
      eventBus.subscribe.mockImplementation((_event: string, handler: Function) => {
        orderHandler = handler;
      });
      registerLoyaltyAutomation();

      (mockPrisma.loyaltyProgram.findUnique as jest.Mock).mockResolvedValue(mockProgram);
      const updatedPoints = { ...mockLoyaltyPoints, totalPoints: 150 };
      (mockPrisma.loyaltyPoints.upsert as jest.Mock).mockResolvedValue(updatedPoints);
      (mockPrisma.loyaltyTransaction.create as jest.Mock).mockResolvedValue({ id: 'lt-1' });
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);

      await orderHandler({
        userId: 'u1',
        metadata: { businessId: 'biz-1', amount: '1000', orderId: 'ord-12345678' },
      });

      const { publishLoyaltyTierChanged } = require('../../events/publishers');
      expect(publishLoyaltyTierChanged).toHaveBeenCalled();
    });
  });
});
