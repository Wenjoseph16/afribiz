import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as socialShareService from '../services/socialShareService';

async function getBusinessId(req: AuthenticatedRequest) {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const business = await (
    await import('../lib/db')
  ).prisma.business.findUnique({
    where: { ownerId: req.user.id },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  return business.id;
}

export const connectAccount = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const {
    platform,
    accountName,
    accountId,
    accessToken,
    tokenExpiresAt,
    refreshToken,
    avatar,
    autoShare,
    autoShareTypes,
  } = req.body;
  const result = await socialShareService.connectAccount(businessId, {
    platform,
    accountName,
    accountId,
    accessToken,
    tokenExpiresAt,
    refreshToken,
    avatar,
    autoShare,
    autoShareTypes,
  });
  res.json({ success: true, data: result, message: 'Compte connecté' });
});

export const disconnectAccount = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const result = await socialShareService.disconnectAccount(businessId, req.params.id);
    res.json({ success: true, data: result });
  }
);

export const listAccounts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const result = await socialShareService.listAccounts(businessId);
  res.json({ success: true, data: result });
});

export const updateShareSettings = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const { autoShare, autoShareTypes } = req.body;
    const result = await socialShareService.updateShareSettings(businessId, req.params.id, {
      autoShare,
      autoShareTypes,
    });
    res.json({ success: true, data: result, message: 'Paramètres mis à jour' });
  }
);
