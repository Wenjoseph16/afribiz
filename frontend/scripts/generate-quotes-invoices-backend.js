const fs = require('fs');

// ===== SERVICE =====
const serviceContent = `import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string, requireModule = true) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true, settings: true, logo: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (requireModule && !business.modules.includes('QUOTES_INVOICES'))
    throw new AppError('Module Devis & Factures non activ\\u00e9', 403);
  return business;
}

function generateNumber(prefix: string): string {
  const d = new Date();
  return prefix + '-' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + '-' + String(Math.floor(Math.random()*99999)).padStart(5,'0');
}

const quoteInclude = {
  items: true,
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  convertedInvoice: { select: { id: true, invoiceNumber: true, status: true } },
  payments: true,
} satisfies Prisma.QuoteInclude;

const invoiceInclude = {
  items: true,
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  quote: { select: { id: true, quoteNumber: true } },
  order: { select: { id: true, orderNumber: true } },
  debt: true,
  payments: true,
} satisfies Prisma.InvoiceInclude;

// ===================== QUOTES =====================

export async function listQuotes(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, status, search } = filters;
  const where: Prisma.QuoteWhereInput = { businessId: business.id, deletedAt: null };
  if (status) where.status = status as any;
  if (search) where.OR = [
    { quoteNumber: { contains: search, mode: 'insensitive' } },
    { customerName: { contains: search, mode: 'insensitive' } },
    { customerPhone: { contains: search, mode: 'insensitive' } },
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
  if (!quote) throw new AppError('Devis non trouv\\u00e9', 404);
  return quote;
}

export async function createQuote(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const quoteNumber = generateNumber('DEV');

  const subtotal = data.items?.reduce((s: number, i: any) => s + (Number(i.unitPrice) * (i.quantity || 1)), 0) || 0;
  const tax = data.tax ?? (data.taxRate ? subtotal * (Number(data.taxRate) / 100) : 0);
  const discount = data.discount ?? (data.discountPercent ? subtotal * (Number(data.discountPercent) / 100) : 0);
  const total = subtotal + Number(tax) - Number(discount);

  const expiresAt = data.validityDays ? new Date(Date.now() + data.validityDays * 24 * 60 * 60 * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return prisma.quote.create({
    data: {
      quoteNumber,
      businessId: business.id,
      clientId: data.clientId || null,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      customerAddress: data.customerAddress,
      title: data.title,
      description: data.description,
      notes: data.notes,
      termsConditions: data.termsConditions,
      validityDays: data.validityDays || 30,
      subtotal, tax, taxRate: data.taxRate || 0, discount, discountPercent: data.discountPercent || 0,
      total, currency: data.currency || business.settings?.currency || 'FCFA',
      status: 'DRAFT', expiresAt,
      items: { create: (data.items || []).map((i: any) => ({ productId: i.productId, serviceId: i.serviceId, name: i.name, description: i.description, quantity: i.quantity || 1, unitPrice: i.unitPrice, total: Number(i.unitPrice) * (i.quantity || 1), sku: i.sku })) },
    },
    include: quoteInclude,
  });
}

export async function updateQuote(ownerId: string, quoteId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.quote.findFirst({ where: { id: quoteId, businessId: business.id } });
  if (!existing) throw new AppError('Devis non trouv\\u00e9', 404);
  if (existing.status !== 'DRAFT') throw new AppError('Seuls les brouillons peuvent \\u00eatre modifi\\u00e9s', 403);

  const upd: any = {};
  for (const key of ['title','description','notes','termsConditions','validityDays','customerName','customerPhone','customerEmail','customerAddress','currency','taxRate','discountPercent']) {
    if (data[key] !== undefined) upd[key] = data[key];
  }
  if (data.items) {
    const subtotal = data.items.reduce((s: number, i: any) => s + (Number(i.unitPrice) * (i.quantity || 1)), 0);
    const tax = data.tax ?? (data.taxRate ? subtotal * (Number(data.taxRate) / 100) : 0);
    const discount = data.discount ?? (data.discountPercent ? subtotal * (Number(data.discountPercent) / 100) : 0);
    upd.subtotal = subtotal; upd.total = subtotal + Number(tax) - Number(discount);
    await prisma.quoteItem.deleteMany({ where: { quoteId } });
    await prisma.quoteItem.createMany({ data: data.items.map((i: any) => ({ quoteId, productId: i.productId, serviceId: i.serviceId, name: i.name, description: i.description, quantity: i.quantity || 1, unitPrice: i.unitPrice, total: Number(i.unitPrice) * (i.quantity || 1), sku: i.sku })) });
  }
  return prisma.quote.update({ where: { id: quoteId }, data: upd, include: quoteInclude });
}

export async function updateQuoteStatus(ownerId: string, quoteId: string, status: string, reason?: string) {
  const business = await getBusinessByOwner(ownerId);
  const now = new Date();
  const upd: any = { status: status as any };
  switch (status) {
    case 'SENT': upd.sentAt = now; break;
    case 'VIEWED': upd.viewedAt = now; break;
    case 'ACCEPTED': upd.acceptedAt = now; break;
    case 'REFUSED': upd.refusedAt = now; upd.refuseReason = reason || null; break;
    case 'CONVERTED': upd.acceptedAt = now; break;
  }
  return prisma.quote.update({ where: { id: quoteId, businessId: business.id }, data: upd, include: quoteInclude });
}

export async function convertQuoteToInvoice(ownerId: string, quoteId: string) {
  const business = await getBusinessByOwner(ownerId);
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, businessId: business.id }, include: { items: true } });
  if (!quote) throw new AppError('Devis non trouv\\u00e9', 404);

  const invoiceNumber = generateNumber('FAC');
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber, quoteId: quote.id, sourceType: 'QUOTE',
      businessId: business.id, clientId: quote.clientId, customerName: quote.customerName,
      customerPhone: quote.customerPhone, customerEmail: quote.customerEmail, customerAddress: quote.customerAddress,
      title: quote.title, description: quote.description, notes: quote.notes, termsConditions: quote.termsConditions,
      subtotal: quote.subtotal, tax: quote.tax, taxRate: quote.taxRate, discount: quote.discount,
      discountPercent: quote.discountPercent, total: quote.total, paidAmount: 0, remainingAmount: quote.total,
      currency: quote.currency, status: 'DRAFT', paymentStatus: 'PENDING',
      items: { create: quote.items.map(i => ({ name: i.name, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total, productId: i.productId, serviceId: i.serviceId, sku: i.sku })) },
    },
    include: invoiceInclude,
  });

  await prisma.quote.update({ where: { id: quoteId }, data: { status: 'CONVERTED', convertedInvoiceId: invoice.id } });
  return invoice;
}

export async function deleteQuote(ownerId: string, quoteId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.quote.update({ where: { id: quoteId, businessId: business.id }, data: { deletedAt: new Date() } });
}

// ===================== INVOICES =====================

export async function listInvoices(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, status, search, type, dateFrom, dateTo, overdue } = filters;
  const where: Prisma.InvoiceWhereInput = { businessId: business.id, deletedAt: null };
  if (status) where.status = status as any;
  if (type) where.sourceType = type;
  if (overdue === 'true') where.status = 'SENT'; where.dueDate = { lt: new Date() };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }
  if (search) where.OR = [
    { invoiceNumber: { contains: search, mode: 'insensitive' } },
    { customerName: { contains: search, mode: 'insensitive' } },
    { customerPhone: { contains: search, mode: 'insensitive' } },
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
  if (!invoice) throw new AppError('Facture non trouv\\u00e9e', 404);
  return invoice;
}

export async function createInvoice(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const invoiceNumber = generateNumber('FAC');
  const subtotal = data.items?.reduce((s: number, i: any) => s + (Number(i.unitPrice) * (i.quantity || 1)), 0) || 0;
  const tax = data.tax ?? (data.taxRate ? subtotal * (Number(data.taxRate) / 100) : 0);
  const discount = data.discount ?? (data.discountPercent ? subtotal * (Number(data.discountPercent) / 100) : 0);
  const total = subtotal + Number(tax) - Number(discount);
  const paidAmount = data.paidAmount || 0;
  const remainingAmount = total - Number(paidAmount);
  const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber, businessId: business.id, sourceType: data.sourceType || 'MANUAL',
      clientId: data.clientId || null, customerName: data.customerName, customerPhone: data.customerPhone,
      customerEmail: data.customerEmail, customerAddress: data.customerAddress,
      title: data.title, description: data.description, notes: data.notes, termsConditions: data.termsConditions,
      subtotal, tax, taxRate: data.taxRate || 0, discount, discountPercent: data.discountPercent || 0,
      total, paidAmount, remainingAmount, currency: data.currency || business.settings?.currency || 'FCFA',
      paymentMethod: data.paymentMethod, status: 'DRAFT', paymentStatus: paidAmount >= total ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING',
      dueDate, paidAt: paidAmount >= total ? new Date() : null,
      items: { create: (data.items || []).map((i: any) => ({ productId: i.productId, serviceId: i.serviceId, name: i.name, description: i.description, quantity: i.quantity || 1, unitPrice: i.unitPrice, total: Number(i.unitPrice) * (i.quantity || 1), sku: i.sku, tax: i.tax || 0 })) },
    },
    include: invoiceInclude,
  });

  // Create debt if partially paid
  if (remainingAmount > 0) {
    await prisma.debt.create({
      data: {
        invoiceId: invoice.id, businessId: business.id, clientId: data.clientId,
        totalAmount: remainingAmount, remainingAmount, dueDate,
        status: 'ACTIVE',
      },
    });
  }

  return prisma.invoice.findUnique({ where: { id: invoice.id }, include: invoiceInclude });
}

export async function updateInvoiceStatus(ownerId: string, invoiceId: string, status: string, reason?: string) {
  const business = await getBusinessByOwner(ownerId);
  const now = new Date();
  const upd: any = { status: status as any };
  switch (status) {
    case 'SENT': upd.sentAt = now; break;
    case 'PAID': upd.paidAt = now; upd.paymentStatus = 'PAID'; upd.paidAmount = { equals: prisma.invoice.fields.total }; upd.remainingAmount = 0; break;
    case 'CANCELLED': upd.cancelledAt = now; upd.cancelReason = reason || null; break;
    case 'OVERDUE': upd.overdueAt = now; break;
  }
  return prisma.invoice.update({ where: { id: invoiceId, businessId: business.id }, data: upd, include: invoiceInclude });
}

export async function updateInvoicePayment(ownerId: string, invoiceId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, businessId: business.id } });
  if (!invoice) throw new AppError('Facture non trouv\\u00e9e', 404);
  const newPaid = Number(invoice.paidAmount) + Number(data.amount || 0);
  const remaining = Number(invoice.total) - newPaid;
  const upd: any = { paidAmount: newPaid, remainingAmount: Math.max(0, remaining) };
  if (remaining <= 0) { upd.paymentStatus = 'PAID'; upd.status = 'PAID'; upd.paidAt = new Date(); }
  else { upd.paymentStatus = 'PARTIALLY_PAID'; }
  if (data.paymentMethod) upd.paymentMethod = data.paymentMethod;
  return prisma.invoice.update({ where: { id: invoiceId }, data: upd, include: invoiceInclude });
}

export async function deleteInvoice(ownerId: string, invoiceId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.invoice.update({ where: { id: invoiceId, businessId: business.id }, data: { deletedAt: new Date() } });
}

export async function getFinStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id, deletedAt: null };
  const [totalRevenue, paidRevenue, unpaidCount, overdueCount, quoteCount] = await Promise.all([
    prisma.invoice.aggregate({ where: { ...where, status: 'PAID' }, _sum: { total: true } }),
    prisma.invoice.aggregate({ where: { ...where, status: 'PAID' }, _sum: { paidAmount: true } }),
    prisma.invoice.count({ where: { ...where, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } } }),
    prisma.invoice.count({ where: { ...where, status: 'OVERDUE' } }),
    prisma.quote.count({ where: { ...where, status: { notIn: ['DRAFT', 'CONVERTED'] } } }),
  ]);
  return { totalRevenue: totalRevenue._sum.total || 0, paidRevenue: paidRevenue._sum.paidAmount || 0, unpaidCount, overdueCount, activeQuotes: quoteCount };
}
`;

