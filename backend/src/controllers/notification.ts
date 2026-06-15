import { AuthenticatedRequest } from '../middlewares/auth';
import { notificationRepository } from '../repositories/notificationRepository';
import { notificationPreferenceRepository } from '../repositories/notificationPreferenceRepository';
import { successResponse } from '../utils/response';
import { Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';

export const getNotifications = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Non authentifié' });
    return;
  }

  const { read, type, page = '1', limit = '20' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));

  const filter: any = {
    userId: req.user.id,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum,
  };

  if (read === 'true') filter.read = true;
  else if (read === 'false') filter.read = false;
  if (type) filter.type = (type as string).split(',');

  const { notifications, total } = await notificationRepository.findMany(filter);
  const unreadCount = await notificationRepository.countUnread(req.user.id);

  res.json(
    successResponse({
      notifications,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      unreadCount,
    })
  );
});

export const markNotificationRead = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { id } = req.params;
  await notificationRepository.markAsRead(id, req.user.id);
  res.json(successResponse(null, 'Notification marquée comme lue'));
});

export const markAllNotificationsRead = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  await notificationRepository.markAllAsRead(req.user.id);
  res.json(successResponse(null, 'Toutes les notifications marquées comme lues'));
});

export const deleteNotification = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { id } = req.params;
  const deleted = await notificationRepository.delete(id, req.user.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Notification introuvable' });
    return;
  }
  res.json(successResponse(null, 'Notification supprimée'));
});

export const getUnreadCount = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const count = await notificationRepository.countUnread(req.user.id);
  res.json(successResponse({ count }));
});

export const getPreferences = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const prefs = await notificationPreferenceRepository.getPreferences(req.user.id);
  res.json(successResponse(prefs));
});

export const updatePreferences = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { preferences } = req.body;

  if (!Array.isArray(preferences)) {
    res.status(400).json({ success: false, error: 'Format invalide' });
    return;
  }

  await notificationPreferenceRepository.bulkUpdate(req.user.id, preferences);
  res.json(successResponse(null, 'Préférences mises à jour'));
});

export const initDefaultPreferences = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  await notificationPreferenceRepository.setDefaults(req.user.id);
  res.json(successResponse(null, 'Préférences par défaut initialisées'));
});
