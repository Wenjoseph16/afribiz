import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { notificationTemplateService } from '../services/notificationTemplateService';

export async function getTemplates(req: AuthenticatedRequest, res: Response) {
  try {
    const { businessId } = req.query as { businessId?: string };
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'businessId requis' });
    }
    const templates = await notificationTemplateService.getTemplates(businessId);
    return res.json({ success: true, data: templates });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function upsertTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    const { businessId } = req.params;
    const { type, customTitle, customDescription, isActive } = req.body;
    if (!type || !customTitle) {
      return res.status(400).json({ success: false, error: 'type et customTitle requis' });
    }
    const template = await notificationTemplateService.upsertTemplate(
      businessId,
      req.user!.id,
      type,
      { customTitle, customDescription, isActive }
    );
    return res.json({ success: true, data: template });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    const { businessId } = req.params;
    const { type } = req.query as { type?: string };
    if (!type) {
      return res.status(400).json({ success: false, error: 'type requis' });
    }
    await notificationTemplateService.deleteTemplate(businessId, req.user!.id, type as any);
    return res.json({ success: true, data: null });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function toggleTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    const { businessId } = req.params;
    const { type, isActive } = req.body;
    if (!type || typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'type et isActive requis' });
    }
    await notificationTemplateService.toggleTemplate(businessId, req.user!.id, type, isActive);
    return res.json({ success: true, data: null });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAvailableTypes(req: AuthenticatedRequest, res: Response) {
  try {
    const types = await notificationTemplateService.getAvailableTypes();
    return res.json({ success: true, data: types });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
