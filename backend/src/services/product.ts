import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { calculatePagination } from '../utils/helpers';

function slugify(text: string): string {
  return text.toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function generateProductSlug(name: string, businessId: string): Promise<string> {
  return (async () => {
    let slug = slugify(name) || 'produit';
    let exists = await prisma.product.findFirst({
      where: { slug, businessId }, select: { id: true }
    });
    let counter = 1;
    while (exists) {
      slug = `${slugify(name) || 'produit'}-${counter}`;
      exists = await prisma.product.findFirst({
        where: { slug, businessId }, select: { id: true }
      });
      counter++;
    }
    return slug;
  })();
}

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('PRODUCTS')) {
    throw new AppError('Module Produits not activated', 403);
  }
  return business;
}

const productInclude = {
  category: true,
  variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' as const } },
  _count: { select: { reviews: true, orderItems: true } },
} as const;

export async function listProducts(ownerId: string, params: any) {
  const business = await getBusinessByOwner(ownerId);
  const { skip, take } = calculatePagination(params.page || 1, params.limit || 20);
  const where: Prisma.ProductWhereInput = {
    businessId: business.id,
    deletedAt: null,
  };
  if (params.categoryId) where.categoryId = params.categoryId;
  if (params.isActive !== undefined) {
    where.isActive = params.isActive === true || params.isActive === 'true';
  }
  if (params.isPromotional !== undefined) {
    where.isPromotional = params.isPromotional === true || params.isPromotional === 'true';
  }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { sku: { contains: params.search, mode: 'insensitive' } },
      { barcode: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.stock === 'out') where.stock = 0;
  else if (params.stock === 'available') where.stock = { gt: 0 };

  const orderBy: any = {};
  if (params.sortBy === 'price') orderBy.price = params.sortOrder || 'asc';
  else if (params.sortBy === 'name') orderBy.name = params.sortOrder || 'asc';
  else if (params.sortBy === 'stock') orderBy.stock = params.sortOrder || 'asc';
  else if (params.sortBy === 'sold') orderBy.orderCount = 'desc';
  else if (params.sortBy === 'rating') orderBy.rating = 'desc';
  else orderBy.createdAt = 'desc';

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, include: productInclude, orderBy, skip, take }),
    prisma.product.count({ where }),
  ]);

  let filtered = products;
  if (params.stock === 'low') {
    filtered = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 0));
  }

  return {
    products: filtered,
    pagination: {
      page: params.page || 1,
      limit: params.limit || 20,
      total,
      totalPages: Math.ceil(total / (params.limit || 20)),
    },
  };
}

export async function getProduct(ownerId: string, productId: string) {
  const business = await getBusinessByOwner(ownerId);
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId: business.id, deletedAt: null },
    include: {
      ...productInclude,
      reviews: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      },
    },
  });
  if (!product) throw new AppError('Product not found', 404);
  return product;
}

export async function createProduct(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const slug = await generateProductSlug(data.name, business.id);

  return prisma.$transaction(async (tx) => {
    const cleaned: any = {};
    Object.keys(data).forEach(k => {
      if (!['variants', 'categoryId'].includes(k)) cleaned[k] = data[k];
    });
    if (data.categoryId) {
      const cat = await tx.productCategory.findFirst({
        where: { id: data.categoryId, businessId: business.id },
      });
      if (!cat) throw new AppError('Category not found or not owned by business', 400);
      cleaned.categoryId = data.categoryId;
    }

    const created = await tx.product.create({
      data: {
        sellerId: ownerId,
        businessId: business.id,
        slug,
        ...cleaned,
        tags: data.tags || [],
        images: data.images || [],
        stock: data.stock ?? 0,
        lowStockThreshold: data.lowStockThreshold ?? 5,
        weightUnit: data.unit || data.weightUnit || 'kg',
        isPromotional: data.isPromotional ?? false,
        promotionalPrice: data.promotionalPrice || undefined,
        discountPercent: data.discountPercent ?? 0,
        weight: data.weight || undefined,
      },
    });

    if (data.variants?.length > 0) {
      await tx.productVariant.createMany({
        data: data.variants.map((v: any) => ({
          productId: created.id,
          name: v.name,
          sku: v.sku || null,
          price: v.price ?? 0,
          stock: v.stock || 0,
        })),
      });
    }

    return tx.product.findUnique({
      where: { id: created.id },
      include: productInclude,
    });
  });
}

