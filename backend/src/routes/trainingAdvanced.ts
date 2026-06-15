import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listLessons, getLesson, createLesson, updateLesson, deleteLesson,
  createQuiz, submitQuizAttempt, getQuizAttempts, getTrainingProgress,
} from '../controllers/trainingAdvanced';

const router = Router();
router.use(authMiddleware);

// Lessons
router.get('/:trainingId/lessons', listLessons);
router.get('/lessons/:id', getLesson);
router.post('/lessons', createLesson);
router.patch('/lessons/:id', updateLesson);
router.delete('/lessons/:id', deleteLesson);

// Quiz
router.post('/quiz', createQuiz);
router.post('/quiz/:quizId/attempt', submitQuizAttempt);
router.get('/quiz/:quizId/attempts', getQuizAttempts);

// Progress
router.get('/:trainingId/progress', getTrainingProgress);

export default router;
