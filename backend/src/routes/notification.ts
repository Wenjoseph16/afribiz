import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
  getPreferences,
  updatePreferences,
  initDefaultPreferences,
} from '../controllers/notification';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markNotificationRead);
router.patch('/read-all', markAllNotificationsRead);
router.delete('/:id', deleteNotification);

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.post('/preferences/init', initDefaultPreferences);

export default router;
