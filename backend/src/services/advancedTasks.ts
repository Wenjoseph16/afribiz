import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import { eventBus } from '../events/EventBus';
import { DomainEventType, DomainEvent } from '../events/events';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  return business;
}

// ===================== CATEGORIES =====================

export async function listCategories(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.taskCategory.findMany({ where: { businessId: business.id }, orderBy: { sortOrder: 'asc' } });
}

export async function createCategory(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.taskCategory.create({
    data: { businessId: business.id, name: data.name, color: data.color || '#6366f1', icon: data.icon || null, sortOrder: data.sortOrder || 0 },
  });
}

// ===================== ADVANCED TASKS =====================

const taskInclude: any = {
  category: { select: { id: true, name: true, color: true, icon: true } },
  assignee: { select: { id: true, firstName: true, lastName: true, photo: true, position: true } },
  checklists: { orderBy: { sortOrder: 'asc' } },
  resources: { orderBy: { createdAt: 'desc' } },
  _count: { select: { comments: true, timers: { where: { endedAt: null } } } },
};

export async function listTasks(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { status, priority, categoryId, assigneeId, search, dateFrom, dateTo, page = 1, limit = 50 } = filters;
  const where: Prisma.PlanningTaskWhereInput = { businessId: business.id, deletedAt: null } as any;
  if (status) where.status = status as any;
  if (priority) where.priority = priority as any;
  if (categoryId) where.categoryId = categoryId;
  if (assigneeId) where.assigneeId = assigneeId;
  if (search) where.title = { contains: search, mode: 'insensitive' };
  if (dateFrom || dateTo) {
    const dueFilter: any = {};
    if (dateFrom) dueFilter.gte = new Date(dateFrom);
    if (dateTo) dueFilter.lte = new Date(dateTo + 'T23:59:59Z');
    where.dueDate = dueFilter;
  }
  const skip = (page - 1) * limit;
  const [tasks, total] = await Promise.all([
    prisma.planningTask.findMany({ where, include: taskInclude, skip, take: limit, orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }] }),
    prisma.planningTask.count({ where }),
  ]);
  return { tasks, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTask(ownerId: string, taskId: string) {
  const business = await getBusinessByOwner(ownerId);
  const task = await prisma.planningTask.findFirst({
    where: { id: taskId, businessId: business.id },
    include: {
      ...taskInclude,
      comments: { orderBy: { createdAt: 'desc' }, include: { author: { select: { id: true, firstName: true, lastName: true, photo: true } } } },
      timers: { orderBy: { startedAt: 'desc' } },
      validations: { orderBy: { createdAt: 'desc' } },
      order: { select: { id: true, orderNumber: true, status: true } },
      booking: { select: { id: true, bookingNumber: true, title: true, status: true } },
    },
  });
  if (!task) throw new AppError('Tâche non trouvée', 404);
  return task;
}

export async function createTask(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const task = await prisma.planningTask.create({
    data: {
      businessId: business.id,
      title: data.title,
      description: data.description || null,
      categoryId: data.categoryId || null,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'TODO',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : null,
      assigneeId: data.assigneeId || null,
      assignedTo: data.assignedTo || null,
      orderId: data.orderId || null,
      bookingId: data.bookingId || null,
      deliveryId: data.deliveryId || null,
      eventId: data.eventId || null,
      rentalId: data.rentalId || null,
      partnerId: data.partnerId || null,
      clientName: data.clientName || null,
      recurrence: data.recurrence || 'NONE',
      recurrenceRule: data.recurrenceRule || null,
      requiresValidation: data.requiresValidation || false,
      requiresPhoto: data.requiresPhoto || false,
      requiresSignature: data.requiresSignature || false,
    },
    include: taskInclude,
  });
  await logTaskEvent(business.id, task.id, 'TASK_CREATED', `Tâche créée: ${task.title}`);
  if (data.checklistItems?.length > 0) {
    await Promise.all(data.checklistItems.map((item: any, idx: number) =>
      prisma.taskChecklist.create({ data: { taskId: task.id, label: item.label || item, sortOrder: idx, assignedTo: item.assignedTo || null } })
    ));
  }
  return task;
}

export async function updateTask(ownerId: string, taskId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.planningTask.findFirst({ where: { id: taskId, businessId: business.id } });
  if (!existing) throw new AppError('Tâche non trouvée', 404);
  const upd: any = {};
  const allowedFields = ['title', 'description', 'priority', 'status', 'categoryId', 'assigneeId', 'assignedTo', 'clientName', 'recurrence', 'recurrenceRule', 'requiresValidation', 'requiresPhoto', 'requiresSignature', 'estimatedHours', 'notes'];
  for (const key of allowedFields) { if (data[key] !== undefined) upd[key] = data[key]; }
  if (data.dueDate !== undefined) upd.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.startDate !== undefined) upd.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.status === 'DONE' && existing.status !== 'DONE') upd.completedAt = new Date();
  const updated = await prisma.planningTask.update({ where: { id: taskId }, data: upd, include: taskInclude });
  if (data.status && data.status !== existing.status) {
    await logTaskEvent(business.id, taskId, 'TASK_STATUS_CHANGED', `${existing.title}: ${existing.status} → ${data.status}`);
    if (data.status === 'DONE') await prisma.taskChecklist.updateMany({ where: { taskId, completedAt: null }, data: { completedAt: new Date() } });
  }
  return updated;
}

