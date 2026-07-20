import { mockPrisma } from '../setup';
import {
  getActiveOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
} from '../../services/offerFlashService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockOffer = {
  id: 'offer-1',
  businessId: 'b1',
  title: 'Offre Flash',
  discountPercent: 50,
  originalPrice: 10000,
  flashPrice: 5000,
  quantity: 10,
  soldCount: 0,
  status: 'ACTIVE',
  startAt: new Date(),
  endAt: new Date(Date.now() + 86400000),
  createdAt: new Date(),
};

describe('Offer Flash Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getActiveOffers returns active offers', async () => {
    mockPrisma.offerFlash.findMany.mockResolvedValue([mockOffer] as any);
    const r = await getActiveOffers();
    expect(r).toBeDefined();
  });

  test('getOfferById returns offer (uses findFirst)', async () => {
    mockPrisma.offerFlash.findFirst.mockResolvedValue(mockOffer as any);
    const r = await getOfferById('offer-1');
    expect(r?.id).toBe('offer-1');
  });

  test('createOffer creates', async () => {
    mockPrisma.offerFlash.create.mockResolvedValue(mockOffer as any);
    mockPrisma.feedItem.create.mockRejectedValue(new Error('feed skip'));
    const r = await createOffer({
      businessId: 'b1',
      title: 'Offre Flash',
      discountPercent: 50,
      originalPrice: 10000,
      quantity: 10,
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(r.id).toBe('offer-1');
  });

  test('updateOffer updates', async () => {
    mockPrisma.offerFlash.findFirst.mockResolvedValue(mockOffer as any);
    mockPrisma.offerFlash.update.mockResolvedValue({ ...mockOffer, title: 'Updated' } as any);
    const r = await updateOffer('offer-1', 'b1', { title: 'Updated' });
    expect(r!.title).toBe('Updated');
  });

  test('deleteOffer deletes', async () => {
    mockPrisma.offerFlash.findFirst.mockResolvedValue(mockOffer as any);
    mockPrisma.offerFlash.delete.mockResolvedValue(mockOffer as any);
    const r = await deleteOffer('offer-1', 'b1');
    expect(r).toBe(true);
  });
});
