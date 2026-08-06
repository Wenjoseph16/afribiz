import { mockPrisma } from '../setup';
import { getCart, addItem, removeItem, applyCoupon, checkout } from '../../services/cart';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({
  publishCartItemAdded: jest.fn(),
  publishCheckoutInitiated: jest.fn(),
  publishCheckoutCompleted: jest.fn(),
  publishOrderPlaced: jest.fn(),
  publishNewClient: jest.fn(),
}));
jest.mock('../../services/paymentProcessor', () => ({
  processMobileMoney: jest
    .fn()
    .mockResolvedValue({ providerRef: 'REF', status: 'SUCCESS', fee: 0 }),
  saveTransaction: jest.fn(),
}));

const mockCart = {
  id: 'cart-1',
  userId: 'u1',
  couponId: null,
  notes: null,
  items: [],
  coupon: null,
};

describe('Cart Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getCart creates new if missing', async () => {
    jest.spyOn(mockPrisma.cart, 'findUnique').mockResolvedValue(null);
    jest.spyOn(mockPrisma.cart, 'create').mockResolvedValue(mockCart as any);
    const r = await getCart('u1');
    expect(r.id).toBe('cart-1');
  });

  test('addItem adds new item', async () => {
    jest.spyOn(mockPrisma.cart, 'findUnique').mockResolvedValue(mockCart as any);
    jest.spyOn(mockPrisma.cart, 'create').mockResolvedValue(mockCart as any);
    jest.spyOn(mockPrisma.cartItem, 'findFirst').mockResolvedValue(null);
    jest.spyOn(mockPrisma.cartItem, 'create').mockResolvedValue({} as any);
    jest.spyOn(mockPrisma.cartItem, 'findMany').mockResolvedValue([]);
    const r = await addItem('u1', { name: 'Prod', quantity: 2, unitPrice: 5000 });
    expect(r).toBeDefined();
  });

  test('removeItem removes item', async () => {
    jest.spyOn(mockPrisma.cart, 'findUnique').mockResolvedValue(mockCart as any);
    jest
      .spyOn(mockPrisma.cartItem, 'findFirst')
      .mockResolvedValue({ id: 'item-1', cartId: 'cart-1', unitPrice: 5000 } as any);
    jest.spyOn(mockPrisma.cartItem, 'delete').mockResolvedValue({} as any);
    jest.spyOn(mockPrisma.cart, 'create').mockResolvedValue(mockCart as any);
    jest.spyOn(mockPrisma.cartItem, 'findMany').mockResolvedValue([]);
    const r = await removeItem('u1', 'item-1');
    expect(r).toBeDefined();
  });

  test('applyCoupon applies valid coupon', async () => {
    jest.spyOn(mockPrisma.coupon, 'findUnique').mockResolvedValue({
      id: 'coup-1',
      code: 'PROMO10',
      status: 'ACTIVE',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      expiresAt: null,
      maxUses: null,
      useCount: 0,
      minOrderAmount: null,
    } as any);
    jest.spyOn(mockPrisma.cart, 'findUnique').mockResolvedValue(mockCart as any);
    jest.spyOn(mockPrisma.cartItem, 'count').mockResolvedValue(1);
    jest
      .spyOn(mockPrisma.cartItem, 'findMany')
      .mockResolvedValue([
        { id: 'i1', cartId: 'cart-1', quantity: 2, unitPrice: 5000, total: 10000 } as any,
      ]);
    jest.spyOn(mockPrisma.cart, 'update').mockResolvedValue(mockCart as any);
    jest.spyOn(mockPrisma.cart, 'create').mockResolvedValue(mockCart as any);
    const r = await applyCoupon('u1', 'PROMO10');
    expect(r).toBeDefined();
  });

  test('checkout creates order', async () => {
    const cartWithItems = {
      ...mockCart,
      items: [
        { id: 'i1', productId: 'p1', name: 'Prod', quantity: 2, unitPrice: 5000, total: 10000 },
      ],
    };
    const mockTx = {
      product: { update: jest.fn() },
      order: { create: jest.fn().mockResolvedValue({ id: 'order-1', items: [], business: {} }) },
    };
    jest.spyOn(mockPrisma.cart, 'findUnique').mockResolvedValue(cartWithItems as any);
    jest.spyOn(mockPrisma.cart, 'create').mockResolvedValue(cartWithItems as any);
    jest.spyOn(mockPrisma.product, 'findUnique').mockResolvedValue({ businessId: 'biz-1' } as any);
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({
      id: 'biz-1',
      name: 'Test Biz',
      ownerId: 'owner-1',
    } as any);
    (mockPrisma as any).$transaction = jest.fn().mockImplementation(async (fn: any) => fn(mockTx));
    jest.spyOn(mockPrisma.cartItem, 'deleteMany').mockResolvedValue({ count: 0 });
    jest.spyOn(mockPrisma.cart, 'update').mockResolvedValue(cartWithItems as any);
    const r = await checkout('u1', { type: 'DELIVERY', paymentMethod: 'CASH' });
    expect(r).toBeDefined();
  });
});
