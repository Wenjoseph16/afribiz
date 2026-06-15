import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as planningService from '../services/planning';

// ===================== CALENDAR =====================

export const getCalendarFeed = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { dateFrom, dateTo } = req.query;
  if (!dateFrom || !dateTo) { res.status(400).json({ success: false, error: 'dateFrom et dateTo requis' }); return; }
  const feed = await planningService.getCalendarFeed(req.user.id, dateFrom as string, dateTo as string);
  res.json({ success: true, data: feed });
});

// ===================== TASKS =====================

export const listTasks = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await planningService.listTasks(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getTask = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const task = await planningService.getTask(req.user.id, req.params.id);
  res.json({ success: true, data: task });
});

export const createTask = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const task = await planningService.createTask(req.user.id, req.body);
  res.status(201).json({ success: true, data: task, message: 'Tâche créée' });
});

export const updateTask = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const task = await planningService.updateTask(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: task, message: 'Tâche mise à jour' });
});

export const deleteTask = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  await planningService.deleteTask(req.user.id, req.params.id);
  res.json({ success: true, message: 'Tâche supprimée' });
});

// ===================== SCHEDULES =====================

export const listSchedules = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await planningService.listSchedules(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const upsertSchedule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const schedule = await planningService.upsertSchedule(req.user.id, req.body);
  res.json({ success: true, data: schedule, message: 'Planning mis à jour' });
});

export const deleteSchedule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  await planningService.deleteSchedule(req.user.id, req.params.id);
  res.json({ success: true, message: 'Planning supprimé' });
});

// ===================== LOGS & STATS =====================

export const listPlanningLogs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await planningService.listPlanningLogs(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getPlanningStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const stats = await planningService.getPlanningStats(req.user.id);
  res.json({ success: true, data: stats });
});
