import { mockPrisma } from '../setup';
import {
  listProducts,
  createProduct,
  getProduct,
  deleteProduct,
  getProductStats,
} from '../../services/product';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({
  publishProductPublished: jest.fn(),
  publishProductModified: jest.fn(),
  publishProductDeleted: jest.fn(),
  publishNewMessage: jest.fn(),
}));
jest.mock('../../services/socialShareService', () => ({
  autoShareToSocial: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/alertService', () => ({
  triggerAlertsForBackInStock: jest.fn(),
  triggerAlertsForPriceDrop: jest.fn(),
}));
jest.mock('../../data', () => ({
  findProductByBusinessAndSlug: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../utils/helpers', () => ({
  calculatePagination: jest.fn().mockReturnValue({ skip: 0, take: 20 }),
}));

const mockBiz = { id: 'biz-1', name: 'TestBiz', modules: ['PRODUCTS'] };
const mockProd = {
  id: 'prod-1',
  businessId: 'biz-1',
  name: 'Produit A',
  slug: 'produit-a',
  price: 5000,
  currency: 'FCFA',
  stock: 10,
  isActive: true,
  images: [],
  tags: [],
  variants: [],
  _count: { reviews: 0, orderItems: 0 },
};

describe('Product Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('listProducts returns paginated', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
    jest.spyOn(mockPrisma.product, 'findMany').mockResolvedValue([mockProd as any]);
    jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(1);
    const r = await listProducts('u1', {});
    expect(r.pagination.total).toBe(1);
  });

  test('createProduct creates via transaction', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
    const mockTx = {
      product: {
        create: jest.fn().mockResolvedValue(mockProd),
        findUnique: jest.fn().mockResolvedValue(mockProd),
      },
      productVariant: { createMany: jest.fn() },
      productCategory: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    (mockPrisma as any).$transaction = jest.fn().mockImplementation(async (fn: any) => fn(mockTx));
    const r = await createProduct('u1', { name: 'Produit A', price: 5000 });
    expect(r).toBeDefined();
  });

  test('getProduct returns product with reviews', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
    jest
      .spyOn(mockPrisma.product, 'findFirst')
      .mockResolvedValue({ ...mockProd, reviews: [] } as any);
    const r = await getProduct('u1', 'prod-1');
    expect(r.id).toBe('prod-1');
  });

  test('getProduct throws if not found', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
    jest.spyOn(mockPrisma.product, 'findFirst').mockResolvedValue(null);
    await expect(getProduct('u1', 'prod-x')).rejects.toThrow('Product not found');
  });

  test('deleteProduct soft-deletes', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
    jest.spyOn(mockPrisma.product, 'findFirst').mockResolvedValue(mockProd as any);
    jest.spyOn(mockPrisma.product, 'update').mockResolvedValue(mockProd as any);
    const r = await deleteProduct('u1', 'prod-1');
    expect(r.message).toContain('deleted');
  });

  test('getProductStats aggregates', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
    jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(5);
    jest
      .spyOn(mockPrisma.product, 'aggregate')
      .mockResolvedValue({ _sum: { orderCount: 10 } } as any);
    jest.spyOn(mockPrisma.productCategory, 'count').mockResolvedValue(3);
    const r = await getProductStats('u1');
    expect(r.totalProducts).toBe(5);
  });
});
