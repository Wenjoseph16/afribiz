import { mockPrisma } from '../setup';
import {
  listPromotions,
  createPromotion,
  getPromotion,
  updatePromotion,
  deletePromotion,
  listCoupons,
  createCoupon,
  listBundles,
  createBundle,
  listCampaigns,
  createCampaign,
  getLoyaltyProgram,
  updateLoyaltyProgram,
  getPromoStats,
} from '../../services/promotions';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({
  publishPromotionStarted: jest.fn(),
  publishCampaignScheduled: jest.fn(),
}));
jest.mock('../../services/socialShareService', () => ({
  autoShareToSocial: jest.fn().mockResolvedValue(undefined),
}));

const mockBiz = { id: 'biz-1', name: 'Test', modules: ['PROMOTIONS'], settings: {} };
const mockPromo = {
  id: 'promo-1',
  businessId: 'biz-1',
  title: 'Promo',
  description: null,
  promotionType: 'PERCENTAGE',
  discountValue: 20,
  code: 'PROMO-A',
  isActive: true,
  isFeatured: false,
  startsAt: new Date(),
  endsAt: new Date(Date.now() + 86400000),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('Promotions Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
  });
  test('listPromotions returns paginated', async () => {
    jest.spyOn(mockPrisma.promotion, 'findMany').mockResolvedValue([mockPromo]);
    jest.spyOn(mockPrisma.promotion, 'count').mockResolvedValue(1);
    const r = await listPromotions('u1', { page: 1, limit: 20 });
    expect(r.total).toBe(1);
    expect(r.promotions).toHaveLength(1);
  });
  test('listPromotions throws if no business', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
    await expect(listPromotions('u1', {})).rejects.toThrow('Business not found');
  });
  test('createPromotion works', async () => {
    jest.spyOn(mockPrisma.promotion, 'create').mockResolvedValue(mockPromo);
    const r = await createPromotion('u1', {
      title: 'Promo',
      discountValue: 20,
      promotionType: 'PERCENTAGE',
    });
    expect(r.id).toBe('promo-1');
  });
  test('getPromotion returns promo', async () => {
    jest.spyOn(mockPrisma.promotion, 'findFirst').mockResolvedValue(mockPromo);
    const r = await getPromotion('u1', 'promo-1');
    expect(r.id).toBe('promo-1');
  });
  test('getPromotion throws 404', async () => {
    jest.spyOn(mockPrisma.promotion, 'findFirst').mockResolvedValue(null);
    await expect(getPromotion('u1', 'x')).rejects.toThrow('Promotion non trouvée');
  });
  test('updatePromotion updates fields', async () => {
    jest.spyOn(mockPrisma.promotion, 'findFirst').mockResolvedValue(mockPromo);
    const spy = jest.spyOn(mockPrisma.promotion, 'update').mockResolvedValue(mockPromo);
    await updatePromotion('u1', 'promo-1', { title: 'New' });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'New' }) })
    );
  });
  test('deletePromotion soft deletes', async () => {
    const spy = jest.spyOn(mockPrisma.promotion, 'update').mockResolvedValue(mockPromo);
    await deletePromotion('u1', 'promo-1');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) })
    );
  });
  test('listCoupons returns coupons', async () => {
    jest
      .spyOn(mockPrisma.coupon, 'findMany')
      .mockResolvedValue([{ id: 'c1', code: 'CPN', businessId: 'biz-1', createdAt: new Date() }]);
    jest.spyOn(mockPrisma.coupon, 'count').mockResolvedValue(1);
    const r = await listCoupons('u1', {});
    expect(r.total).toBe(1);
  });
  test('listBundles returns bundles', async () => {
    jest
      .spyOn(mockPrisma.bundle, 'findMany')
      .mockResolvedValue([
        { id: 'b1', name: 'Pack', businessId: 'biz-1', items: [], createdAt: new Date() },
      ]);
    jest.spyOn(mockPrisma.bundle, 'count').mockResolvedValue(1);
    const r = await listBundles('u1', {});
    expect(r.total).toBe(1);
  });
  test('createBundle calculates prices', async () => {
    const spy = jest.spyOn(mockPrisma.bundle, 'create').mockResolvedValue({});
    await createBundle('u1', {
      name: 'Pack',
      items: [{ productId: 'p1', unitPrice: 5000, quantity: 2 }],
      bundlePrice: 8000,
    });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalPrice: 10000, bundlePrice: 8000, savings: 2000 }),
      })
    );
  });
  test('listCampaigns returns campaigns', async () => {
    jest
      .spyOn(mockPrisma.marketingCampaign, 'findMany')
      .mockResolvedValue([{ id: 'c1', name: 'Camp', businessId: 'biz-1', createdAt: new Date() }]);
    jest.spyOn(mockPrisma.marketingCampaign, 'count').mockResolvedValue(1);
    const r = await listCampaigns('u1', {});
    expect(r.total).toBe(1);
  });
  test('createCampaign creates', async () => {
    jest
      .spyOn(mockPrisma.marketingCampaign, 'create')
      .mockResolvedValue({ id: 'c1', businessId: 'biz-1' });
    const r = await createCampaign('u1', { name: 'Camp', channels: ['WHATSAPP'] });
    expect(r.id).toBe('c1');
  });
  test('getLoyaltyProgram creates if missing', async () => {
    jest.spyOn(mockPrisma.loyaltyProgram, 'findUnique').mockResolvedValue(null);
    jest
      .spyOn(mockPrisma.loyaltyProgram, 'create')
      .mockResolvedValue({ id: 'l1', businessId: 'biz-1' });
    const r = await getLoyaltyProgram('u1');
    expect(r.id).toBe('l1');
  });
  test('updateLoyaltyProgram upserts', async () => {
    const spy = jest.spyOn(mockPrisma.loyaltyProgram, 'upsert').mockResolvedValue({});
    await updateLoyaltyProgram('u1', { isActive: true });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ where: { businessId: 'biz-1' } }));
  });
  test('getPromoStats aggregates', async () => {
    jest.spyOn(mockPrisma.promotion, 'count').mockResolvedValue(5);
    jest.spyOn(mockPrisma.coupon, 'count').mockResolvedValue(10);
    jest.spyOn(mockPrisma.marketingCampaign, 'count').mockResolvedValue(3);
    jest.spyOn(mockPrisma.bundle, 'count').mockResolvedValue(2);
    jest.spyOn(mockPrisma.promotionLog, 'count').mockResolvedValue(100);
    jest
      .spyOn(mockPrisma.loyaltyPoints, 'aggregate')
      .mockResolvedValue({ _sum: { totalPoints: 5000 } });
    const s = await getPromoStats('u1');
    expect(s.totalPromos).toBe(5);
    expect(s.totalLoyaltyPoints).toBe(5000);
  });
});
