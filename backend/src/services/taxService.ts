import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessId(ownerId: string) {
  const b = await prisma.business.findFirst({ where: { ownerId }, select: { id: true } });
  if (!b) throw new AppError('Business non trouvé', 404);
  return b.id;
}

export async function listCountryTaxes() {
  return prisma.countryTaxConfig.findMany({
    where: { isActive: true },
    orderBy: { countryName: 'asc' },
  });
}

export async function getCountryTax(countryCode: string) {
  const tax = await prisma.countryTaxConfig.findUnique({ where: { countryCode } });
  if (!tax) throw new AppError('Configuration fiscale non trouvée', 404);
  return tax;
}

export async function createCountryTax(data: {
  countryCode: string;
  countryName: string;
  taxRate: number;
  currency?: string;
  taxName?: string;
}) {
  return prisma.countryTaxConfig.create({ data: { ...data, isActive: true } as any });
}

export async function updateCountryTax(countryCode: string, data: any) {
  const existing = await prisma.countryTaxConfig.findUnique({ where: { countryCode } });
  if (!existing) throw new AppError('Configuration fiscale non trouvée', 404);
  return prisma.countryTaxConfig.update({ where: { countryCode }, data });
}

export async function getBusinessTaxConfig(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  const config = await prisma.businessTaxConfig.findFirst({ where: { businessId } });
  if (!config) {
    const defaultTax = await prisma.countryTaxConfig.findFirst({ where: { isDefault: true } });
    if (defaultTax) {
      return prisma.businessTaxConfig.create({
        data: {
          businessId,
          countryCode: defaultTax.countryCode,
          taxRate: defaultTax.taxRate,
          taxName: defaultTax.taxName,
        } as any,
      });
    }
    throw new AppError('Aucune configuration fiscale par défaut', 404);
  }
  return config;
}

export async function updateBusinessTaxConfig(
  ownerId: string,
  data: { countryCode: string; taxRate?: number; taxId?: string; exempt?: boolean }
) {
  const businessId = await getBusinessId(ownerId);
  return prisma.businessTaxConfig.upsert({
    where: { id: '' },
    create: { businessId, ...data } as any,
    update: data,
  });
}

export async function getTaxReports(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  return prisma.taxReport.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' } });
}

export async function generateTaxReport(
  ownerId: string,
  data: {
    periodStart: string;
    periodEnd: string;
    totalRevenue: number;
    totalTax: number;
    countryCode: string;
  }
) {
  const businessId = await getBusinessId(ownerId);
  return prisma.taxReport.create({
    data: {
      businessId,
      ...data,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
    } as any,
  });
}
