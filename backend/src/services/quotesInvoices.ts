import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export async function getBusinessByOwner(ownerId: string, requireModule = true) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true, settings: true, logo: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (requireModule && !business.modules.includes('QUOTES_INVOICES'))
    throw new AppError('Module Devis & Factures non activ\u00e9', 403);
  return business;
}

function generateNumber(prefix: string): string {
  const d = new Date();
  return prefix + '-' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + '-' + String(Math.floor(Math.random()*99999)).padStart(5,'0');
}

const quoteInclude = {
  quoteItems: true,
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  invoice: { select: { id: true, invoiceNumber: true, status: true } },
  payments: true,
} satisfies Prisma.QuoteInclude;

const invoiceInclude = {
  invoiceItems: true,
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  quote: { select: { id: true, quoteNumber: true } },
  debt: true,
  payments: true,
} satisfies Prisma.InvoiceInclude;

// ===================== QUOTES =====================

export async function listQuotes(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, status, search } = filters;
  const where: Prisma.QuoteWhereInput = { businessId: business.id };
  if (status) where.status = status as any;
  if (search) where.OR = [
    { quoteNumber: { contains: search, mode: 'insensitive' } },
    { clientName: { contains: search, mode: 'insensitive' } },
    { clientPhone: { contains: search, mode: 'insensitive' } },
  ];
  const skip = (page - 1) * limit;
  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({ where, include: quoteInclude, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.quote.count({ where }),
  ]);
  return { quotes, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getQuote(ownerId: string, quoteId: string) {
  const business = await getBusinessByOwner(ownerId);
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, businessId: business.id }, include: quoteInclude });
  if (!quote) throw new AppError('Devis non trouv\u00e9', 404);
  return quote;
}

