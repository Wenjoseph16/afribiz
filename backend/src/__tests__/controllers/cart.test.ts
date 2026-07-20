import * as cartCtrl from '../../controllers/cart';

jest.mock('../../services/cart', () => ({
  getCart: jest.fn(),
  addItem: jest.fn(),
  updateItem: jest.fn(),
  removeItem: jest.fn(),
  clearCart: jest.fn(),
  applyCoupon: jest.fn(),
  removeCoupon: jest.fn(),
  guestCheckout: jest.fn(),
  checkout: jest.fn(),
}));

import * as cartService from '../../services/cart';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, ...overrides } as any;
}

describe('cart controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getCart', async () => {
    (cartService.getCart as jest.Mock).mockResolvedValue({ items: [] });
    const res = mockRes();
    const next = jest.fn();
    cartCtrl.getCart(req(), res, next);
    await flush();
    expect(cartService.getCart).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('addItem', async () => {
    (cartService.addItem as jest.Mock).mockResolvedValue({ items: [{ productId: 'p1' }] });
    const res = mockRes();
    const next = jest.fn();
    cartCtrl.addItem(req({ body: { productId: 'p1', quantity: 2 } }), res, next);
    await flush();
    expect(cartService.addItem).toHaveBeenCalledWith('u1', { productId: 'p1', quantity: 2 });
  });

  it('updateItem', async () => {
    (cartService.updateItem as jest.Mock).mockResolvedValue({ items: [] });
    const res = mockRes();
    const next = jest.fn();
    cartCtrl.updateItem(req({ params: { itemId: 'i1' }, body: { quantity: 1 } }), res, next);
    await flush();
    expect(cartService.updateItem).toHaveBeenCalledWith('u1', 'i1', { quantity: 1 });
  });

  it('removeItem', async () => {
    (cartService.removeItem as jest.Mock).mockResolvedValue({ items: [] });
    const res = mockRes();
    const next = jest.fn();
    cartCtrl.removeItem(req({ params: { itemId: 'i1' } }), res, next);
    await flush();
    expect(cartService.removeItem).toHaveBeenCalledWith('u1', 'i1');
  });

  it('clearCart', async () => {
    (cartService.clearCart as jest.Mock).mockResolvedValue({ items: [] });
    const res = mockRes();
    const next = jest.fn();
    cartCtrl.clearCart(req(), res, next);
    await flush();
    expect(cartService.clearCart).toHaveBeenCalledWith('u1');
  });

  it('applyCoupon', async () => {
    (cartService.applyCoupon as jest.Mock).mockResolvedValue({ discount: 1000 });
    const res = mockRes();
    const next = jest.fn();
    cartCtrl.applyCoupon(req({ body: { code: 'PROMO10' } }), res, next);
    await flush();
    expect(cartService.applyCoupon).toHaveBeenCalledWith('u1', 'PROMO10');
  });

  it('removeCoupon', async () => {
    (cartService.removeCoupon as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    cartCtrl.removeCoupon(req(), res, next);
    await flush();
    expect(cartService.removeCoupon).toHaveBeenCalledWith('u1');
  });

  it('guestCheckoutCtrl returns 201', async () => {
    (cartService.guestCheckout as jest.Mock).mockResolvedValue({ orderId: 'o1' });
    const res = mockRes();
    const next = jest.fn();
    cartCtrl.guestCheckoutCtrl({ body: { items: [] } } as any, res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('checkout returns 201', async () => {
    (cartService.checkout as jest.Mock).mockResolvedValue({ orderId: 'o1' });
    const res = mockRes();
    const next = jest.fn();
    cartCtrl.checkout(req({ body: { paymentMethod: 'CARD' } }), res, next);
    await flush();
    expect(cartService.checkout).toHaveBeenCalledWith('u1', { paymentMethod: 'CARD' });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    cartCtrl.getCart({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
