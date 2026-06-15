import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as qiService from '../services/quotesInvoices';
import { logger } from '../lib/logger';
import { generateInvoicePdf } from '../services/pdfGenerator';
import { prisma } from '../lib/db';

export const listQuotes = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await qiService.listQuotes(req.user.id, req.query);
  res.json(successResponse(data));
});

export const getQuote = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await qiService.getQuote(req.user.id, req.params.id);
  res.json(successResponse(data));
});

export const createQuote = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await qiService.createQuote(req.user.id, req.body);
  res.status(201).json(successResponse(data));
});

export const updateQuote = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await qiService.updateQuote(req.user.id, req.params.id, req.body);
  res.json(successResponse(data));
});

export const updateQuoteStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await qiService.updateQuoteStatus(req.user.id, req.params.id, req.body.status, req.body.reason);
  res.json(successResponse(data));
});

export const convertQuoteToInvoice = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await qiService.convertQuoteToInvoice(req.user.id, req.params.id);
  res.status(201).json(successResponse(data));
});

export const deleteQuote = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  await qiService.deleteQuote(req.user.id, req.params.id);
  res.json(successResponse({ message: 'Devis supprim\u00e9' }));
});

// ===== INVOICES =====
export const listInvoices = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await qiService.listInvoices(req.user.id, req.query);
  res.json(successResponse(data));
});

export const getInvoice = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await qiService.getInvoice(req.user.id, req.params.id);
  res.json(successResponse(data));
});

export const createInvoice = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await qiService.createInvoice(req.user.id, req.body);
  res.status(201).json(successResponse(data));
});

export const updateInvoiceStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await qiService.updateInvoiceStatus(req.user.id, req.params.id, req.body.status, req.body.reason);
  res.json(successResponse(data));
});

export const updateInvoicePayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await qiService.updateInvoicePayment(req.user.id, req.params.id, req.body);
  res.json(successResponse(data));
});

export const deleteInvoice = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  await qiService.deleteInvoice(req.user.id, req.params.id);
  res.json(successResponse({ message: 'Facture supprim\u00e9e' }));
});

export const getFinStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await qiService.getFinStats(req.user.id);
  res.json(successResponse(data));
});

export const downloadInvoicePdf = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id },
    include: {
      invoiceItems: true,
      client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      business: {
        select: {
          id: true, name: true, logo: true, email: true, phone: true,
          address: true, city: true, country: true, whatsapp: true,
          website: true, taxId: true, settings: true,
        },
      },
    },
  });
  if (!invoice) {
    return res.status(404).json({ success: false, error: 'Facture non trouv\u00e9e' });
  }
  // Verify ownership
  const business = await qiService.getBusinessByOwner(req.user.id, false);
  if (invoice.businessId !== business.id) {
    return res.status(403).json({ success: false, error: 'Acc\u00e8s non autoris\u00e9' });
  }

  try {
    const pdfBuffer = await generateInvoicePdf(invoice as any);
    const filename = `facture_${invoice.invoiceNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('PDF generation error', { error });
    res.status(500).json({ success: false, error: 'Erreur lors de la g\u00e9n\u00e9ration du PDF' });
  }
});

export const downloadQuotePdf = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.status(501).json({ success: false, error: 'G\u00e9n\u00e9ration PDF pour les devis bient\u00f4t disponible' });
});
