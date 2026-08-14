import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId } });
  if (!business) throw new AppError('Business non trouvé pour cet utilisateur', 404);
  return business;
}

export async function listSuppliers(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const suppliers = await prisma.supplier.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  });
  return suppliers;
}

export async function createSupplier(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  if (!data.name?.trim()) throw new AppError('Nom du fournisseur requis', 400);
  const supplier = await prisma.supplier.create({
    data: {
      businessId: business.id,
      name: data.name.trim(),
      contactName: data.contactName || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      note: data.note || null,
    },
  });
  return supplier;
}

export async function updateSupplier(ownerId: string, supplierId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.supplier.findFirst({
    where: { id: supplierId, businessId: business.id },
  });
  if (!existing) throw new AppError('Fournisseur non trouvé', 404);
  const upd: any = {};
  for (const key of ['name', 'contactName', 'phone', 'email', 'address', 'note', 'isActive']) {
    if (data[key] !== undefined) upd[key] = data[key];
  }
  return prisma.supplier.update({ where: { id: supplierId }, data: upd });
}

export async function deleteSupplier(ownerId: string, supplierId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.supplier.findFirst({
    where: { id: supplierId, businessId: business.id },
  });
  if (!existing) throw new AppError('Fournisseur non trouvé', 404);
  await prisma.supplier.delete({ where: { id: supplierId } });
  return { success: true };
}