export async function createQuote(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const quoteNumber = generateNumber('DEV');

  const subtotal = data.items?.reduce((s: number, i: any) => s + (Number(i.unitPrice) * (i.quantity || 1)), 0) || 0;
  const tax = data.tax ?? 0;
  const discount = data.discount ?? 0;
  const total = subtotal + Number(tax) - Number(discount);

  const expiresAt = data.validityDays ? new Date(Date.now() + data.validityDays * 24 * 60 * 60 * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return prisma.quote.create({
    data: {
      quoteNumber,
      businessId: business.id,
      clientId: data.clientId || null,
      clientName: data.clientName || data.customerName || null,
      clientPhone: data.clientPhone || data.customerPhone || null,
      clientEmail: data.clientEmail || data.customerEmail || null,
      // address not part of Quote model; store in notes if provided
      notes: data.notes || data.customerAddress || data.notes,
      title: data.title,
      description: data.description,
      terms: data.termsConditions,
      subtotal, taxAmount: tax || undefined, discountAmount: discount || undefined,
      totalAmount: total, currency: data.currency || business.settings?.currency || 'FCFA',
      status: 'DRAFT', validUntil: expiresAt,
      quoteItems: { create: (data.items || []).map((i: any) => ({ description: i.description || i.name || '', quantity: i.quantity || 1, unitPrice: i.unitPrice, total: Number(i.unitPrice) * (i.quantity || 1) })) },
    },
    include: quoteInclude,
  });
}

export async function updateQuote(ownerId: string, quoteId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.quote.findFirst({ where: { id: quoteId, businessId: business.id } });
  if (!existing) throw new AppError('Devis non trouv\u00e9', 404);
  if (existing.status !== 'DRAFT') throw new AppError('Seuls les brouillons peuvent \u00eatre modifi\u00e9s', 403);

  const upd: any = {};
  for (const key of ['title','description','notes','terms','validUntil','clientName','clientPhone','clientEmail','currency']) {
    if (data[key] !== undefined) upd[key] = data[key];
  }
  if (data.items) {
    const subtotal = data.items.reduce((s: number, i: any) => s + (Number(i.unitPrice) * (i.quantity || 1)), 0);
    const tax = data.tax ?? 0;
    const discount = data.discount ?? 0;
    upd.subtotal = subtotal; upd.totalAmount = subtotal + Number(tax) - Number(discount); upd.taxAmount = tax; upd.discountAmount = discount;
    await prisma.quoteItem.deleteMany({ where: { quoteId } });
    await prisma.quoteItem.createMany({ data: data.items.map((i: any) => ({ quoteId, description: i.description || i.name || '', quantity: i.quantity || 1, unitPrice: i.unitPrice, total: Number(i.unitPrice) * (i.quantity || 1) })) });
  }
  return prisma.quote.update({ where: { id: quoteId }, data: upd, include: quoteInclude });
}

export async function updateQuoteStatus(ownerId: string, quoteId: string, status: string, reason?: string) {
  const business = await getBusinessByOwner(ownerId);
  const normalizedStatus = status === 'CANCELLED' ? 'REJECTED' : status;
  const upd: any = { status: normalizedStatus };
  if (status === 'CANCELLED' && reason) upd.notes = (upd.notes || '') + '\nCancelled: ' + reason;
  return prisma.quote.update({ where: { id: quoteId }, data: upd, include: quoteInclude });
}

export async function convertQuoteToInvoice(ownerId: string, quoteId: string) {
  const business = await getBusinessByOwner(ownerId);
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, businessId: business.id }, include: { quoteItems: true } });
  if (!quote) throw new AppError('Devis non trouv\u00e9', 404);

  const invoiceNumber = generateNumber('FAC');
  const dueDate = quote.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber, quoteId: quote.id,
      businessId: business.id, clientId: quote.clientId, clientName: quote.clientName,
      clientPhone: quote.clientPhone, clientEmail: quote.clientEmail,
      title: quote.title, description: quote.description, notes: quote.notes, terms: quote.terms,
      subtotal: quote.subtotal, taxAmount: quote.taxAmount, discountAmount: quote.discountAmount,
      totalAmount: quote.totalAmount, amountPaid: 0,
      currency: quote.currency, status: 'DRAFT',
      dueDate,
      invoiceItems: { create: quote.quoteItems.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })) },
    },
    include: invoiceInclude,
  });

  await prisma.quote.update({ where: { id: quoteId }, data: { status: 'CONVERTED' } });

  if (dueDate && Number(invoice.totalAmount) > 0) {
    await prisma.debt.create({
      data: {
        invoiceId: invoice.id,
        businessId: business.id,
        totalAmount: invoice.totalAmount,
        remainingAmount: invoice.totalAmount,
        amountPaid: 0,
        dueDate,
        status: 'ACTIVE',
        priority: 'MEDIUM',
        sourceType: 'INVOICE',
      },
    });
  }

  return prisma.invoice.findUnique({ where: { id: invoice.id }, include: invoiceInclude });
}

export async function acceptQuoteAndConvert(ownerId: string, quoteId: string) {
  await updateQuoteStatus(ownerId, quoteId, 'ACCEPTED');
  return convertQuoteToInvoice(ownerId, quoteId);
}

export async function deleteQuote(ownerId: string, quoteId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.quote.update({ where: { id: quoteId }, data: { status: 'REJECTED' } });
}

// ===================== INVOICES =====================

export async function listInvoices(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, status, search, dateFrom, dateTo, overdue } = filters;
  const where: Prisma.InvoiceWhereInput = { businessId: business.id };
  if (status) where.status = status as any;
  if (overdue === 'true') { where.status = 'OVERDUE'; }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }
  if (search) where.OR = [
    { invoiceNumber: { contains: search, mode: 'insensitive' } },
    { clientName: { contains: search, mode: 'insensitive' } },
    { clientPhone: { contains: search, mode: 'insensitive' } },
  ];
  const skip = (page - 1) * limit;
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({ where, include: invoiceInclude, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.invoice.count({ where }),
  ]);
  return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getInvoice(ownerId: string, invoiceId: string) {
  const business = await getBusinessByOwner(ownerId);
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, businessId: business.id }, include: invoiceInclude });
  if (!invoice) throw new AppError('Facture non trouv\u00e9e', 404);
  return invoice;
}