export async function updateProduct(ownerId: string, productId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.product.findFirst({
    where: { id: productId, businessId: business.id, deletedAt: null },
  });
  if (!existing) throw new AppError('Product not found', 404);

  return prisma.$transaction(async (tx) => {
    const cleaned: any = {};
    Object.keys(data).forEach(k => {
      if (!['variants', 'categoryId'].includes(k)) cleaned[k] = data[k];
    });
    if (data.categoryId) cleaned.category = { connect: { id: data.categoryId } };
    else if (data.categoryId === null) cleaned.category = { disconnect: true };
    if (data.promotionEndsAt) cleaned.promotionEndsAt = new Date(data.promotionEndsAt);

    await tx.product.update({ where: { id: productId }, data: cleaned });

    if (data.variants !== undefined) {
      await tx.productVariant.deleteMany({ where: { productId } });
      if (data.variants.length > 0) {
        await tx.productVariant.createMany({
          data: data.variants.map((v: any) => ({
            productId,
            name: v.name,
            sku: v.sku || null,
            price: v.price ?? 0,
            stock: v.stock || 0,
            isActive: v.isActive !== undefined ? v.isActive : true,
          })),
        });
      }
    }

    return tx.product.findUnique({
      where: { id: productId },
      include: productInclude,
    });
  });
}

export async function deleteProduct(ownerId: string, productId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.product.findFirst({
    where: { id: productId, businessId: business.id, deletedAt: null },
  });
  if (!existing) throw new AppError('Product not found', 404);

  await prisma.product.update({
    where: { id: productId },
    data: { deletedAt: new Date(), isActive: false },
  });
  return { message: 'Product deleted' };
}

export async function duplicateProduct(ownerId: string, productId: string) {
  const business = await getBusinessByOwner(ownerId);
  const original = await prisma.product.findFirst({
    where: { id: productId, businessId: business.id, deletedAt: null },
    include: { variants: { where: { isActive: true } } },
  });
  if (!original) throw new AppError('Product not found', 404);

  const slug = await generateProductSlug(original.name + ' (copy)', business.id);

  return prisma.$transaction(async (tx) => {
    const dup = await tx.product.create({
      data: {
        sellerId: ownerId,
        businessId: business.id,
        name: original.name + ' (copy)',
        slug,
        shortDescription: original.shortDescription,
        description: original.description,
        sku: original.sku ? original.sku + '-COPY' : null,
        price: original.price,
        currency: original.currency,
        images: original.images,
        tags: original.tags,
        stock: 0,
        lowStockThreshold: original.lowStockThreshold,
        weightUnit: original.weightUnit,
        weight: original.weight,
        categoryId: original.categoryId,
      },
    });

    for (const v of original.variants) {
        await tx.productVariant.create({
          data: {
            productId: dup.id,
            name: v.name,
            sku: v.sku ? v.sku + '-COPY' : null,
            price: v.price,
            stock: 0,
            isActive: v.isActive,
          },
        });
      }
    return tx.product.findUnique({
      where: { id: dup.id },
      include: productInclude,
    });
  });
}

export async function toggleProductActive(ownerId: string, productId: string) {
  const business = await getBusinessByOwner(ownerId);
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId: business.id, deletedAt: null },
  });
  if (!product) throw new AppError('Product not found', 404);

  return prisma.product.update({
    where: { id: productId },
    data: { isActive: !product.isActive },
    include: productInclude,
  });
}

