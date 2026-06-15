import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { searchIdsByText } from '../lib/fulltext';
import { trackSearchQuery } from './dataHubAnalytics';

export async function globalSearch(ownerId: string, query: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId },
    select: { id: true },
  });

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  const businessId = business.id;
  const hasQuery = query.trim().length > 0;

  let products: any[], services: any[], menuItems: any[], bookings: any[],
      quotes: any[], invoices: any[], debts: any[], clients: any[],
      disputes: any[], documents: any[];

  if (!hasQuery) {
    const baseWhere = { businessId, deletedAt: null };
    [products, services, menuItems, bookings, quotes, invoices, debts, clients, disputes, documents] = await Promise.all([
      prisma.product.findMany({ where: baseWhere }),
      prisma.service.findMany({ where: baseWhere }),
      prisma.menuItem.findMany({ where: baseWhere }),
      prisma.booking.findMany({ where: baseWhere }),
      prisma.quote.findMany({ where: baseWhere }),
      prisma.invoice.findMany({ where: baseWhere }),
      prisma.debt.findMany({ where: { businessId } }),
      prisma.user.findMany({ where: { orders: { some: { businessId } } } }),
      prisma.dispute.findMany({ where: baseWhere }),
      prisma.businessDocument.findMany({ where: baseWhere }),
    ]);
    const allOrders = await prisma.order.findMany({
      where: { businessId },
      select: { id: true, orderNumber: true, totalAmount: true, status: true, contactName: true },
    });
    return { clients, orders: allOrders, bookings, quotes, invoices, products, services, menuItems, debts, disputes, documents };
  }

  const orderMatch = await prisma.order.findMany({
    where: { businessId, orderNumber: { contains: query, mode: 'insensitive' } },
    select: { id: true, orderNumber: true, totalAmount: true, status: true, contactName: true },
  });

  const FTS_ENTITIES = [
    { table: 'Product', fields: ['name', 'description'], clientKey: 'product' as const },
    { table: 'Service', fields: ['name', 'description'], clientKey: 'service' as const },
    { table: 'MenuItem', fields: ['name', 'description'], clientKey: 'menuItem' as const },
    { table: 'Booking', fields: ['customerName', 'title'], clientKey: 'booking' as const },
    { table: 'Quote', fields: ['clientName', 'quoteNumber'], clientKey: 'quote' as const },
    { table: 'Invoice', fields: ['clientName', 'invoiceNumber'], clientKey: 'invoice' as const },
    { table: 'Dispute', fields: ['title'], clientKey: 'dispute' as const },
    { table: 'BusinessDocument', fields: ['title'], clientKey: 'businessDocument' as const },
  ];

  const ftsResults = await Promise.all(
    FTS_ENTITIES.map(({ table, fields, clientKey }) =>
      searchIdsByText(table, fields, query, undefined, undefined, businessId).then(ids =>
        ids.length > 0 ? (prisma[clientKey] as any).findMany({ where: { id: { in: ids } } }) : []
      )
    )
  );

  [products, services, menuItems, bookings, quotes, invoices, disputes, documents] = ftsResults;

  // Debts: search by notes + buyer name
  debts = await (async () => {
    const ids = await searchIdsByText('Debt', ['notes'], query, undefined, undefined, businessId);
    const buyerIds = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
        debts: { some: { businessId } },
      },
      select: { id: true },
    });
    const buyerIdList = buyerIds.map(b => b.id);
    if (ids.length === 0 && buyerIdList.length === 0) return [];
    return prisma.debt.findMany({
      where: {
        businessId,
        OR: [
          ...(ids.length > 0 ? [{ id: { in: ids } }] : []),
          ...(buyerIdList.length > 0 ? [{ buyerId: { in: buyerIdList } }] : []),
        ],
      },
    });
  })();

  // Clients: search user table by name/email with orders in this business
  clients = await prisma.user.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
      orders: { some: { businessId } },
    },
  });

  const results = {
    clients,
    orders: orderMatch,
    bookings,
    quotes,
    invoices,
    products,
    services,
    menuItems,
    debts,
    disputes,
    documents,
  };
  const totalCount = Object.values(results).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
  trackSearchQuery(query, totalCount);
  return results;
}
