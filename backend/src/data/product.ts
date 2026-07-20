/**
 * Product Data Layer
 * Pure database operations — no business logic, no events
 */
import { prisma } from '../lib/db';

// ─── Queries ─────────────────────────────────────

export async function findProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true, variants: true },
  });
}

export async function findProductBySlug(slug: string) {
  return prisma.product.findUnique({ where: { slug } });
}

export async function listProductsByBusiness(
  businessId: string,
  opts?: { isActive?: boolean; featured?: boolean; limit?: number; offset?: number }
) {
  const where: any = { businessId };
  if (opts?.isActive !== undefined) where.isActive = opts.isActive;
  if (opts?.featured !== undefined) where.featured = opts.featured;
  return prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: opts?.limit || 50,
    skip: opts?.offset || 0,
  });
}

export async function countProductsByBusiness(businessId: string, opts?: { isActive?: boolean }) {
  const where: any = { businessId };
  if (opts?.isActive !== undefined) where.isActive = opts.isActive;
  return prisma.product.count({ where });
}

export async function createProduct(data: any) {
  return prisma.product.create({ data });
}

export async function updateProduct(id: string, data: any) {
  return prisma.product.update({ where: { id }, data });
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}

export async function toggleProductActive(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, select: { isActive: true } });
  if (!product) return null;
  return prisma.product.update({ where: { id }, data: { isActive: !product.isActive } });
}

export async function findProductByBusinessAndSlug(businessId: string, slug: string) {
  return prisma.product.findFirst({ where: { businessId, slug } });
}

export async function getProductStats(businessId: string) {
  const [total, active, featured, outOfStock] = await Promise.all([
    prisma.product.count({ where: { businessId } }),
    prisma.product.count({ where: { businessId, isActive: true } }),
    prisma.product.count({ where: { businessId, featured: true } }),
    prisma.product.count({ where: { businessId, stock: 0, isActive: true } }),
  ]);
  return { total, active, featured, outOfStock };
}
