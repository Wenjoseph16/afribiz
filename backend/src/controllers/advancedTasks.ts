import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as s from '../services/advancedTasks';

export const listTasks = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.json({ success: true, data: await s.listTasks(req.user.id, req.query) });
});

export const getTask = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.json({ success: true, data: await s.getTask(req.user.id, req.params.id) });
});

export const createTask = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.status(201).json({ success: true, data: await s.createTask(req.user.id, req.body), message: 'Tâche créée' });
});

export const updateTask = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.json({ success: true, data: await s.updateTask(req.user.id, req.params.id, req.body), message: 'Tâche mise à jour' });
});

export const deleteTask = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  await s.deleteTask(req.user.id, req.params.id);
  res.json({ success: true, message: 'Tâche supprimée' });
});

export const reorderTask = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  await s.reorderTask(req.user.id, req.params.id, req.body.status, req.body.sortOrder);
  res.json({ success: true, message: 'Tâche déplacée' });
});

export const getKanbanBoard = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.json({ success: true, data: await s.getKanbanBoard(req.user.id, req.query) });
});

export const listCategories = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.json({ success: true, data: await s.listCategories(req.user.id) });
});

export const createCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.status(201).json({ success: true, data: await s.createCategory(req.user.id, req.body) });
});

export const addChecklistItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.status(201).json({ success: true, data: await s.addChecklistItem(req.user.id, req.params.id, req.body) });
});

export const toggleChecklistItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.json({ success: true, data: await s.toggleChecklistItem(req.user.id, req.params.id, req.params.itemId) });
});

export const deleteChecklistItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  await s.deleteChecklistItem(req.user.id, req.params.id, req.params.itemId);
  res.json({ success: true, message: 'Élément supprimé' });
});

export const addComment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.status(201).json({ success: true, data: await s.addComment(req.user.id, req.params.id, req.body, req.user.id) });
});

export const deleteComment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  await s.deleteComment(req.user.id, req.params.id, req.params.commentId);
  res.json({ success: true, message: 'Commentaire supprimé' });
});

export const startTimer = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.json({ success: true, data: await s.startTimer(req.user.id, req.params.id, req.user.id) });
});

export const stopTimer = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.json({ success: true, data: await s.stopTimer(req.user.id, req.params.id, req.user.id) });
});

export const addResource = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.status(201).json({ success: true, data: await s.addResource(req.user.id, req.params.id, req.body) });
});

export const deleteResource = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  await s.deleteResource(req.user.id, req.params.id, req.params.resourceId);
  res.json({ success: true, message: 'Ressource supprimée' });
});

export const requestValidation = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.status(201).json({ success: true, data: await s.requestValidation(req.user.id, req.params.id, req.body) });
});

export const approveValidation = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.json({ success: true, data: await s.approveValidation(req.user.id, req.params.id, req.params.validationId, req.body) });
});

export const getTaskStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.json({ success: true, data: await s.getTaskStats(req.user.id) });
});

export const listTaskHistory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  res.json({ success: true, data: await s.listTaskHistory(req.user.id, req.params.id) });
});
