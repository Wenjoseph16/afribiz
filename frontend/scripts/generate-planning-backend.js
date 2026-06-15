const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..', '..', 'backend', 'src');

const serviceContent = `import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true, settings: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('PLANNING')) throw new AppError('Module Planning non activé', 403);
  return business;
}

// ===================== CALENDAR FEED =====================

export async function getCalendarFeed(ownerId: string, dateFrom: string, dateTo: string) {
  const business = await getBusinessByOwner(ownerId);
  const from = new Date(dateFrom);
  const to = new Date(dateTo + 'T23:59:59Z');

  const [bookings, tasks, events, schedules] = await Promise.all([
    prisma.booking.findMany({
      where: { businessId: business.id, startDate: { gte: from, lte: to }, status: { notIn: ['CANCELLED'] } },
      select: { id: true, title: true, startDate: true, endDate: true, status: true, type: true, customerName: true, service: { select: { name: true } } },
      orderBy: { startDate: 'asc' },
    }),
    prisma.planningTask.findMany({
      where: { businessId: business.id, startDate: { gte: from, lte: to }, deletedAt: null },
      select: { id: true, title: true, startDate: true, dueDate: true, status: true, priority: true, assignedTo: true },
      orderBy: { startDate: 'asc' },
    }),
    prisma.event.findMany({
      where: { businessId: business.id, date: { gte: from, lte: to }, isActive: true },
      select: { id: true, title: true, date: true, endDate: true, location: true },
      orderBy: { date: 'asc' },
    }),
    prisma.employeeSchedule.findMany({
      where: { businessId: business.id, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    }),
  ]);

  const feed = [
    ...bookings.map(b => ({ id: b.id, type: 'BOOKING' as const, title: b.title, start: b.startDate, end: b.endDate || b.startDate, status: b.status, meta: { customerName: b.customerName, serviceName: b.service?.name } })),
    ...tasks.map(t => ({ id: t.id, type: 'TASK' as const, title: t.title, start: t.startDate, end: t.dueDate || t.startDate, status: t.status, priority: t.priority, meta: { assignedTo: t.assignedTo } })),
    ...events.map(e => ({ id: e.id, type: 'EVENT' as const, title: e.title, start: e.date || new Date(), end: e.endDate || e.date || new Date(), location: e.location })),
    ...schedules.filter(s => !s.isAbsent).map(s => ({ id: s.id, type: 'SCHEDULE' as const, title: \`\${s.employeeName} - \${s.shiftType}\`, start: new Date(\`\${s.date.toISOString().split('T')[0]}T\${s.startTime}\`), end: new Date(\`\${s.date.toISOString().split('T')[0]}T\${s.endTime}\`), employeeName: s.employeeName, shiftType: s.shiftType })),
  ];

  feed.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return { feed, total: feed.length, dateFrom, dateTo };
}

// ===================== TASKS =====================

const taskInclude = {
  subtasks: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
  parentTask: { select: { id: true, title: true, status: true } },
} satisfies Prisma.PlanningTaskInclude;

export async function listTasks(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 50, status, priority, assignedTo, dateFrom, dateTo, search } = filters;
  const where: Prisma.PlanningTaskWhereInput = { businessId: business.id, deletedAt: null, parentTaskId: null };
  if (status) where.status = status as any;
  if (priority) where.priority = priority as any;
  if (assignedTo) where.assignedTo = assignedTo;
  if (dateFrom || dateTo) {
    where.startDate = {};
    if (dateFrom) where.startDate.gte = new Date(dateFrom);
    if (dateTo) where.startDate.lte = new Date(dateTo + 'T23:59:59Z');
  }
  if (search) where.title = { contains: search, mode: 'insensitive' };
  const skip = (page - 1) * limit;
  const [tasks, total] = await Promise.all([
    prisma.planningTask.findMany({ where, include: taskInclude, skip, take: limit, orderBy: { startDate: 'desc' } }),
    prisma.planningTask.count({ where }),
  ]);
  return { tasks, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTask(ownerId: string, taskId: string) {
  const business = await getBusinessByOwner(ownerId);
  const task = await prisma.planningTask.findFirst({ where: { id: taskId, businessId: business.id }, include: taskInclude });
  if (!task) throw new AppError('Tâche non trouvée', 404);
  return task;
}

export async function createTask(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const task = await prisma.planningTask.create({
    data: {
      businessId: business.id,
      orderId: data.orderId || null,
      bookingId: data.bookingId || null,
      assignedTo: data.assignedTo || null,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'MEDIUM',
      status: 'TODO',
      recurrence: data.recurrence || 'NONE',
      recurrenceRule: data.recurrenceRule || null,
      startDate: new Date(data.startDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      estimatedMinutes: data.estimatedMinutes || null,
      location: data.location || null,
      notes: data.notes || null,
      parentTaskId: data.parentTaskId || null,
    },
    include: taskInclude,
  });

  await logPlanning(business.id, 'TASK_CREATED', 'TASK', task.id, \`Tâche créée: \${task.title}\`);
  return task;
}

export async function updateTask(ownerId: string, taskId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.planningTask.findFirst({ where: { id: taskId, businessId: business.id } });
  if (!existing) throw new AppError('Tâche non trouvée', 404);

  const upd: any = {};
  for (const key of ['title', 'description', 'priority', 'status', 'recurrence', 'recurrenceRule', 'assignedTo', 'location', 'notes', 'estimatedMinutes', 'actualMinutes']) {
    if (data[key] !== undefined) upd[key] = data[key];
  }
  if (data.startDate) upd.startDate = new Date(data.startDate);
  if (data.dueDate) upd.dueDate = new Date(data.dueDate);
  if (data.status === 'DONE') upd.completedAt = new Date();
  if (data.orderId) upd.orderId = data.orderId;

  const updated = await prisma.planningTask.update({ where: { id: taskId }, data: upd, include: taskInclude });

  if (data.status && data.status !== existing.status) {
    await logPlanning(business.id, 'TASK_UPDATED', 'TASK', taskId, \`Tâche \${existing.title}: \${existing.status} → \${data.status}\`);
  }

  return updated;
}

export async function deleteTask(ownerId: string, taskId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.planningTask.update({
    where: { id: taskId, businessId: business.id },
    data: { deletedAt: new Date() },
  });
  await logPlanning(business.id, 'TASK_DELETED', 'TASK', taskId, 'Tâche supprimée');
}

// ===================== EMPLOYEE SCHEDULES =====================

export async function listSchedules(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 50, dateFrom, dateTo, employeeName, shiftType, isAbsent } = filters;
  const where: any = { businessId: business.id };
  if (dateFrom) where.date = { ...(where.date || {}), gte: new Date(dateFrom) };
  if (dateTo) where.date = { ...(where.date || {}), lte: new Date(dateTo + 'T23:59:59Z') };
  if (employeeName) where.employeeName = { contains: employeeName, mode: 'insensitive' };
  if (shiftType) where.shiftType = shiftType;
  if (isAbsent !== undefined) where.isAbsent = isAbsent === 'true';
  const skip = (page - 1) * limit;
  const [schedules, total] = await Promise.all([
    prisma.employeeSchedule.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.employeeSchedule.count({ where }),
  ]);
  return { schedules, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function upsertSchedule(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const schedule = await prisma.employeeSchedule.upsert({
    where: { businessId_employeeName_date: { businessId: business.id, employeeName: data.employeeName, date: new Date(data.date) } },
    create: {
      businessId: business.id,
      employeeName: data.employeeName,
      employeeId: data.employeeId || null,
      date: new Date(data.date),
      shiftType: data.shiftType || 'MORNING',
      startTime: data.startTime || '08:00',
      endTime: data.endTime || '17:00',
      breakStart: data.breakStart || null,
      breakEnd: data.breakEnd || null,
      isAbsent: data.isAbsent || false,
      absenceReason: data.absenceReason || null,
      isOnLeave: data.isOnLeave || false,
      leaveType: data.leaveType || null,
      notes: data.notes || null,
    },
    update: {
      shiftType: data.shiftType || undefined,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      breakStart: data.breakStart !== undefined ? data.breakStart : undefined,
      breakEnd: data.breakEnd !== undefined ? data.breakEnd : undefined,
      isAbsent: data.isAbsent !== undefined ? data.isAbsent : undefined,
      absenceReason: data.absenceReason !== undefined ? data.absenceReason : undefined,
      isOnLeave: data.isOnLeave !== undefined ? data.isOnLeave : undefined,
      leaveType: data.leaveType !== undefined ? data.leaveType : undefined,
      notes: data.notes !== undefined ? data.notes : undefined,
    },
  });

  await logPlanning(business.id, 'SCHEDULE_UPDATED', 'SCHEDULE', schedule.id, \`Planning \${data.employeeName} mis à jour\`);
  return schedule;
}

export async function deleteSchedule(ownerId: string, scheduleId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.employeeSchedule.delete({ where: { id: scheduleId, businessId: business.id } });
}

// ===================== PLANNING LOGS =====================

async function logPlanning(businessId: string, action: string, entityType: string, entityId?: string, description?: string) {
  try {
    await prisma.planningLog.create({
      data: { businessId, action, entityType, entityId: entityId || null, description: description || null },
    });
  } catch { /* silent */ }
}

export async function listPlanningLogs(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 50, action, entityType } = filters;
  const where: any = { businessId: business.id };
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.planningLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.planningLog.count({ where }),
  ]);
  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ===================== STATS =====================

export async function getPlanningStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);

  const [totalTasks, todoTasks, inProgressTasks, overdueTasks, todayTasks, todaySchedules, absentToday, upcomingBookings] = await Promise.all([
    prisma.planningTask.count({ where: { ...where, deletedAt: null } }),
    prisma.planningTask.count({ where: { ...where, status: 'TODO', deletedAt: null } }),
    prisma.planningTask.count({ where: { ...where, status: 'IN_PROGRESS', deletedAt: null } }),
    prisma.planningTask.count({ where: { ...where, dueDate: { lt: new Date() }, status: { notIn: ['DONE', 'BLOCKED'] }, deletedAt: null } }),
    prisma.planningTask.count({ where: { ...where, startDate: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }, deletedAt: null } }),
    prisma.employeeSchedule.count({ where: { ...where, date: today, isAbsent: false } }),
    prisma.employeeSchedule.count({ where: { ...where, date: today, isAbsent: true } }),
    prisma.booking.count({ where: { ...where, startDate: { gte: today, lte: weekEnd }, status: { notIn: ['CANCELLED'] } } }),
  ]);

  return {
    totalTasks,
    todoTasks,
    inProgressTasks,
    overdueTasks,
    todayTasks,
    todaySchedules,
    absentToday,
    upcomingBookings,
    occupancyRate: todaySchedules > 0 ? Math.round((todaySchedules - absentToday) / todaySchedules * 100) : 0,
  };
}
`;

