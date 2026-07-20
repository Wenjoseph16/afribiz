import * as productCtrl from '../../controllers/product';

jest.mock('../../services/product', () => ({
  listProducts: jest.fn(),
  getProduct: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
  duplicateProduct: jest.fn(),
  toggleProductActive: jest.fn(),
  bulkDeleteProducts: jest.fn(),
  exportProducts: jest.fn(),
  importProducts: jest.fn(),
  getProductAnalytics: jest.fn(),
  getProductVariants: jest.fn(),
  updateProductVariant: jest.fn(),
  getProductReviews: jest.fn(),
}));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import * as productService from '../../services/product';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, ...overrides } as any;
}

describe('product controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listProducts', async () => {
    (productService.listProducts as jest.Mock).mockResolvedValue({ data: [], total: 0 });
    const res = mockRes();
    const next = jest.fn();
    productCtrl.listProducts(req({ query: { page: '1', limit: '10' } }), res, next);
    await flush();
    expect(productService.listProducts).toHaveBeenCalledWith('u1', expect.any(Object));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getProduct', async () => {
    (productService.getProduct as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    const next = jest.fn();
    productCtrl.getProduct(req({ params: { id: 'p1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createProduct returns 201', async () => {
    (productService.createProduct as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    const next = jest.fn();
    productCtrl.createProduct(req(), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateProduct', async () => {
    (productService.updateProduct as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    const next = jest.fn();
    productCtrl.updateProduct(req({ params: { id: 'p1' }, body: { name: 'New' } }), res, next);
    await flush();
    expect(productService.updateProduct).toHaveBeenCalledWith('u1', 'p1', { name: 'New' });
  });

  it('deleteProduct', async () => {
    (productService.deleteProduct as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    productCtrl.deleteProduct(req({ params: { id: 'p1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('duplicateProduct returns 201', async () => {
    (productService.duplicateProduct as jest.Mock).mockResolvedValue({ id: 'p2' });
    const res = mockRes();
    const next = jest.fn();
    productCtrl.duplicateProduct(req({ params: { id: 'p1' } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('toggleProductActive', async () => {
    (productService.toggleProductActive as jest.Mock).mockResolvedValue({
      id: 'p1',
      isActive: false,
    });
    const res = mockRes();
    const next = jest.fn();
    productCtrl.toggleProductActive(req({ params: { id: 'p1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    productCtrl.listProducts({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
