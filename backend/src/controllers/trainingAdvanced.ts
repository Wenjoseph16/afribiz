import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as trainingSvc from '../services/trainingAdvanced';

export const listLessons = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const lessons = await trainingSvc.listLessons(req.user.id, req.params.trainingId);
  res.json({ success: true, data: lessons });
});

export const getLesson = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const lesson = await trainingSvc.getLesson(req.params.id);
  res.json({ success: true, data: lesson });
});

export const createLesson = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const lesson = await trainingSvc.createLesson(req.user.id, req.body);
  res.status(201).json({ success: true, data: lesson, message: 'Leçon créée' });
});

export const updateLesson = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const lesson = await trainingSvc.updateLesson(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: lesson, message: 'Leçon mise à jour' });
});

export const deleteLesson = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  await trainingSvc.deleteLesson(req.user.id, req.params.id);
  res.json({ success: true, message: 'Leçon supprimée' });
});

export const createQuiz = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const quiz = await trainingSvc.createQuiz(req.user.id, req.body);
  res.status(201).json({ success: true, data: quiz, message: 'Quiz créé' });
});

export const submitQuizAttempt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await trainingSvc.submitQuizAttempt(req.user.id, req.params.quizId, req.body.answers);
  res.json({ success: true, data: result, message: result.passed ? 'Quiz réussi !' : 'Quiz échoué, réessayez' });
});

export const getQuizAttempts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const attempts = await trainingSvc.getUserQuizAttempts(req.user.id, req.params.quizId);
  res.json({ success: true, data: attempts });
});

export const getTrainingProgress = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const progress = await trainingSvc.getUserTrainingProgress(req.user.id, req.params.trainingId);
  res.json({ success: true, data: progress });
});
