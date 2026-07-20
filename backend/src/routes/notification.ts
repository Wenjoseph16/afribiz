import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  markMultipleNotificationsRead,
  deleteNotification,
  getUnreadCount,
  getPreferences,
  updatePreferences,
  initDefaultPreferences,
  getNotificationAnalytics,
  exportNotificationsCSV,
  checkNotificationFailureRate,
  savePushSubscription,
  getPushSubscriptions,
  deletePushSubscription,
} from '../controllers/notification';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markNotificationRead);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/read-multiple', markMultipleNotificationsRead);
router.delete('/:id', deleteNotification);

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.post('/preferences/init', initDefaultPreferences);

router.get('/analytics', getNotificationAnalytics);
router.get('/analytics/export-csv', exportNotificationsCSV);
router.get('/analytics/check-failure-rate', checkNotificationFailureRate);

// Push notification subscriptions
router.post('/push-subscribe', savePushSubscription);
router.get('/push-subscriptions', getPushSubscriptions);
router.delete('/push-subscribe', deletePushSubscription);

export default router;