export async function updateStock(ownerId: string, productId: string, stock: number) {
  const business = await getBusinessByOwner(ownerId);
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId: business.id, deletedAt: null },
    select: { id: true },
  });
  if (!product) throw new AppError('Product not found', 404);
  return prisma.product.update({
    where: { id: productId },
    data: { stock: Math.max(0, stock) },
    include: productInclude,
  });
}

export async function listCategories(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.productCategory.findMany({
    where: { businessId: business.id, deletedAt: null },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: 'asc' as const },
  });
}

export async function createCategory(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const slug = slugify(data.name);

  const existing = await prisma.productCategory.findUnique({
    where: { businessId_slug: { businessId: business.id, slug } },
  });
  if (existing) throw new AppError('Category already exists', 409);

  if (data.parentId) {
    const parent = await prisma.productCategory.findFirst({
      where: { id: data.parentId, businessId: business.id },
    });
    if (!parent) throw new AppError('Parent category not found', 404);
  }

  return prisma.productCategory.create({
    data: {
      businessId: business.id,
      name: data.name,
      slug,
      description: data.description,
      icon: data.icon,
      image: data.image,
      parentId: data.parentId || null,
      sortOrder: data.sortOrder || 0,
    },
    include: { _count: { select: { products: true } } },
  });
}

export async function updateCategory(ownerId: string, categoryId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const category = await prisma.productCategory.findFirst({
    where: { id: categoryId, businessId: business.id, deletedAt: null },
  });
  if (!category) throw new AppError('Category not found', 404);

  const updateData: any = { ...data };
  if (data.name) updateData.slug = slugify(data.name);
  if (data.parentId === null) updateData.parentId = null;
  else if (data.parentId) {
    if (data.parentId === categoryId) {
      throw new AppError('Circular reference', 400);
    }
    const parent = await prisma.productCategory.findFirst({
      where: { id: data.parentId, businessId: business.id },
    });
    if (!parent) throw new AppError('Parent category not found', 404);
  }

  return prisma.productCategory.update({
    where: { id: categoryId },
    data: updateData,
    include: {
      children: { where: { isActive: true } },
      _count: { select: { products: true } },
    },
  });
}

export async function deleteCategory(ownerId: string, categoryId: string) {
  const business = await getBusinessByOwner(ownerId);
  const category = await prisma.productCategory.findFirst({
    where: { id: categoryId, businessId: business.id, deletedAt: null },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw new AppError('Category not found', 404);
  if (category._count.products > 0) {
    throw new AppError('Cannot delete: has products', 400);
  }

  await prisma.productCategory.update({
    where: { id: categoryId },
    data: { deletedAt: new Date(), isActive: false },
  });
  return { message: 'Category deleted' };
}

export async function getStockAlerts(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const all = await prisma.product.findMany({
    where: { businessId: business.id, deletedAt: null, isActive: true },
    include: productInclude,
    orderBy: { stock: 'asc' },
  });
  const lowStock = all.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 0));
  const outOfStock = all.filter(p => p.stock === 0);
  return { lowStock, outOfStock, totalAlerts: lowStock.length + outOfStock.length };
}

export async function getProductStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const [total, active, sold, catCount] = await Promise.all([
    prisma.product.count({ where: { businessId: business.id, deletedAt: null } }),
    prisma.product.count({ where: { businessId: business.id, deletedAt: null, isActive: true } }),
    prisma.product.aggregate({
      where: { businessId: business.id, deletedAt: null },
      _sum: { orderCount: true },
    }),
    prisma.productCategory.count({
      where: { businessId: business.id, deletedAt: null, isActive: true },
    }),
  ]);
  return {
    totalProducts: total,
    activeProducts: active,
    inactiveProducts: total - active,
    totalSold: sold._sum?.orderCount || 0,
    categoryCount: catCount,
  };
}

