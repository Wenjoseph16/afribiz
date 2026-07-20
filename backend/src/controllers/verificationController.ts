import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as verificationService from '../services/verificationService';

export const getVerification = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    if (!req.user) throw new AppError('Non authentifié', 401);

    const business = await verificationService.getVerificationLevel(req.user.id);
    const stats = await verificationService.getTransactionStats(req.user.id);

    res.json({ success: true, data: { ...business, stats } });
  }
);

export const upgradeToOr = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    if (!req.user) throw new AppError('Non authentifié', 401);

    const { identityDocument, responsiblePhoto } = req.body;
    if (!identityDocument || !responsiblePhoto) {
      throw new AppError("Pièce d'identité et photo du responsable requises", 400);
    }

    const result = await verificationService.upgradeToOr(
      req.user.id,
      identityDocument,
      responsiblePhoto
    );

    res.json({
      success: true,
      data: result,
      message: 'Félicitations ! Vous êtes passé au niveau Or.',
    });
  }
);

export const upgradeToPlatine = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    if (!req.user) throw new AppError('Non authentifié', 401);

    const result = await verificationService.upgradeToPlatine(req.user.id);

    res.json({
      success: true,
      data: result,
      message: 'Félicitations ! Vous êtes passé au niveau Platine.',
    });
  }
);