fs.writeFileSync('backend/src/services/quotesInvoices.ts', serviceContent, 'utf8');
console.log('✅ backend/src/services/quotesInvoices.ts created');

// ===== CONTROLLER =====
const controllerContent = `import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as qiService from '../services/quotesInvoices';

export const listQuotes = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const data = await qiService.listQuotes(req.user.id, req.query);
  res.json(successResponse(data));
});

export const getQuote = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const data = await qiService.getQuote(req.user.id, req.params.id);
  res.json(successResponse(data));
});

export const createQuote = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const data = await qiService.createQuote(req.user.id, req.body);
  res.status(201).json(successResponse(data));
});

export const updateQuote = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const data = await qiService.updateQuote(req.user.id, req.params.id, req.body);
  res.json(successResponse(data));
});

export const updateQuoteStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const data = await qiService.updateQuoteStatus(req.user.id, req.params.id, req.body.status, req.body.reason);
  res.json(successResponse(data));
});

export const convertQuoteToInvoice = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const data = await qiService.convertQuoteToInvoice(req.user.id, req.params.id);
  res.status(201).json(successResponse(data));
});

export const deleteQuote = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  await qiService.deleteQuote(req.user.id, req.params.id);
  res.json(successResponse({ message: 'Devis supprim\\u00e9' }));
});

// ===== INVOICES =====
export const listInvoices = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const data = await qiService.listInvoices(req.user.id, req.query);
  res.json(successResponse(data));
});

export const getInvoice = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const data = await qiService.getInvoice(req.user.id, req.params.id);
  res.json(successResponse(data));
});

export const createInvoice = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const data = await qiService.createInvoice(req.user.id, req.body);
  res.status(201).json(successResponse(data));
});

export const updateInvoiceStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const data = await qiService.updateInvoiceStatus(req.user.id, req.params.id, req.body.status, req.body.reason);
  res.json(successResponse(data));
});

export const updateInvoicePayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const data = await qiService.updateInvoicePayment(req.user.id, req.params.id, req.body);
  res.json(successResponse(data));
});

export const deleteInvoice = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  await qiService.deleteInvoice(req.user.id, req.params.id);
  res.json(successResponse({ message: 'Facture supprim\\u00e9e' }));
});

export const getFinStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const data = await qiService.getFinStats(req.user.id);
  res.json(successResponse(data));
});
`;

