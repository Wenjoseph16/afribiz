import { Prisma } from '@prisma/client';
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
      where: { businessId: business.id, dueDate: { gte: from, lte: to }, deletedAt: null },
      select: { id: true, title: true, dueDate: true, status: true, priority: true, assignedTo: true, createdAt: true },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.event.findMany({
      where: { businessId: business.id, startDate: { gte: from, lte: to }, isActive: true },
      select: { id: true, title: true, startDate: true, endDate: true, address: true },
      orderBy: { startDate: 'asc' },
    }),
    prisma.employeeSchedule.findMany({
      where: { businessId: business.id },
      orderBy: { dayOfWeek: 'asc' },
      include: { employee: { select: { id: true, firstName: true, lastName: true, position: true } } },
    }),
  ]);

  const feed = [
    ...bookings.map(b => ({ id: b.id, type: 'BOOKING' as const, title: b.title, start: b.startDate, end: b.endDate || b.startDate, status: b.status, meta: { customerName: b.customerName, serviceName: b.service?.name } })),
    ...tasks.map(t => ({ id: t.id, type: 'TASK' as const, title: t.title, start: t.dueDate || t.createdAt, end: t.dueDate || t.createdAt, status: t.status, priority: t.priority, meta: { assignedTo: t.assignedTo } })),
    ...events.map(e => ({ id: e.id, type: 'EVENT' as const, title: e.title, start: e.startDate || new Date(), end: e.endDate || e.startDate || new Date(), location: e.address })),
    ...schedules.filter(s => s.isActive).map(s => ({ id: s.id, type: 'SCHEDULE' as const, title: `${s.employee?.firstName || ''} ${s.employee?.lastName || ''}`, start: new Date(), end: new Date(), employeeName: s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : '', dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })),
  ];

  feed.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return { feed, total: feed.length, dateFrom, dateTo };
}

// ===================== TASKS =====================

const taskInclude: any = {};

export async function listTasks(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 50, status, priority, assignedTo, dateFrom, dateTo, search } = filters;
  const where: Prisma.PlanningTaskWhereInput = { businessId: business.id } as any;
  if (status) where.status = status as any;
  if (priority) where.priority = priority as any;
  if (assignedTo) where.assignedTo = assignedTo;
  if (dateFrom || dateTo) {
    const dueFilter: any = {};
    if (dateFrom) dueFilter.gte = new Date(dateFrom);
    if (dateTo) dueFilter.lte = new Date(dateTo + 'T23:59:59Z');
    where.dueDate = dueFilter;
  }
  if (search) where.title = { contains: search, mode: 'insensitive' };
  const skip = (page - 1) * limit;
  const [tasks, total] = await Promise.all([
    prisma.planningTask.findMany({ where, include: taskInclude, skip, take: limit, orderBy: { dueDate: 'desc' } }),
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
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: taskInclude,
  });

  await logPlanning(business.id, 'TASK_CREATED', 'TASK', task.id, `Tâche créée: ${task.title}`);
  return task;
}

export async function updateTask(ownerId: string, taskId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.planningTask.findFirst({ where: { id: taskId, businessId: business.id } });
  if (!existing) throw new AppError('Tâche non trouvée', 404);

  const upd: any = {};
  for (const key of ['title', 'description', 'priority', 'status', 'recurrence', 'recurrenceRule', 'assignedTo', 'notes']) {
    if (data[key] !== undefined) upd[key] = data[key];
  }
  if (data.dueDate) upd.dueDate = new Date(data.dueDate);
  if (data.status === 'DONE') upd.completedAt = new Date();
  if (data.orderId) upd.orderId = data.orderId;

  const updated = await prisma.planningTask.update({ where: { id: taskId }, data: upd, include: taskInclude });

  if (data.status && data.status !== existing.status) {
    await logPlanning(business.id, 'TASK_UPDATED', 'TASK', taskId, `Tâche ${existing.title}: ${existing.status} → ${data.status}`);
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
  const { page = 1, limit = 50, dayOfWeek, employeeId } = filters;
  const where: any = { businessId: business.id };
  if (dayOfWeek !== undefined) where.dayOfWeek = parseInt(dayOfWeek);
  if (employeeId) where.employeeId = employeeId;
  const skip = (page - 1) * limit;
  const [schedules, total] = await Promise.all([
    prisma.employeeSchedule.findMany({
      where, skip, take: limit, orderBy: { dayOfWeek: 'asc' },
      include: { employee: { select: { id: true, firstName: true, lastName: true, position: true } } },
    }),
    prisma.employeeSchedule.count({ where }),
  ]);
  return { schedules, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function upsertSchedule(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  if (!data.employeeId) throw new AppError('employeeId est requis', 400);

  const existing = await prisma.employeeSchedule.findFirst({
    where: {
      businessId: business.id,
      employeeId: data.employeeId,
      dayOfWeek: data.dayOfWeek,
    },
  });

  if (existing) {
    const updated = await prisma.employeeSchedule.update({
      where: { id: existing.id },
      data: {
        startTime: data.startTime || existing.startTime,
        endTime: data.endTime || existing.endTime,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    });
    const name = updated.employee ? `${updated.employee.firstName} ${updated.employee.lastName}` : '';
    await logPlanning(business.id, 'SCHEDULE_UPDATED', 'SCHEDULE', updated.id, `Planning ${name} mis à jour`);
    return updated;
  }

  const schedule = await prisma.employeeSchedule.create({
    data: {
      businessId: business.id,
      employeeId: data.employeeId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime || '08:00',
      endTime: data.endTime || '17:00',
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
    include: { employee: { select: { id: true, firstName: true, lastName: true } } },
  });

  const name = schedule.employee ? `${schedule.employee.firstName} ${schedule.employee.lastName}` : '';
  await logPlanning(business.id, 'SCHEDULE_CREATED', 'SCHEDULE', schedule.id, `Planning ${name} créé`);
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

  const [totalTasks, todoTasks, inProgressTasks, overdueTasks, todayTasks, totalSchedules, activeSchedules, upcomingBookings] = await Promise.all([
    prisma.planningTask.count({ where: { ...where, deletedAt: null } }),
    prisma.planningTask.count({ where: { ...where, status: 'TODO', deletedAt: null } }),
    prisma.planningTask.count({ where: { ...where, status: 'IN_PROGRESS', deletedAt: null } }),
    prisma.planningTask.count({ where: { ...where, dueDate: { lt: new Date() }, status: { notIn: ['DONE', 'BLOCKED'] }, deletedAt: null } }),
    prisma.planningTask.count({ where: { ...where, dueDate: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }, deletedAt: null } }),
    prisma.employeeSchedule.count({ where }),
    prisma.employeeSchedule.count({ where: { ...where, isActive: true } }),
    prisma.booking.count({ where: { ...where, startDate: { gte: today, lte: weekEnd }, status: { notIn: ['CANCELLED'] } } }),
  ]);

  return {
    totalTasks,
    todoTasks,
    inProgressTasks,
    overdueTasks,
    todayTasks,
    todaySchedules: activeSchedules,
    absentToday: totalSchedules - activeSchedules,
    upcomingBookings,
    occupancyRate: totalSchedules > 0 ? Math.round(activeSchedules / totalSchedules * 100) : 0,
  };
}
