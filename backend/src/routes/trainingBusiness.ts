import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listBusinessTrainings, getBusinessTraining, createBusinessTraining,
  updateBusinessTraining, deleteBusinessTraining,
  getTrainingStudents, getTrainingStats,
  listLessons, createLesson, updateLesson, deleteLesson,
  createQuiz, deleteQuiz,
} from '../controllers/trainingBusiness';

const router = Router();
router.use(authMiddleware);

// Stats
router.get('/stats', getTrainingStats);

// Students under training
router.get('/:id/students', getTrainingStudents);

// Lessons under training
router.get('/:trainingId/lessons', listLessons);

// CRUD
router.get('/', listBusinessTrainings);
router.post('/', createBusinessTraining);
router.get('/:id', getBusinessTraining);
router.patch('/:id', updateBusinessTraining);
router.delete('/:id', deleteBusinessTraining);

// Lessons and Quiz (separate)
router.post('/lessons', createLesson);
router.patch('/lessons/:id', updateLesson);
router.delete('/lessons/:id', deleteLesson);
router.post('/quiz', createQuiz);
router.delete('/quiz/:quizId', deleteQuiz);

export default router;
