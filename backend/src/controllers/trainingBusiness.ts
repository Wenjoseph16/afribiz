import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as trainingBizService from '../services/trainingBusiness';

export const listBusinessTrainings = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await trainingBizService.listBusinessTrainings(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getBusinessTraining = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await trainingBizService.getBusinessTraining(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const createBusinessTraining = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await trainingBizService.createBusinessTraining(req.user.id, req.body);
  res.status(201).json({ success: true, data: result, message: 'Formation creee' });
});

export const updateBusinessTraining = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await trainingBizService.updateBusinessTraining(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: result, message: 'Formation mise a jour' });
});

export const deleteBusinessTraining = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await trainingBizService.deleteBusinessTraining(req.user.id, req.params.id);
  res.json({ success: true, data: result, message: 'Formation supprimee' });
});

export const getTrainingStudents = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await trainingBizService.getTrainingStudents(req.user.id, req.params.id, req.query);
  res.json({ success: true, data: result });
});

export const getTrainingStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await trainingBizService.getTrainingStats(req.user.id);
  res.json({ success: true, data: result });
});

export const listLessons = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await trainingBizService.listLessons(req.user.id, req.params.trainingId);
  res.json({ success: true, data: result });
});

export const createLesson = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await trainingBizService.createLesson(req.user.id, req.body);
  res.status(201).json({ success: true, data: result, message: 'Lecon creee' });
});

export const updateLesson = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await trainingBizService.updateLesson(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: result, message: 'Lecon mise a jour' });
});

export const deleteLesson = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await trainingBizService.deleteLesson(req.user.id, req.params.id);
  res.json({ success: true, data: result, message: 'Lecon supprimee' });
});

export const createQuiz = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await trainingBizService.createQuiz(req.user.id, req.body);
  res.status(201).json({ success: true, data: result, message: 'Quiz cree' });
});

export const deleteQuiz = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await trainingBizService.deleteQuiz(req.user.id, req.params.quizId);
  res.json({ success: true, data: result, message: 'Quiz supprime' });
});