fs.writeFileSync('backend/src/controllers/quotesInvoices.ts', controllerContent, 'utf8');
console.log('✅ backend/src/controllers/quotesInvoices.ts created');

// ===== ROUTES =====
const routesContent = `import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { listQuotes, getQuote, createQuote, updateQuote, updateQuoteStatus, convertQuoteToInvoice, deleteQuote,
  listInvoices, getInvoice, createInvoice, updateInvoiceStatus, updateInvoicePayment, deleteInvoice, getFinStats } from '../controllers/quotesInvoices';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

// Stats
router.get('/stats', getFinStats);

// Quotes
router.get('/quotes', listQuotes);
router.post('/quotes', createQuote);
router.get('/quotes/:id', getQuote);
router.put('/quotes/:id', updateQuote);
router.put('/quotes/:id/status', updateQuoteStatus);
router.post('/quotes/:id/convert', convertQuoteToInvoice);
router.delete('/quotes/:id', deleteQuote);

// Invoices
router.get('/invoices', listInvoices);
router.post('/invoices', createInvoice);
router.get('/invoices/:id', getInvoice);
router.put('/invoices/:id/status', updateInvoiceStatus);
router.put('/invoices/:id/payment', updateInvoicePayment);
router.delete('/invoices/:id', deleteInvoice);

export default router;
`;

fs.writeFileSync('backend/src/routes/quotesInvoices.ts', routesContent, 'utf8');
console.log('✅ backend/src/routes/quotesInvoices.ts created');
console.log('\\n=== Module 7 backend complete! ===');
