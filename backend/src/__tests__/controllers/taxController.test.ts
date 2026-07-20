import { mockPrisma } from '../setup';
import * as taxCtrl from '../../controllers/taxController';

jest.mock('../../services/taxService', () => ({
  listCountryTaxes: jest.fn(),
  getCountryTax: jest.fn(),
  createCountryTax: jest.fn(),
  updateCountryTax: jest.fn(),
  getBusinessTaxConfig: jest.fn(),
  updateBusinessTaxConfig: jest.fn(),
  getTaxReports: jest.fn(),
  generateTaxReport: jest.fn(),
}));

import * as taxService from '../../services/taxService';

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
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('tax controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listCountryTaxes', async () => {
    (taxService.listCountryTaxes as jest.Mock).mockResolvedValue([{ countryCode: 'TG' }]);
    const res = mockRes();
    const next = jest.fn();
    taxCtrl.listCountryTaxes({} as any, res, next);
    await flush();
    expect(taxService.listCountryTaxes).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getCountryTax', async () => {
    (taxService.getCountryTax as jest.Mock).mockResolvedValue({ countryCode: 'TG', taxRate: 0.18 });
    const res = mockRes();
    const next = jest.fn();
    taxCtrl.getCountryTax({ params: { countryCode: 'TG' } } as any, res, next);
    await flush();
    expect(taxService.getCountryTax).toHaveBeenCalledWith('TG');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createCountryTax returns 201', async () => {
    (taxService.createCountryTax as jest.Mock).mockResolvedValue({ countryCode: 'TG' });
    const res = mockRes();
    const next = jest.fn();
    taxCtrl.createCountryTax(
      req({ body: { countryCode: 'TG', countryName: 'Togo', taxRate: 0.18 } }),
      res,
      next
    );
    await flush();
    expect(taxService.createCountryTax).toHaveBeenCalledWith({
      countryCode: 'TG',
      countryName: 'Togo',
      taxRate: 0.18,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createCountryTax should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    taxCtrl.createCountryTax({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('updateCountryTax', async () => {
    (taxService.updateCountryTax as jest.Mock).mockResolvedValue({
      countryCode: 'TG',
      taxRate: 0.2,
    });
    const res = mockRes();
    const next = jest.fn();
    taxCtrl.updateCountryTax(
      req({ params: { countryCode: 'TG' }, body: { taxRate: 0.2 } }),
      res,
      next
    );
    await flush();
    expect(taxService.updateCountryTax).toHaveBeenCalledWith('TG', { taxRate: 0.2 });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getBusinessConfig', async () => {
    (taxService.getBusinessTaxConfig as jest.Mock).mockResolvedValue({
      businessId: 'b1',
      taxRate: 0.18,
    });
    const res = mockRes();
    const next = jest.fn();
    taxCtrl.getBusinessConfig(req(), res, next);
    await flush();
    expect(taxService.getBusinessTaxConfig).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getBusinessConfig should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    taxCtrl.getBusinessConfig({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('generateReport returns 201', async () => {
    (taxService.generateTaxReport as jest.Mock).mockResolvedValue({ id: 'r1' });
    const res = mockRes();
    const next = jest.fn();
    taxCtrl.generateReport(
      req({
        body: {
          periodStart: '2024-01-01',
          periodEnd: '2024-12-31',
          totalRevenue: 10000,
          totalTax: 1800,
          countryCode: 'TG',
        },
      }),
      res,
      next
    );
    await flush();
    expect(taxService.generateTaxReport).toHaveBeenCalledWith('u1', {
      periodStart: '2024-01-01',
      periodEnd: '2024-12-31',
      totalRevenue: 10000,
      totalTax: 1800,
      countryCode: 'TG',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