const controllerContent = `import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as planningService from '../services/planning';

// ===================== CALENDAR =====================

export const getCalendarFeed = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { dateFrom, dateTo } = req.query;
  if (!dateFrom || !dateTo) { res.status(400).json({ success: false, error: 'dateFrom et dateTo requis' }); return; }
  const feed = await planningService.getCalendarFeed(req.user.id, dateFrom as string, dateTo as string);
  res.json({ success: true, data: feed });
});

// ===================== TASKS =====================

export const listTasks = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await planningService.listTasks(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getTask = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const task = await planningService.getTask(req.user.id, req.params.id);
  res.json({ success: true, data: task });
});

export const createTask = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const task = await planningService.createTask(req.user.id, req.body);
  res.status(201).json({ success: true, data: task, message: 'Tâche créée' });
});

export const updateTask = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const task = await planningService.updateTask(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: task, message: 'Tâche mise à jour' });
});

export const deleteTask = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  await planningService.deleteTask(req.user.id, req.params.id);
  res.json({ success: true, message: 'Tâche supprimée' });
});

// ===================== SCHEDULES =====================

export const listSchedules = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await planningService.listSchedules(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const upsertSchedule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const schedule = await planningService.upsertSchedule(req.user.id, req.body);
  res.json({ success: true, data: schedule, message: 'Planning mis à jour' });
});

export const deleteSchedule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  await planningService.deleteSchedule(req.user.id, req.params.id);
  res.json({ success: true, message: 'Planning supprimé' });
});

// ===================== LOGS & STATS =====================

export const listPlanningLogs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await planningService.listPlanningLogs(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getPlanningStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const stats = await planningService.getPlanningStats(req.user.id);
  res.json({ success: true, data: stats });
});
`;

