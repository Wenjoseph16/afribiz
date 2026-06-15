import { Router } from 'express';
import { authMiddleware, optionalAuth, requireRole } from '../middlewares/auth';
import {
  getActiveStories, getBusinessStories, createStory, viewStory,
  clickStory, deleteStory, getFeedItems, createFeedItem, deleteFeedItem,
} from '../controllers/storyController';

const router = Router();

// Routes publiques
router.get('/stories', optionalAuth, getActiveStories);
router.get('/stories/business/:businessId', optionalAuth, getBusinessStories);
router.post('/stories/:id/view', optionalAuth, viewStory);
router.post('/stories/:id/click', clickStory);
router.get('/feed', getFeedItems);

// Routes authentifiées (BUSINESS, DEVELOPER ou ADMIN uniquement)
router.post('/stories', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), createStory);
router.delete('/stories/:id', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), deleteStory);
router.post('/feed', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), createFeedItem);
router.delete('/feed/:id', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), deleteFeedItem);

export default router;