export async function deleteTask(ownerId: string, taskId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.planningTask.update({ where: { id: taskId, businessId: business.id }, data: { deletedAt: new Date() } });
  await logTaskEvent(business.id, taskId, 'TASK_DELETED', 'Tâche supprimée');
}

export async function reorderTask(ownerId: string, taskId: string, newStatus: string, newSortOrder: number) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.planningTask.update({ where: { id: taskId, businessId: business.id }, data: { status: newStatus as any, sortOrder: newSortOrder } });
}

// ===================== KANBAN =====================

export async function getKanbanBoard(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { categoryId, priority, assigneeId, search } = filters;
  const where: Prisma.PlanningTaskWhereInput = { businessId: business.id, deletedAt: null } as any;
  if (categoryId) where.categoryId = categoryId;
  if (priority) where.priority = priority as any;
  if (assigneeId) where.assigneeId = assigneeId;
  if (search) where.title = { contains: search, mode: 'insensitive' };
  const tasks = await prisma.planningTask.findMany({ where, include: taskInclude, orderBy: [{ sortOrder: 'asc' }, { dueDate: 'asc' }] });
  const columns: Record<string, any> = {
    TODO: { id: 'TODO', title: 'À faire', tasks: [] },
    IN_PROGRESS: { id: 'IN_PROGRESS', title: 'En cours', tasks: [] },
    ON_HOLD: { id: 'ON_HOLD', title: 'En attente', tasks: [] },
    DONE: { id: 'DONE', title: 'Terminé', tasks: [] },
    BLOCKED: { id: 'BLOCKED', title: 'Bloqué', tasks: [] },
  };
  tasks.forEach((task: any) => {
    const colId = ['DONE', 'BLOCKED', 'IN_PROGRESS', 'ON_HOLD'].includes(task.status) ? task.status : 'TODO';
    if (columns[colId]) columns[colId].tasks.push(task);
  });
  return { columns, totalTasks: tasks.length };
}

// ===================== CHECKLISTS =====================

export async function addChecklistItem(ownerId: string, taskId: string, data: any) {
  await getBusinessByOwner(ownerId);
  return prisma.taskChecklist.create({ data: { taskId, label: data.label, assignedTo: data.assignedTo || null, sortOrder: data.sortOrder || 0 } });
}

export async function toggleChecklistItem(ownerId: string, taskId: string, itemId: string) {
  await getBusinessByOwner(ownerId);
  const item = await prisma.taskChecklist.findFirst({ where: { id: itemId, taskId } });
  if (!item) throw new AppError('Élément non trouvé', 404);
  return prisma.taskChecklist.update({ where: { id: itemId }, data: { completedAt: item.completedAt ? null : new Date() } });
}

