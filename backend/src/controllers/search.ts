import { Request, Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import { globalSearch } from '../services/search';

export const searchAll = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const q = (req.query.q as string) || '';
  if (!q.trim()) {
    return res.json({ success: true, data: { clients: [], orders: [], bookings: [], quotes: [], invoices: [], products: [], services: [], menuItems: [], debts: [], disputes: [], documents: [] } });
  }
  const results = await globalSearch(req.user!.id, q.trim());
  res.json({ success: true, data: results });
});
