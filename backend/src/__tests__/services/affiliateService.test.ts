jest.mock('../../lib/db', () => ({ prisma: { business: {}, affiliateLink: {}, order: {} } }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockPrisma = {
  business: { findFirst: jest.fn() },
  affiliateLink: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  order: { findUnique: jest.fn() },
  product: { findFirst: jest.fn() },
  service: { findFirst: jest.fn() },
  menuItem: { findFirst: jest.fn() },
  room: { findFirst: jest.fn() },
  event: { findFirst: jest.fn() },
  rental: { findFirst: jest.fn() },
  training: { findFirst: jest.fn() },
};

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

import * as affiliateService from '../../services/affiliateService';

describe('affiliateService (Chantier 10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.business.findFirst.mockResolvedValue({ id: 'biz-1', name: 'Test Business' });
  });

  describe('createAffiliateLink', () => {
    it('creates a new affiliate link for a product', async () => {
      mockPrisma.affiliateLink.upsert.mockResolvedValue({
        id: 'aff-1',
        code: 'AFF-TEST1',
        itemType: 'PRODUCT',
        itemId: 'prod-1',
        commissionPercent: 10,
      });
      mockPrisma.product.findFirst.mockResolvedValue({ name: 'T-Shirt AfriBiz' });

      const result = await affiliateService.createAffiliateLink('owner-1', {
        itemType: 'PRODUCT',
        itemId: 'prod-1',
        commissionPercent: 10,
      });

      expect(result).toHaveProperty('itemName', 'T-Shirt AfriBiz');
      expect(result).toHaveProperty('link', '/r/AFF-TEST1');
      expect(mockPrisma.affiliateLink.upsert).toHaveBeenCalled();
    });

    it('clamps commission to [1, 100]', async () => {
      mockPrisma.affiliateLink.upsert.mockResolvedValue({
        id: 'aff-2',
        code: 'AFF-TEST2',
        commissionPercent: 1,
      });
      mockPrisma.product.findFirst.mockResolvedValue({ name: 'Produit' });

      await affiliateService.createAffiliateLink('owner-1', {
        itemType: 'PRODUCT',
        itemId: 'prod-1',
        commissionPercent: 200,
      });

      expect(mockPrisma.affiliateLink.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ commissionPercent: 100 }),
        })
      );
    });

    it('throws 400 for unsupported item type', async () => {
      await expect(
        affiliateService.createAffiliateLink('owner-1', {
          itemType: 'INVALID',
          itemId: 'x',
          commissionPercent: 10,
        })
      ).rejects.toThrow('non supporté');
    });
  });

  describe('listAffiliateLinks', () => {
    it('returns links with resolved item names', async () => {
      mockPrisma.affiliateLink.findMany.mockResolvedValue([
        { id: 'aff-1', code: 'AFF-ABC', itemType: 'PRODUCT', itemId: 'prod-1', clicks: 5 },
      ]);
      mockPrisma.product.findFirst.mockResolvedValue({ name: 'Chaussures' });

      const result = await affiliateService.listAffiliateLinks('owner-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('itemName', 'Chaussures');
    });
  });

  describe('deleteAffiliateLink', () => {
    it('deletes an existing link', async () => {
      mockPrisma.affiliateLink.findFirst.mockResolvedValue({ id: 'aff-1', businessId: 'biz-1' });
      mockPrisma.affiliateLink.delete.mockResolvedValue({});

      const result = await affiliateService.deleteAffiliateLink('owner-1', 'aff-1');
      expect(result).toHaveProperty('success', true);
    });

    it('throws 404 if link not found', async () => {
      mockPrisma.affiliateLink.findFirst.mockResolvedValue(null);
      await expect(
        affiliateService.deleteAffiliateLink('owner-1', 'nonexistent')
      ).rejects.toThrow('non trouvé');
    });
  });

  describe('resolveAffiliateLink', () => {
    it('increments clicks and returns link info', async () => {
      mockPrisma.affiliateLink.findUnique.mockResolvedValue({
        id: 'aff-1',
        code: 'AFF-ABC',
        isActive: true,
        businessId: 'biz-1',
        itemType: 'PRODUCT',
        itemId: 'prod-1',
        clicks: 0,
      });
      mockPrisma.affiliateLink.update.mockResolvedValue({ clicks: 1 });
      mockPrisma.product.findFirst.mockResolvedValue({ name: 'Produit' });

      const result = await affiliateService.resolveAffiliateLink('AFF-ABC');
      expect(result).toHaveProperty('itemName');
      expect(mockPrisma.affiliateLink.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { clicks: { increment: 1 } } })
      );
    });

    it('throws 404 for inactive link', async () => {
      mockPrisma.affiliateLink.findUnique.mockResolvedValue({ isActive: false });
      await expect(affiliateService.resolveAffiliateLink('OLD')).rejects.toThrow('invalide');
    });
  });

  describe('applyAffiliateOnPaid', () => {
    it('credits commission when order has refCode and is paid', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        refCode: 'AFF-ABC',
        paymentStatus: 'PAID',
        totalAmount: 10000,
        businessId: 'biz-1',
      });
      mockPrisma.affiliateLink.findUnique.mockResolvedValue({
        id: 'aff-1',
        code: 'AFF-ABC',
        isActive: true,
        businessId: 'biz-1',
        commissionPercent: 10,
      });
      mockPrisma.affiliateLink.update.mockResolvedValue({});

      const result = await affiliateService.applyAffiliateOnPaid('order-1');
      expect(result).toEqual(
        expect.objectContaining({ commission: 1000, percent: 10 })
      );
    });

    it('returns null when no refCode', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-2',
        refCode: null,
        paymentStatus: 'PAID',
      });
      const result = await affiliateService.applyAffiliateOnPaid('order-2');
      expect(result).toBeNull();
    });

    it('returns null when order not paid', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-3',
        refCode: 'AFF-ABC',
        paymentStatus: 'PENDING',
      });
      const result = await affiliateService.applyAffiliateOnPaid('order-3');
      expect(result).toBeNull();
    });

    it('returns null when link belongs to different business', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-4',
        refCode: 'AFF-ABC',
        paymentStatus: 'PAID',
        totalAmount: 5000,
        businessId: 'biz-other',
      });
      mockPrisma.affiliateLink.findUnique.mockResolvedValue({
        id: 'aff-1',
        code: 'AFF-ABC',
        isActive: true,
        businessId: 'biz-1',
        commissionPercent: 10,
      });
      const result = await affiliateService.applyAffiliateOnPaid('order-4');
      expect(result).toBeNull();
    });
  });
});
