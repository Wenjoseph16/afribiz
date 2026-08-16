import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { getBossCockpit, getBusinessCockpit } from '../services/bossCockpitService';

/** GET /business/cockpit — vue consolidée de tous les business du boss. */
export const getBossCockpitOverview = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await getBossCockpit(req.user.id);
    res.json({ success: true, data });
  }
);

/** GET /business/cockpit/:businessId — cockpit détaillé d'un business (avec baseline optionnelle). */
export const getSingleBusinessCockpit = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { businessId } = req.params;

    // Ownership check : le boss ne voit que SES business
    const owned = await import('../lib/businessAccess').then((m) =>
      m.assertBusinessOwnership(req.user!.id, businessId)
    );
    if (!owned) throw new AppError('Accès refusé', 403);

    const baseline = req.query.baseline ? JSON.parse(String(req.query.baseline)) : undefined;
    const data = await getBusinessCockpit(businessId, baseline);
    res.json({ success: true, data });
  }
);
