import { mockPrisma } from '../setup';
import {
  getPublicBusiness,
  getBusinessProducts,
  getBusinessMenu,
  getBusinessReviews,
  getMyBusiness,
  getMyBusinessStats,
  getAggregatedDashboardStats,
  createBusiness,
  respondToBusinessReview,
  submitVerification,
  getBusinessBookings,
  getBusinessTrainings,
} from '../../services/business';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({
  publishOnboardingCompleted: jest.fn(),
  publishReviewResponse: jest.fn(),
}));

const mockDecimal = { toNumber: () => 50000, valueOf: () => 50000 } as any;
const mockBiz = {
  id: 'b1',
  ownerId: 'u1',
  name: 'Biz',
  type: 'RESTAURANT',
  slug: 'biz',
  description: 'Desc',
  shortDescription: 'Short',
  logo: 'logo.png',
  coverImage: null,
  phone: '123',
  address: 'Addr',
  city: 'City',
  country: 'Country',
  latitude: 6.13,
  longitude: 1.22,
  isActive: true,
  isVerified: true,
  onboardingCompleted: true,
  modules: [],
  hours: [],
  paymentMethods: [],
  deliveryZones: [],
  owner: { id: 'u1', firstName: 'John', lastName: 'Doe', avatar: null },
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};
const mockSettings = { id: 's1', businessId: 'b1', currency: 'XOF', language: 'fr' };

