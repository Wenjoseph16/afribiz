jest.mock('../../services/product', () => ({
  lookupBarcodeByCode: jest.fn(),
}));

import * as productCtrl from '../../controllers/product';
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

describe('product controller — lookupBarcode (Chantier 8)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns found product info when barcode exists', async () => {
    (productService.lookupBarcodeByCode as jest.Mock).mockResolvedValue({
      found: true,
      barcode: '5901234123457',
      name: 'Riz 5kg',
      price: 3500,
      currency: 'FCFA',
      unit: 'sac',
      category: { id: 'cat-1', name: 'Alimentation' },
    });
    const res = mockRes();
    productCtrl.lookupBarcode(req({ params: { code: '5901234123457' } }), res, jest.fn());
    await flush();
    expect(productService.lookupBarcodeByCode).toHaveBeenCalledWith('5901234123457');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ found: true, name: 'Riz 5kg' }),
      })
    );
  });

  it('returns found:false when barcode not in database', async () => {
    (productService.lookupBarcodeByCode as jest.Mock).mockResolvedValue({
      found: false,
      barcode: 'UNKNOWN',
    });
    const res = mockRes();
    productCtrl.lookupBarcode(req({ params: { code: 'UNKNOWN' } }), res, jest.fn());
    await flush();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ found: false }),
      })
    );
  });

  it('trims whitespace from barcode', async () => {
    (productService.lookupBarcodeByCode as jest.Mock).mockResolvedValue({ found: false });
    const res = mockRes();
    productCtrl.lookupBarcode(req({ params: { code: '  12345  ' } }), res, jest.fn());
    await flush();
    expect(productService.lookupBarcodeByCode).toHaveBeenCalledWith('12345');
  });
});
