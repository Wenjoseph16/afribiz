import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { notificationTemplateService } from '../services/notificationTemplateService';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { NotificationType } from '@prisma/client';

export const getTemplates = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { businessId } = req.query as { businessId?: string };
  if (!businessId) {
    throw new AppError('businessId requis', 400);
  }
  const templates = await notificationTemplateService.getTemplates(businessId);
  return res.json({ success: true, data: templates });
});

export const upsertTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { businessId } = req.params;
  const { type, customTitle, customDescription, isActive } = req.body;
  if (!type || !customTitle) {
    throw new AppError('type et customTitle requis', 400);
  }
  const template = await notificationTemplateService.upsertTemplate(
    businessId,
    req.user!.id,
    type,
    { customTitle, customDescription, isActive }
  );
  return res.json({ success: true, data: template });
});

export const deleteTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { businessId } = req.params;
  const { type } = req.query as { type?: string };
  if (!type) {
    throw new AppError('type requis', 400);
  }
  await notificationTemplateService.deleteTemplate(
    businessId,
    req.user!.id,
    type as NotificationType
  );
  return res.json({ success: true, data: null });
});

export const toggleTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { businessId } = req.params;
  const { type, isActive } = req.body;
  if (!type || typeof isActive !== 'boolean') {
    throw new AppError('type et isActive requis', 400);
  }
  await notificationTemplateService.toggleTemplate(businessId, req.user!.id, type, isActive);
  return res.json({ success: true, data: null });
});

export const getAvailableTypes = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const types = await notificationTemplateService.getAvailableTypes();
    return res.json({ success: true, data: types });
  }
);
