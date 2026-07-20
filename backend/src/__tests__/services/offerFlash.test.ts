import { mockPrisma } from '../setup';
import * as offerFlashService from '../../services/offerFlashService';

const mockBusiness = {
  id: 'biz-1',
  name: 'Biz',
  slug: 'biz',
  logo: null,
  type: 'SHOP',
  city: 'Abidjan',
  latitude: 5.36,
  longitude: -4.02,
  rating: 4.5,
};
const mockOffer = {
  id: 'offer-1',
  businessId: 'biz-1',
  title: '50% sur tout',
  description: 'Super offre flash',
  image: 'https://example.com/img.jpg',
  discountPercent: 50,
  originalPrice: 10000,
  flashPrice: 5000,
  currency: 'FCFA',
  quantity: 100,
  soldCount: 10,
  maxPerCustomer: 2,
  terms: 'Valable 24h',
  latitude: 5.36,
  longitude: -4.02,
  radiusKm: 10,
  startAt: new Date(Date.now() - 3600000),
  endAt: new Date(Date.now() + 86400000),
  isActive: true,
  isFeatured: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  business: mockBusiness,
};

describe('OfferFlashService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveOffers', () => {
    it('should return active offers', async () => {
      (mockPrisma.offerFlash.findMany as jest.Mock).mockResolvedValue([mockOffer]);
      const result = await offerFlashService.getActiveOffers();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by businessId', async () => {
      (mockPrisma.offerFlash.findMany as jest.Mock).mockResolvedValue([mockOffer]);
      await offerFlashService.getActiveOffers({ businessId: 'biz-1' });
      expect(mockPrisma.offerFlash.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ businessId: 'biz-1' }) })
      );
    });

    it('should filter by featured', async () => {
      (mockPrisma.offerFlash.findMany as jest.Mock).mockResolvedValue([]);
      await offerFlashService.getActiveOffers({ featured: true });
      expect(mockPrisma.offerFlash.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isFeatured: true }) })
      );
    });

    it('should filter by expiry', async () => {
      (mockPrisma.offerFlash.findMany as jest.Mock).mockResolvedValue([]);
      await offerFlashService.getActiveOffers();
      expect(mockPrisma.offerFlash.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            endAt: { gte: expect.any(Date) },
            startAt: { lte: expect.any(Date) },
          }),
        })
      );
    });

    it('should return empty when no offers', async () => {
      (mockPrisma.offerFlash.findMany as jest.Mock).mockResolvedValue([]);
      const result = await offerFlashService.getActiveOffers();
      expect(result.items).toHaveLength(0);
    });
  });

  describe('getOfferById', () => {
    it('should return offer when found', async () => {
      (mockPrisma.offerFlash.findFirst as jest.Mock).mockResolvedValue(mockOffer);
      const result = await offerFlashService.getOfferById('offer-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('offer-1');
    });

    it('should return null when not found', async () => {
      (mockPrisma.offerFlash.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await offerFlashService.getOfferById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createOffer', () => {
    it('should create offer and feed item', async () => {
      (mockPrisma.offerFlash.create as jest.Mock).mockResolvedValue(mockOffer);
      (mockPrisma.feedItem.create as jest.Mock).mockResolvedValue({});

      const result = await offerFlashService.createOffer({
        businessId: 'biz-1',
        title: '50% sur tout',
        discountPercent: 50,
        originalPrice: 10000,
        flashPrice: 5000,
        quantity: 100,
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 86400000).toISOString(),
      });

      expect(result.id).toBe('offer-1');
      expect(mockPrisma.feedItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'OFFER_FLASH', referenceId: 'offer-1' }),
        })
      );
    });

    it('should create offer without optional fields', async () => {
      (mockPrisma.offerFlash.create as jest.Mock).mockResolvedValue(mockOffer);
      (mockPrisma.feedItem.create as jest.Mock).mockResolvedValue({});

      const result = await offerFlashService.createOffer({
        businessId: 'biz-1',
        title: 'Promo rapide',
        discountPercent: 20,
        quantity: 50,
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
      });

      expect(result.id).toBe('offer-1');
    });
  });

  describe('updateOffer', () => {
    it('should update offer when owned', async () => {
      (mockPrisma.offerFlash.findFirst as jest.Mock).mockResolvedValue(mockOffer);
      (mockPrisma.offerFlash.update as jest.Mock).mockResolvedValue({
        ...mockOffer,
        title: 'Updated',
      });

      const result = await offerFlashService.updateOffer('offer-1', 'biz-1', { title: 'Updated' });
      expect(result!.title).toBe('Updated');
    });

    it('should return null when not owned', async () => {
      (mockPrisma.offerFlash.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await offerFlashService.updateOffer('offer-1', 'other-biz', {});
      expect(result).toBeNull();
    });
  });

  describe('deleteOffer', () => {
    it('should delete offer when found', async () => {
      (mockPrisma.offerFlash.findFirst as jest.Mock).mockResolvedValue(mockOffer);
      (mockPrisma.offerFlash.delete as jest.Mock).mockResolvedValue(mockOffer);
      await expect(offerFlashService.deleteOffer('offer-1', 'biz-1')).resolves.not.toThrow();
    });

    it('should return false when not found', async () => {
      (mockPrisma.offerFlash.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await offerFlashService.deleteOffer('offer-1', 'other-biz');
      expect(result).toBe(false);
    });
  });

  describe('claimOffer', () => {
    it('should increment soldCount', async () => {
      (mockPrisma.offerFlash.findFirst as jest.Mock).mockResolvedValue(mockOffer);
      (mockPrisma.offerFlash.update as jest.Mock).mockResolvedValue({
        ...mockOffer,
        soldCount: 11,
      });

      const result = await offerFlashService.claimOffer('offer-1');
      expect(result!.soldCount).toBe(11);
    });

    it('should return null when sold out', async () => {
      (mockPrisma.offerFlash.findFirst as jest.Mock).mockResolvedValue({
        ...mockOffer,
        soldCount: 100,
        quantity: 100,
      });
      const result = await offerFlashService.claimOffer('offer-1');
      expect(result).toBeNull();
    });

    it('should return null when expired', async () => {
      (mockPrisma.offerFlash.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await offerFlashService.claimOffer('offer-1');
      expect(result).toBeNull();
    });

    it('should return null when inactive', async () => {
      (mockPrisma.offerFlash.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await offerFlashService.claimOffer('offer-1');
      expect(result).toBeNull();
    });
  });

  describe('getNearbyBusinesses', () => {
    it('should find businesses within radius', async () => {
      const mockBusinessNearby = { ...mockBusiness, latitude: 5.37, longitude: -4.01 };
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([mockBusinessNearby]);
      (mockPrisma.offerFlash.findMany as jest.Mock).mockResolvedValue([mockOffer]);

      const result = await offerFlashService.getNearbyBusinesses({
        latitude: 5.36,
        longitude: -4.02,
        radiusKm: 10,
      });
      expect(result.items).toHaveLength(1);
    });

    it('should return empty when no businesses nearby', async () => {
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.offerFlash.findMany as jest.Mock).mockResolvedValue([]);

      const result = await offerFlashService.getNearbyBusinesses({
        latitude: 5.36,
        longitude: -4.02,
        radiusKm: 1,
      });
      expect(result.items).toHaveLength(0);
    });

    it('should require latitude and longitude', async () => {
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.offerFlash.findMany as jest.Mock).mockResolvedValue([]);

      const result = await offerFlashService.getNearbyBusinesses({
        latitude: 5.36,
        longitude: -4.02,
        radiusKm: 5,
      });
      expect(result).toBeDefined();
    });
  });
});
