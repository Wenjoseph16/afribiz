import { Router } from 'express';
import { authMiddleware, optionalAuth, requireRole } from '../middlewares/auth';
import {
  getActiveStories,
  getBusinessStories,
  createStory,
  updateStory,
  viewStory,
  clickStory,
  deleteStory,
  addSticker,
  removeSticker,
  getHighlights,
  toggleHighlight,
  getFeedItems,
  createFeedItem,
  deleteFeedItem,
} from '../controllers/storyController';

const router = Router();

// Routes publiques
router.get('/stories', optionalAuth, getActiveStories);
router.get('/stories/business/:businessId', optionalAuth, getBusinessStories);
router.get('/stories/highlights/:businessId', getHighlights);
router.post('/stories/:id/view', optionalAuth, viewStory);
router.post('/stories/:id/click', clickStory);
router.get('/feed', getFeedItems);

// Routes authentifiées (BUSINESS, DEVELOPER ou ADMIN uniquement)
router.post(
  '/stories',
  authMiddleware,
  requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']),
  createStory
);
router.put(
  '/stories/:id',
  authMiddleware,
  requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']),
  updateStory
);
router.delete(
  '/stories/:id',
  authMiddleware,
  requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']),
  deleteStory
);

// Routes stickers
router.post(
  '/stories/:id/stickers',
  authMiddleware,
  requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']),
  addSticker
);
router.delete(
  '/stories/:id/stickers/:stickerId',
  authMiddleware,
  requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']),
  removeSticker
);

// Routes highlights
router.put(
  '/stories/:id/highlight',
  authMiddleware,
  requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']),
  toggleHighlight
);

// Routes feed items
router.post(
  '/feed',
  authMiddleware,
  requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']),
  createFeedItem
);
router.delete(
  '/feed/:id',
  authMiddleware,
  requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']),
  deleteFeedItem
);

export default router;