export async function exportProducts(ownerId: string, format: string, params: any) {
  const business = await getBusinessByOwner(ownerId);
  const where: Prisma.ProductWhereInput = { businessId: business.id, deletedAt: null };
  if (params.isActive !== undefined) where.isActive = params.isActive === 'true';
  if (params.categoryId) where.categoryId = params.categoryId;

  const products = await prisma.product.findMany({
    where,
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const rows = products.map(p => ({
    name: p.name,
    shortDescription: p.shortDescription || '',
    description: p.description || '',
    sku: p.sku || '',
    barcode: p.barcode || '',
    category: p.category?.name || '',
    tags: p.tags.join('; '),
    price: Number(p.price),
    currency: p.currency,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold || 5,
    weight: p.weight ? Number(p.weight) : '',
    isActive: p.isActive ? 'Oui' : 'Non',
    isPromotional: p.isPromotional ? 'Oui' : 'Non',
    promotionalPrice: p.promotionalPrice ? Number(p.promotionalPrice) : '',
    discountPercent: p.discountPercent || 0,
    orderCount: p.orderCount,
    rating: p.rating,
    createdAt: p.createdAt.toISOString(),
  }));

  return { products: rows, total: rows.length, format };
}

export async function importProducts(ownerId: string, products: any[]) {
  const business = await getBusinessByOwner(ownerId);
  let imported = 0;
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < products.length; i++) {
    const data = products[i];
    try {
      if (!data.name || !data.price) {
        errors.push({ row: i + 1, error: 'Nom et prix requis' });
        continue;
      }
      const slug = await generateProductSlug(data.name, business.id);
      await prisma.product.create({
        data: {
          sellerId: ownerId,
          businessId: business.id,
          slug,
          name: data.name,
          shortDescription: data.shortDescription || null,
          description: data.description || null,
          sku: data.sku || null,
          barcode: data.barcode || null,
          categoryId: data.categoryId || null,
          tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' ? data.tags.split(/[;,]/).map((t: string) => t.trim()).filter(Boolean) : []),
          price: Number(data.price),
          currency: data.currency || 'FCFA',
          images: data.images || [],
          stock: Number(data.stock) || 0,
          lowStockThreshold: Number(data.lowStockThreshold) || 5,
          unit: data.unit || 'piece',
          weight: data.weight ? Number(data.weight) : undefined,
          isActive: true,
          isPromotional: data.isPromotional === true || data.isPromotional === 'true' || data.isPromotional === 'Oui',
          promotionalPrice: data.promotionalPrice ? Number(data.promotionalPrice) : undefined,
          discountPercent: Number(data.discountPercent) || 0,
        },
      });
      imported++;
    } catch (err: any) {
      errors.push({ row: i + 1, error: err.message || 'Erreur inconnue' });
    }
  }

  return {
    imported,
    total: products.length,
    errors,
    message: `${imported}/${products.length} produits import\u00e9s avec succ\u00e8s`,
  };
}

export async function bulkDeleteProducts(ownerId: string, ids: string[]) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.product.updateMany({
    where: { id: { in: ids }, businessId: business.id, deletedAt: null },
    data: { deletedAt: new Date(), isActive: false },
  });
  return { deleted: ids.length };
}

export async function bulkToggleActive(ownerId: string, ids: string[], isActive: boolean) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.product.updateMany({
    where: { id: { in: ids }, businessId: business.id, deletedAt: null },
    data: { isActive },
  });
  return { updated: ids.length, isActive };
}

export async function bulkUpdateStock(ownerId: string, items: { id: string; stock: number }[]) {
  const business = await getBusinessByOwner(ownerId);
  for (const item of items) {
    await prisma.product.updateMany({
      where: { id: item.id, businessId: business.id, deletedAt: null },
      data: { stock: Math.max(0, item.stock) },
    });
  }
  return { updated: items.length };
}