const routesContent = `import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getCalendarFeed,
  listTasks, getTask, createTask, updateTask, deleteTask,
  listSchedules, upsertSchedule, deleteSchedule,
  listPlanningLogs, getPlanningStats,
} from '../controllers/planning';

const router = Router();

router.use(authMiddleware);

// Calendar feed (aggregated view)
router.get('/calendar', getCalendarFeed);

// Tasks
router.get('/tasks', listTasks);
router.get('/tasks/:id', getTask);
router.post('/tasks', createTask);
router.patch('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// Employee schedules
router.get('/schedules', listSchedules);
router.post('/schedules', upsertSchedule);
router.put('/schedules', upsertSchedule);
router.delete('/schedules/:id', deleteSchedule);

// Planning logs & stats
router.get('/logs', listPlanningLogs);
router.get('/stats', getPlanningStats);

export default router;
`;

const files = [
  { path: path.join(backendDir, 'services', 'planning.ts'), content: serviceContent },
  { path: path.join(backendDir, 'controllers', 'planning.ts'), content: controllerContent },
  { path: path.join(backendDir, 'routes', 'planning.ts'), content: routesContent },
];

for (const file of files) {
  fs.mkdirSync(path.dirname(file.path), { recursive: true });
  fs.writeFileSync(file.path, file.content, 'utf-8');
  console.log('Created:', file.path);
}

console.log('✅ Module 10 backend généré');