export async function deleteChecklistItem(ownerId: string, taskId: string, itemId: string) {
  await getBusinessByOwner(ownerId);
  await prisma.taskChecklist.delete({ where: { id: itemId, taskId } });
}

// ===================== COMMENTS =====================

export async function addComment(ownerId: string, taskId: string, data: any, userId: string) {
  await getBusinessByOwner(ownerId);
  const comment = await prisma.taskComment.create({
    data: { taskId, authorId: userId, content: data.content, attachment: data.attachment || null },
    include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
  });
  const bizId = await businessId(ownerId);
  await logTaskEvent(bizId, taskId, 'COMMENT_ADDED', 'Nouveau commentaire');
  return comment;
}

export async function deleteComment(ownerId: string, taskId: string, commentId: string) {
  await getBusinessByOwner(ownerId);
  await prisma.taskComment.delete({ where: { id: commentId, taskId } });
}

// ===================== TIMERS =====================

export async function startTimer(ownerId: string, taskId: string, userId: string) {
  await getBusinessByOwner(ownerId);
  await prisma.taskTimer.updateMany({ where: { taskId, userId, endedAt: null }, data: { endedAt: new Date() } });
  return prisma.taskTimer.create({ data: { taskId, userId, startedAt: new Date() } });
}

export async function stopTimer(ownerId: string, taskId: string, userId: string) {
  await getBusinessByOwner(ownerId);
  const timer = await prisma.taskTimer.findFirst({ where: { taskId, userId, endedAt: null }, orderBy: { startedAt: 'desc' } });
  if (!timer) throw new AppError('Aucun timer actif', 404);
  const endedAt = new Date();
  const durationMs = endedAt.getTime() - timer.startedAt.getTime();
  return prisma.taskTimer.update({ where: { id: timer.id }, data: { endedAt, durationMs: Math.floor(durationMs / 1000) } });
}

// ===================== RESOURCES =====================

export async function addResource(ownerId: string, taskId: string, data: any) {
  await getBusinessByOwner(ownerId);
  return prisma.taskResource.create({ data: { taskId, type: data.type || 'document', label: data.label, url: data.url || null, fileSize: data.fileSize ? parseInt(data.fileSize) : null, mimeType: data.mimeType || null } });
}

export async function deleteResource(ownerId: string, taskId: string, resourceId: string) {
  await getBusinessByOwner(ownerId);
  await prisma.taskResource.delete({ where: { id: resourceId, taskId } });
}

// ===================== VALIDATIONS =====================

export async function requestValidation(ownerId: string, taskId: string, data: any) {
  await getBusinessByOwner(ownerId);
  return prisma.taskValidation.create({ data: { taskId, requestedBy: data.requestedBy || ownerId, type: data.type || 'manager', notes: data.notes || null } });
}

export async function approveValidation(ownerId: string, taskId: string, validationId: string, data: any) {
  await getBusinessByOwner(ownerId);
  const validation = await prisma.taskValidation.findFirst({ where: { id: validationId, taskId } });
  if (!validation) throw new AppError('Validation non trouvée', 404);
  if (validation.status !== 'PENDING') throw new AppError('Déjà traitée', 400);
  return prisma.taskValidation.update({
    where: { id: validationId },
    data: { status: data.approved ? 'APPROVED' : 'REJECTED', reviewedBy: ownerId, reviewedAt: new Date(), notes: data.notes || validation.notes },
  });
}

// ===================== STATS =====================