describe('business', () => {
  beforeEach(() => {
    /* cleared by config.clearMocks */
  });

  describe('getPublicBusiness', () => {
    test('returns public business by slug', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      const r = await getPublicBusiness('biz');
      expect(r!.slug).toBe('biz');
      expect(r!.owner!.firstName).toBe('John');
    });

    test('throws if not found', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
      await expect(getPublicBusiness('biz')).rejects.toThrow('Business non trouvé');
    });
  });

  describe('getBusinessProducts', () => {
    test('returns products for business', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
      jest
        .spyOn(mockPrisma.product, 'findMany')
        .mockResolvedValue([{ id: 'p1', name: 'Prod A' } as any]);
      const r = await getBusinessProducts('biz');
      expect(r).toHaveLength(1);
    });
  });

  describe('getBusinessMenu', () => {
    test('returns categories and uncategorized items', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
      jest
        .spyOn(mockPrisma.menuCategory, 'findMany')
        .mockResolvedValue([{ id: 'c1', name: 'Cat', items: [] } as any]);
      jest
        .spyOn(mockPrisma.menuItem, 'findMany')
        .mockResolvedValue([{ id: 'i1', name: 'Item' } as any]);
      const r = await getBusinessMenu('biz');
      expect(r.categories).toHaveLength(1);
      expect(r.uncategorized).toHaveLength(1);
    });
  });

  describe('getBusinessReviews', () => {
    test('returns reviews for business', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
      jest.spyOn(mockPrisma.businessReview, 'findMany').mockResolvedValue([
        {
          id: 'r1',
          rating: 5,
          user: { id: 'u1', firstName: 'J', lastName: 'D', avatar: null },
        } as any,
      ]);
      const r = await getBusinessReviews('biz');
      expect(r).toHaveLength(1);
    });
  });

  describe('getMyBusiness', () => {
    test('returns business for owner', async () => {
      jest
        .spyOn(mockPrisma.business, 'findUnique')
        .mockResolvedValue({ ...mockBiz, settings: mockSettings });
      const r = await getMyBusiness('u1');
      expect(r!.settings).toBeDefined();
    });
  });

  describe('getMyBusinessStats', () => {
    test('returns stats for existing business', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({
        id: 'b1',
        _count: { orders: 10, reviews: 5, products: 20, services: 3 },
      } as any);
      jest
        .spyOn(mockPrisma.order, 'aggregate')
        .mockResolvedValue({ _sum: { totalAmount: mockDecimal } } as any);
      jest
        .spyOn(mockPrisma.order, 'findMany')
        .mockResolvedValue([{ buyerId: 'u1' }, { buyerId: 'u2' }] as any);
      const r = await getMyBusinessStats('u1');
      expect(r.orders).toBe(10);
      expect(r.clients).toBe(2);
    });

    test('returns zeros when no business', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
      const r = await getMyBusinessStats('u1');
      expect(r.orders).toBe(0);
    });
  });

  describe('getAggregatedDashboardStats', () => {
    test('returns dashboard stats', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(5);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(3);
      jest
        .spyOn(mockPrisma.order, 'aggregate')
        .mockResolvedValue({ _sum: { totalAmount: mockDecimal } } as any);
      jest
        .spyOn(mockPrisma.payment, 'aggregate')
        .mockResolvedValue({ _sum: { amount: mockDecimal } } as any);
      jest.spyOn(mockPrisma.order, 'findMany').mockResolvedValue([{ buyerId: 'u1' }] as any);
      jest.spyOn(mockPrisma.quote, 'count').mockResolvedValue(2);
      jest
        .spyOn(mockPrisma.invoice, 'aggregate')
        .mockResolvedValue({ _sum: { totalAmount: mockDecimal } } as any);
      jest.spyOn(mockPrisma.dispute, 'count').mockResolvedValue(1);
      jest
        .spyOn(mockPrisma.debt, 'aggregate')
        .mockResolvedValue({ _sum: { remainingAmount: mockDecimal } } as any);
      jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(3);
      jest.spyOn(mockPrisma.debt, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.invoice, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.businessDocument, 'count').mockResolvedValue(2);

      const r = await getAggregatedDashboardStats('u1');
      expect(r.today.ordersCount).toBe(5);
      expect(r.pending.ordersCount).toBe(5);
      expect(r.alerts.lowStock).toBe(3);
      expect(r.history.length).toBe(7);
    });

    test('throws if business not found', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
      await expect(getAggregatedDashboardStats('u1')).rejects.toThrow('Business non trouvé');
    });
  });

  describe('createBusiness', () => {
    beforeEach(() => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.business, 'create').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.businessSettings, 'create').mockResolvedValue(mockSettings);
      jest.spyOn(mockPrisma.businessPaymentMethod, 'createMany').mockResolvedValue({ count: 0 });
      jest.spyOn(mockPrisma.businessModuleAssignment, 'createMany').mockResolvedValue({ count: 0 });
      jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue({ roles: [] } as any);
      jest.spyOn(mockPrisma.user, 'update').mockResolvedValue({} as any);
    });

    test('creates business and returns with settings', async () => {
      const r = await createBusiness('u1', {
        name: 'Biz',
        type: 'RESTAURANT',
        shortDescription: 'Desc',
        phone: '123',
        address: 'Addr',
        city: 'City',
        country: 'Country',
        latitude: 6.13,
        longitude: 1.22,
        logo: 'logo.png',
        coverImage: 'cover.png',
        modules: [],
      });
      expect(r).toBeDefined();
    });

    test('throws if already has a business', async () => {
      jest
        .spyOn(mockPrisma.business, 'findUnique')
        .mockResolvedValueOnce({ id: 'existing' } as any);
      await expect(createBusiness('u1', {} as any)).rejects.toThrow('Vous avez déjà un business');
    });
  });

  describe('respondToBusinessReview', () => {
    test('responds to a review', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest
        .spyOn(mockPrisma.businessReview, 'findUnique')
        .mockResolvedValue({ id: 'r1', userId: 'u2' } as any);
      jest
        .spyOn(mockPrisma.businessReview, 'update')
        .mockResolvedValue({ id: 'r1', response: 'Merci!' } as any);
      const r = await respondToBusinessReview('biz', 'r1', 'u1', 'Merci!');
      expect(r.response).toBe('Merci!');
    });

    test('throws if business not found', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
      await expect(respondToBusinessReview('biz', 'r1', 'u1', 'Merci!')).rejects.toThrow(
        'Business non trouvé'
      );
    });
  });

  describe('submitVerification', () => {
    test('submits verification documents', async () => {
      jest
        .spyOn(mockPrisma.business, 'findUnique')
        .mockResolvedValue({ ownerId: 'u1', verificationStatus: 'NONE' } as any);
      jest.spyOn(mockPrisma.business, 'update').mockResolvedValue(mockBiz);
      const r = await submitVerification('u1', {
        identityDocument: 'id.pdf',
        companyDocument: 'co.pdf',
        responsiblePhoto: 'photo.jpg',
      });
      expect(r).toBeDefined();
    });

    test('throws if already verified', async () => {
      jest
        .spyOn(mockPrisma.business, 'findUnique')
        .mockResolvedValue({ ownerId: 'u1', verificationStatus: 'VERIFIED' } as any);
      await expect(submitVerification('u1', {} as any)).rejects.toThrow('est déjà vérifié');
    });
  });

  describe('getBusinessBookings', () => {
    test('returns bookings for business', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
      jest.spyOn(mockPrisma.booking, 'findMany').mockResolvedValue([
        {
          id: 'bk1',
          service: { id: 's1', name: 'Svc', price: mockDecimal, duration: 60 },
        } as any,
      ]);
      const r = await getBusinessBookings('biz');
      expect(r).toHaveLength(1);
    });
  });

  describe('getBusinessTrainings', () => {
    test('returns trainings for business', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
      jest
        .spyOn(mockPrisma.training, 'findMany')
        .mockResolvedValue([{ id: 't1', title: 'Training' } as any]);
      const r = await getBusinessTrainings('biz');
      expect(r).toHaveLength(1);
    });
  });
});
