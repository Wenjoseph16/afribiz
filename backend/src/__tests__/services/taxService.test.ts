import { mockPrisma } from '../setup';
import {
  listCountryTaxes,
  getCountryTax,
  createCountryTax,
  updateCountryTax,
  getBusinessTaxConfig,
  updateBusinessTaxConfig,
  getTaxReports,
  generateTaxReport,
} from '../../services/taxService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockCountryTax = {
  countryCode: 'CI',
  countryName: "Côte d'Ivoire",
  taxRate: 18,
  currency: 'XOF',
  taxName: 'TVA',
  isActive: true,
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Tax Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('listCountryTaxes returns active taxes', async () => {
    jest.spyOn(mockPrisma.countryTaxConfig, 'findMany').mockResolvedValue([mockCountryTax as any]);
    const r = await listCountryTaxes();
    expect(r).toHaveLength(1);
  });

  test('getCountryTax returns by code', async () => {
    jest.spyOn(mockPrisma.countryTaxConfig, 'findUnique').mockResolvedValue(mockCountryTax as any);
    const r = await getCountryTax('CI');
    expect(r.countryCode).toBe('CI');
  });

  test('getCountryTax throws if not found', async () => {
    jest.spyOn(mockPrisma.countryTaxConfig, 'findUnique').mockResolvedValue(null);
    await expect(getCountryTax('XX')).rejects.toThrow('Configuration fiscale non trouvée');
  });

  test('createCountryTax creates new tax config', async () => {
    jest.spyOn(mockPrisma.countryTaxConfig, 'create').mockResolvedValue(mockCountryTax as any);
    const r = await createCountryTax({
      countryCode: 'CI',
      countryName: "Côte d'Ivoire",
      taxRate: 18,
    });
    expect(r.countryCode).toBe('CI');
  });

  test('updateCountryTax updates existing', async () => {
    jest.spyOn(mockPrisma.countryTaxConfig, 'findUnique').mockResolvedValue(mockCountryTax as any);
    jest
      .spyOn(mockPrisma.countryTaxConfig, 'update')
      .mockResolvedValue({ ...mockCountryTax, taxRate: 20 } as any);
    const r = await updateCountryTax('CI', { taxRate: 20 });
    expect(r.taxRate).toBe(20);
  });

  test('getBusinessTaxConfig returns config or creates default', async () => {
    const mockBiz = { id: 'b1' };
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
    jest.spyOn(mockPrisma.businessTaxConfig, 'findFirst').mockResolvedValue(null);
    jest.spyOn(mockPrisma.countryTaxConfig, 'findFirst').mockResolvedValue(mockCountryTax as any);
    jest.spyOn(mockPrisma.businessTaxConfig, 'create').mockResolvedValue({
      id: 'btc-1',
      businessId: 'b1',
      countryCode: 'CI',
      taxRate: 18,
      taxName: 'TVA',
    } as any);
    const r = await getBusinessTaxConfig('owner-1');
    expect(r.taxRate).toBe(18);
  });

  test('updateBusinessTaxConfig upserts config', async () => {
    const mockBiz = { id: 'b1' };
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
    jest.spyOn(mockPrisma.businessTaxConfig, 'upsert').mockResolvedValue({
      id: 'btc-1',
      businessId: 'b1',
      countryCode: 'CI',
      taxRate: 18,
      taxId: 'TAX-001',
    } as any);
    const r = await updateBusinessTaxConfig('owner-1', { countryCode: 'CI', taxRate: 18 });
    expect(r.taxRate).toBe(18);
  });

  test('getTaxReports returns reports', async () => {
    const mockBiz = { id: 'b1' };
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
    jest.spyOn(mockPrisma.taxReport, 'findMany').mockResolvedValue([
      {
        id: 'tr-1',
        businessId: 'b1',
        periodStart: new Date(),
        periodEnd: new Date(),
        totalRevenue: 1000,
        totalTax: 180,
        countryCode: 'CI',
      } as any,
    ]);
    const r = await getTaxReports('owner-1');
    expect(r).toHaveLength(1);
  });

  test('generateTaxReport creates report', async () => {
    const mockBiz = { id: 'b1' };
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
    jest.spyOn(mockPrisma.taxReport, 'create').mockResolvedValue({
      id: 'tr-1',
      businessId: 'b1',
      periodStart: new Date(),
      periodEnd: new Date(),
      totalRevenue: 1000,
      totalTax: 180,
      countryCode: 'CI',
    } as any);
    const r = await generateTaxReport('owner-1', {
      periodStart: '2026-01-01',
      periodEnd: '2026-03-31',
      totalRevenue: 1000,
      totalTax: 180,
      countryCode: 'CI',
    });
    expect(r.totalRevenue).toBe(1000);
  });
});