export async function getTaskStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id, deletedAt: null };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, totalChecklists, completedChecklists, totalTimeSpent] = await Promise.all([
    prisma.planningTask.count({ where }),
    prisma.planningTask.count({ where: { ...where, status: 'TODO' } }),
    prisma.planningTask.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    prisma.planningTask.count({ where: { ...where, status: 'DONE' } }),
    prisma.planningTask.count({ where: { ...where, dueDate: { lt: today }, status: { notIn: ['DONE', 'BLOCKED', 'CANCELLED'] } } }),
    prisma.taskChecklist.count({ where: { task: { businessId: business.id, deletedAt: null } } }),
    prisma.taskChecklist.count({ where: { completedAt: { not: null }, task: { businessId: business.id, deletedAt: null } } }),
    prisma.taskTimer.aggregate({ where: { task: { businessId: business.id }, endedAt: { not: null } }, _sum: { durationMs: true } }),
  ]);
  return {
    totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks,
    completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
    checklistProgress: totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0,
    totalTimeHours: Math.round(((totalTimeSpent._sum.durationMs || 0) / 3600) * 10) / 10,
    overduePercentage: totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0,
  };
}

// ===================== AUTOMATIONS =====================

async function businessId(ownerId: string) {
  const b = await prisma.business.findUnique({ where: { ownerId }, select: { id: true } });
  return b?.id || ownerId;
}

export async function registerAutomationHandlers() {
  eventBus.subscribe(DomainEventType.ORDER_PLACED, async (event: DomainEvent) => {
    try {
      const businessIdVal = event.metadata?.businessId;
      if (!businessIdVal) return;
      const biz = await prisma.business.findUnique({ where: { id: businessIdVal }, select: { modules: true } });
      if (!biz || !biz.modules.includes('ADVANCED_TASKS')) return;
      const orderId = event.payload.orderId as string;
      const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, orderNumber: true, type: true, contactName: true, deliveryAddress: true } });
      if (!order) return;
      await prisma.planningTask.create({ data: { businessId: businessIdVal, title: `Préparer commande #${order.orderNumber}`, description: `Commande ${order.type}`, priority: 'HIGH', status: 'TODO', orderId: order.id, clientName: order.contactName || null } });
      if (order.type === 'DELIVERY') {
        await prisma.planningTask.create({ data: { businessId: businessIdVal, title: `Livrer commande #${order.orderNumber}`, description: `Adresse: ${order.deliveryAddress || 'Non spécifiée'}`, priority: 'HIGH', status: 'TODO', orderId: order.id, clientName: order.contactName || null } });
      }
    } catch (err) { logger.error('Auto task from order failed', { error: err }); }
  });

  eventBus.subscribe(DomainEventType.BOOKING_CREATED, async (event: DomainEvent) => {
    try {
      const businessIdVal = event.metadata?.businessId;
      if (!businessIdVal) return;
      const biz = await prisma.business.findUnique({ where: { id: businessIdVal }, select: { modules: true } });
      if (!biz || !biz.modules.includes('ADVANCED_TASKS')) return;
      const bookingId = event.payload.bookingId as string;
      const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { id: true, bookingNumber: true, title: true, type: true, startDate: true, customerName: true } });
      if (!booking) return;
      await prisma.planningTask.create({
        data: {
          businessId: businessIdVal,
          title: booking.type === 'ROOM' ? `Préparer chambre pour ${booking.title}` : `Préparer service: ${booking.title}`,
          description: `Réservation #${booking.bookingNumber} - ${booking.customerName || 'Client'}`,
          priority: 'MEDIUM', status: 'TODO', bookingId: booking.id, dueDate: booking.startDate || undefined, clientName: booking.customerName || null,
        },
      });
    } catch (err) { logger.error('Auto task from booking failed', { error: err }); }
  });
}

// ===================== HISTORY =====================

async function logTaskEvent(bizId: string, taskId: string, action: string, description?: string) {
  try { await prisma.planningLog.create({ data: { businessId: bizId, action, entityType: 'ADVANCED_TASK', entityId: taskId, description: description || null } }); } catch { /* silent */ }
}

export async function listTaskHistory(ownerId: string, taskId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.planningLog.findMany({ where: { businessId: business.id, entityType: 'ADVANCED_TASK', entityId: taskId }, orderBy: { createdAt: 'desc' }, take: 50 });
}
