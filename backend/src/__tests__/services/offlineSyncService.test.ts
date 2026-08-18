jest.mock('../../services/orders', () => ({ createOrder: jest.fn() }));
jest.mock('../../services/cashService', () => ({ addMovement: jest.fn() }));
jest.mock('../../lib/db', () => ({ prisma: { negotiationOffer: {}, offlineSyncQueue: {} } }));

const mockPrisma = {
  negotiationOffer: { update: jest.fn() },
  offlineSyncQueue: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
  },
};

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

import { executeSyncAction } from '../../services/offlineSyncService';
import { createOrder } from '../../services/orders';
import { addMovement } from '../../services/cashService';

describe('offlineSyncService — executeSyncAction (Chantier 9)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('CREATE_BUSINESS_ORDER delegates to createOrder', async () => {
    (createOrder as jest.Mock).mockResolvedValue({ id: 'order-1' });
    const result = await executeSyncAction('CREATE_BUSINESS_ORDER', 'owner-1', { items: [] });
    expect(createOrder).toHaveBeenCalledWith('owner-1', { items: [] });
    expect(result).toHaveProperty('id', 'order-1');
  });

  it('CREATE_CASH_MOVEMENT delegates to addMovement', async () => {
    (addMovement as jest.Mock).mockResolvedValue({ id: 'mov-1' });
    const result = await executeSyncAction('CREATE_CASH_MOVEMENT', 'owner-1', {
      type: 'SALE',
      amount: 5000,
      method: 'CASH',
    });
    expect(addMovement).toHaveBeenCalled();
    expect(result).toHaveProperty('id', 'mov-1');
  });

  describe('ACCEPT_NEGOTIATION (Chantier 9)', () => {
    it('updates negotiation offer to ACCEPTED', async () => {
      mockPrisma.negotiationOffer.update.mockResolvedValue({ id: 'neg-1', status: 'ACCEPTED' });
      const result = await executeSyncAction('ACCEPT_NEGOTIATION', 'owner-1', {
        negotiationId: 'neg-1',
      });
      expect(mockPrisma.negotiationOffer.update).toHaveBeenCalledWith({
        where: { id: 'neg-1' },
        data: { status: 'ACCEPTED' },
      });
      expect(result).toHaveProperty('status', 'ACCEPTED');
    });
  });

  describe('COUNTER_NEGOTIATION (Chantier 9)', () => {
    it('updates offer to COUNTERED with counterPrice', async () => {
      mockPrisma.negotiationOffer.update.mockResolvedValue({
        id: 'neg-2',
        status: 'COUNTERED',
        counterPrice: 7500,
      });
      const result = await executeSyncAction('COUNTER_NEGOTIATION', 'owner-1', {
        negotiationId: 'neg-2',
        counterPrice: 7500,
      });
      expect(mockPrisma.negotiationOffer.update).toHaveBeenCalledWith({
        where: { id: 'neg-2' },
        data: { status: 'COUNTERED', counterPrice: 7500 },
      });
      expect(result).toHaveProperty('counterPrice', 7500);
    });
  });

  describe('DECLINE_NEGOTIATION (Chantier 9)', () => {
    it('updates offer to DECLINED', async () => {
      mockPrisma.negotiationOffer.update.mockResolvedValue({ id: 'neg-3', status: 'DECLINED' });
      const result = await executeSyncAction('DECLINE_NEGOTIATION', 'owner-1', {
        negotiationId: 'neg-3',
      });
      expect(mockPrisma.negotiationOffer.update).toHaveBeenCalledWith({
        where: { id: 'neg-3' },
        data: { status: 'DECLINED' },
      });
      expect(result).toHaveProperty('status', 'DECLINED');
    });
  });

  it('throws 400 for unknown action', async () => {
    await expect(
      executeSyncAction('UNKNOWN_ACTION', 'owner-1', {})
    ).rejects.toThrow('inconnue');
  });
});
