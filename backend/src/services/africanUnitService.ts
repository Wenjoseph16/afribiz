import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export async function listUnits(category?: string, region?: string) {
  const where: any = { isActive: true };
  if (category) where.category = category;
  if (region) where.region = region;
  return prisma.africanUnit.findMany({ where, orderBy: { sortOrder: 'asc' } });
}

export async function getUnit(id: string) {
  const unit = await prisma.africanUnit.findUnique({ where: { id } });
  if (!unit) throw new AppError('Unité non trouvée', 404);
  return unit;
}

export async function createUnit(data: {
  name: string;
  category: string;
  standardUnit: string;
  conversionRate: number;
  description?: string;
  region?: string;
}) {
  return prisma.africanUnit.create({ data: data as any });
}

export async function updateUnit(id: string, data: any) {
  const existing = await prisma.africanUnit.findUnique({ where: { id } });
  if (!existing) throw new AppError('Unité non trouvée', 404);
  return prisma.africanUnit.update({ where: { id }, data });
}

export async function deleteUnit(id: string) {
  const existing = await prisma.africanUnit.findUnique({ where: { id } });
  if (!existing) throw new AppError('Unité non trouvée', 404);
  return prisma.africanUnit.delete({ where: { id } });
}

export async function convertValue(unitId: string, value: number, toStandard?: boolean) {
  const unit = await prisma.africanUnit.findUnique({ where: { id: unitId } });
  if (!unit) throw new AppError('Unité non trouvée', 404);
  const rate = Number(unit.conversionRate);
  if (toStandard) return { value: value * rate, unit: unit.standardUnit };
  return { value: value / rate, unit: unit.name };
}

export async function getCategories() {
  const cats = await prisma.africanUnit.groupBy({ by: ['category'], _count: true });
  return cats.map((c) => ({ category: c.category, count: c._count }));
}
