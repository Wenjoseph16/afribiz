import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as qiService from '../services/quotesInvoices';
import { prisma } from '../lib/db';

export const listMyQuotes = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await qiService.listClientQuotes(req.user.id, req.query);
  res.json(successResponse(data));
});

export const getMyQuote = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await qiService.getClientQuote(req.user.id, req.params.id);
  res.json(successResponse(data));
});

export const listMyInvoices = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await qiService.listClientInvoices(req.user.id, req.query);
  res.json(successResponse(data));
});

export const getMyInvoice = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await qiService.getClientInvoice(req.user.id, req.params.id);
  res.json(successResponse(data));
});

export const getMyInvoiceStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await qiService.listClientInvoicesStats(req.user.id);
    res.json(successResponse(data));
  }
);

export const downloadMyInvoicePdf = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, clientId: req.user.id },
      include: {
        invoiceItems: true,
        business: {
          select: {
            id: true,
            name: true,
            logo: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            country: true,
            whatsapp: true,
            website: true,
            taxId: true,
          },
        },
      },
    });
    if (!invoice) throw new AppError('Facture non trouvée', 404);

    const { generateInvoicePdf } = await import('../services/pdfGenerator');
    const pdfBuffer = await generateInvoicePdf(invoice as any);
    const filename = `facture_${invoice.invoiceNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  }
);
