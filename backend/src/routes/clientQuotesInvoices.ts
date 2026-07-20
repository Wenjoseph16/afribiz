import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listMyQuotes,
  getMyQuote,
  listMyInvoices,
  getMyInvoice,
  getMyInvoiceStats,
  downloadMyInvoicePdf,
} from '../controllers/clientQuotesInvoices';

const router = Router();
router.use(authMiddleware);

// Client quotes
router.get('/quotes', listMyQuotes);
router.get('/quotes/:id', getMyQuote);

// Client invoices
router.get('/invoices', listMyInvoices);
router.get('/invoices/stats', getMyInvoiceStats);
router.get('/invoices/:id', getMyInvoice);
router.get('/invoices/:id/pdf', downloadMyInvoicePdf);

export default router;
