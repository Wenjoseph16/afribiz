import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { listQuotes, getQuote, createQuote, updateQuote, updateQuoteStatus, convertQuoteToInvoice, deleteQuote,
  listInvoices, getInvoice, createInvoice, updateInvoiceStatus, updateInvoicePayment, deleteInvoice, getFinStats, downloadInvoicePdf, downloadQuotePdf } from '../controllers/quotesInvoices';
import { createQuoteSchema, updateQuoteSchema, updateQuoteStatusSchema, createInvoiceSchema, updateInvoiceStatusSchema, updateInvoicePaymentSchema } from '../validators/quotesInvoices';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

// Stats
router.get('/stats', getFinStats);

// Quotes
router.get('/quotes', listQuotes);
router.post('/quotes', validateBody(createQuoteSchema), createQuote);
router.get('/quotes/:id', getQuote);
router.put('/quotes/:id', validateBody(updateQuoteSchema), updateQuote);
router.put('/quotes/:id/status', validateBody(updateQuoteStatusSchema), updateQuoteStatus);
router.post('/quotes/:id/convert', convertQuoteToInvoice);
router.delete('/quotes/:id', deleteQuote);

// Invoices
router.get('/invoices', listInvoices);
router.post('/invoices', validateBody(createInvoiceSchema), createInvoice);
router.get('/invoices/:id', getInvoice);
router.put('/invoices/:id/status', validateBody(updateInvoiceStatusSchema), updateInvoiceStatus);
router.put('/invoices/:id/payment', validateBody(updateInvoicePaymentSchema), updateInvoicePayment);
router.delete('/invoices/:id', deleteInvoice);

// PDF Downloads
router.get('/invoices/:id/pdf', downloadInvoicePdf);
router.get('/quotes/:id/pdf', downloadQuotePdf);

export default router;