export async function createInvoice(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const invoiceNumber = generateNumber('FAC');
  const subtotal = data.items?.reduce((s: number, i: any) => s + (Number(i.unitPrice) * (i.quantity || 1)), 0) || 0;
  const tax = data.tax ?? 0;
  const discount = data.discount ?? 0;
  const total = subtotal + Number(tax) - Number(discount);
  const amountPaid = data.amountPaid || 0;
  const remainingAmount = total - Number(amountPaid);
  const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber, businessId: business.id,
      clientId: data.clientId || null, clientName: data.clientName || data.customerName || null, clientPhone: data.clientPhone || data.customerPhone || null,
      clientEmail: data.clientEmail || data.customerEmail || null,
      title: data.title, description: data.description, notes: data.notes, terms: data.termsConditions,
      subtotal, taxAmount: tax || undefined, discountAmount: discount || undefined,
      totalAmount: total, amountPaid, currency: data.currency || business.settings?.currency || 'FCFA',
      status: 'DRAFT',
      dueDate, paidAt: amountPaid >= total ? new Date() : undefined,
      invoiceItems: { create: (data.items || []).map((i: any) => ({ description: i.description || i.name || '', quantity: i.quantity || 1, unitPrice: i.unitPrice, total: Number(i.unitPrice) * (i.quantity || 1) })) },
    },
    include: invoiceInclude,
  });

  // Create debt record linked to the invoice
  if (total > 0) {
    await prisma.debt.create({
      data: {
        invoiceId: invoice.id,
        businessId: business.id,
        totalAmount: total,
        remainingAmount,
        amountPaid: amountPaid || 0,
        dueDate,
        currency: invoice.currency,
        status: remainingAmount <= 0 ? 'SETTLED' : 'ACTIVE',
        priority: 'MEDIUM',
        sourceType: 'INVOICE',
      },
    });
  }

  return prisma.invoice.findUnique({ where: { id: invoice.id }, include: invoiceInclude });
}

export async function updateInvoiceStatus(ownerId: string, invoiceId: string, status: string, reason?: string) {
  const business = await getBusinessByOwner(ownerId);
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, businessId: business.id } });
  if (!invoice) throw new AppError('Facture non trouv\u00e9e', 404);
  const now = new Date();
  const upd: any = { status: status as any };
  if (status === 'PAID') { upd.paidAt = now; upd.amountPaid = Number(invoice.totalAmount); }
  return prisma.invoice.update({ where: { id: invoiceId }, data: upd, include: invoiceInclude });
}

export async function updateInvoicePayment(ownerId: string, invoiceId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, businessId: business.id } });
  if (!invoice) throw new AppError('Facture non trouv\u00e9e', 404);
  const newPaid = Number(invoice.amountPaid || 0) + Number(data.amount || 0);
  const remaining = Number(invoice.totalAmount) - newPaid;
  const upd: any = { amountPaid: newPaid };
  if (remaining <= 0) { upd.status = 'PAID'; upd.paidAt = new Date(); } else { upd.status = 'PARTIALLY_PAID'; }
  // paymentMethod is not a field on Invoice in the current schema
  return prisma.invoice.update({ where: { id: invoiceId }, data: upd, include: invoiceInclude });
}

export async function deleteInvoice(ownerId: string, invoiceId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'CANCELLED' } });
}

export async function getFinStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id };
  const [totalRevenue, paidRevenue, unpaidCount, overdueCount, quoteCount] = await Promise.all([
    prisma.invoice.aggregate({ where: { ...where, status: 'PAID' }, _sum: { totalAmount: true } }),
    prisma.invoice.aggregate({ where: { ...where, status: 'PAID' }, _sum: { amountPaid: true } }),
    prisma.invoice.count({ where: { ...where, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } } }),
    prisma.invoice.count({ where: { ...where, status: 'OVERDUE' } }),
    prisma.quote.count({ where: { ...where, status: { notIn: ['DRAFT', 'CONVERTED'] } } }),
  ]);
  return { totalRevenue: totalRevenue._sum.totalAmount || 0, paidRevenue: paidRevenue._sum.amountPaid || 0, unpaidCount, overdueCount, activeQuotes: quoteCount };
}
