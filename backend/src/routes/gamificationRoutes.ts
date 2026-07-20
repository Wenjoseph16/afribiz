import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import * as gamificationController from '../controllers/gamificationController';

const router = Router();

router.get(
  '/gamification/dashboard',
  authMiddleware,
  requireRole(['BUSINESS']),
  gamificationController.getGamificationDashboard
);
router.get(
  '/gamification/quests',
  authMiddleware,
  requireRole(['BUSINESS']),
  gamificationController.getMyQuests
);
router.get(
  '/gamification/quests/completed',
  authMiddleware,
  requireRole(['BUSINESS']),
  gamificationController.getMyCompletedQuests
);
router.post(
  '/gamification/quests/initialize',
  authMiddleware,
  requireRole(['BUSINESS']),
  gamificationController.initializeQuests
);
router.get(
  '/gamification/streaks',
  authMiddleware,
  requireRole(['BUSINESS']),
  gamificationController.getMyStreaks
);
router.get(
  '/gamification/ranking',
  authMiddleware,
  requireRole(['BUSINESS']),
  gamificationController.getMyRanking
);
router.get(
  '/gamification/leaderboard',
  authMiddleware,
  requireRole(['BUSINESS']),
  gamificationController.getLeaderboard
);
router.get(
  '/gamification/challenges',
  authMiddleware,
  requireRole(['BUSINESS']),
  gamificationController.getMyChallenges
);

export default router;
