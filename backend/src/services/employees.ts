import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';

// ===================== EMPLOYEES =====================

export async function listEmployees(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const where: Prisma.EmployeeWhereInput = { businessId: business.id };
  const { status, department, position, search, page = '1', limit = '20' } = filters;

  if (status) where.status = status;
  if (department) where.department = department;
  if (position) where.position = { contains: position, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 20);
  const skip = (pageNum - 1) * limitNum;
  const take = limitNum;

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        employeeRole: { select: { id: true, name: true, permissions: true } },
        _count: { select: { attendances: true, documents: true, assignedTasks: true } },
      },
    }),
    prisma.employee.count({ where }),
  ]);

  return { employees, total, page: pageNum, limit: limitNum };
}

export async function getEmployee(ownerId: string, employeeId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, businessId: business.id },
    include: {
      employeeRole: true,
      schedules: { orderBy: { createdAt: 'desc' }, take: 10 },
      attendances: { orderBy: { clockIn: 'desc' }, take: 20 },
      documents: true,
      performances: { orderBy: { periodEnd: 'desc' }, take: 6 },
      activities: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!employee) throw new AppError('Employé introuvable', 404);
  return employee;
}

export async function createEmployee(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const employee = await prisma.employee.create({
    data: {
      businessId: business.id,
      firstName: data.firstName,
      lastName: data.lastName,
      photo: data.photo,
      phone: data.phone,
      whatsapp: data.whatsapp,
      email: data.email,
      gender: data.gender,
      address: data.address,
      city: data.city,
      country: data.country,
      position: data.position,
      department: data.department,
      employeeRoleId: data.employeeRoleId,
      hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
      salary: data.salary,
      salaryCurrency: data.salaryCurrency || 'FCFA',
      pinCode: data.pinCode,
      status: data.status || 'ACTIVE',
    },
    include: { employeeRole: { select: { id: true, name: true, permissions: true } } },
  });
  return employee;
}

export async function updateEmployee(ownerId: string, employeeId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const existing = await prisma.employee.findFirst({ where: { id: employeeId, businessId: business.id } });
  if (!existing) throw new AppError('Employé introuvable', 404);

  const updateData: any = {};
  const fields = ['firstName','lastName','photo','phone','whatsapp','email','gender','address','city','country','position','department','employeeRoleId','pinCode','status','salaryCurrency'];
  fields.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });
  if (data.salary !== undefined) updateData.salary = data.salary;
  if (data.hireDate !== undefined) updateData.hireDate = new Date(data.hireDate);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.employee.update({
    where: { id: employeeId },
    data: updateData,
    include: { employeeRole: { select: { id: true, name: true, permissions: true } } },
  });
}

export async function deleteEmployee(ownerId: string, employeeId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  const existing = await prisma.employee.findFirst({ where: { id: employeeId, businessId: business.id } });
  if (!existing) throw new AppError('Employé introuvable', 404);

  await prisma.employee.update({ where: { id: employeeId }, data: { status: 'INACTIVE', isActive: false } });
  return { message: 'Employé désactivé' };
}

// ===================== ROLES =====================

export async function listEmployeeRoles(ownerId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);
  return prisma.employeeRole.findMany({ where: { businessId: business.id }, orderBy: { name: 'asc' }, include: { _count: { select: { employees: true } } } });
}

export async function createEmployeeRole(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);
  return prisma.employeeRole.create({ data: { businessId: business.id, name: data.name, description: data.description, permissions: data.permissions || [], isDefault: data.isDefault || false } });
}

export async function updateEmployeeRole(ownerId: string, roleId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);
  const existing = await prisma.employeeRole.findFirst({ where: { id: roleId, businessId: business.id } });
  if (!existing) throw new AppError('Rôle introuvable', 404);

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

  return prisma.employeeRole.update({ where: { id: roleId }, data: updateData, include: { _count: { select: { employees: true } } } });
}

export async function deleteEmployeeRole(ownerId: string, roleId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);
  const existing = await prisma.employeeRole.findFirst({ where: { id: roleId, businessId: business.id } });
  if (!existing) throw new AppError('Rôle introuvable', 404);
  await prisma.employeeRole.delete({ where: { id: roleId } });
  return { message: 'Rôle supprimé' };
}

// ===================== ATTENDANCE =====================

export async function listAttendances(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);

  const where: Prisma.AttendanceWhereInput = { businessId: business.id };
  const { employeeId, dateFrom, dateTo, isLate, isAbsent, page = '1', limit = '20' } = filters;

  if (employeeId) where.employeeId = employeeId;
  if (isLate !== undefined) where.isLate = isLate === 'true';
  if (isAbsent !== undefined) where.isAbsent = isAbsent === 'true';
  if (dateFrom || dateTo) {
    where.clockIn = {};
    if (dateFrom) where.clockIn.gte = new Date(dateFrom);
    if (dateTo) where.clockIn.lte = new Date(dateTo + 'T23:59:59Z');
  }

  const attPage = Math.max(1, parseInt(page) || 1);
  const attLimit = Math.max(1, parseInt(limit) || 20);
  const skip = (attPage - 1) * attLimit;
  const take = attLimit;

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where, skip, take, orderBy: { clockIn: 'desc' },
      include: { employee: { select: { id: true, firstName: true, lastName: true, photo: true, position: true } } },
    }),
    prisma.attendance.count({ where }),
  ]);
  return { attendances, total, page: attPage, limit: attLimit };
}

export async function clockIn(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);

  const employee = await prisma.employee.findFirst({ where: { id: data.employeeId, businessId: business.id, isActive: true } });
  if (!employee) throw new AppError('Employé introuvable', 404);

  return prisma.attendance.create({
    data: { businessId: business.id, employeeId: data.employeeId, clockIn: new Date(), method: data.method || 'MANUAL', clockInLat: data.lat, clockInLng: data.lng, notes: data.notes },
    include: { employee: { select: { id: true, firstName: true, lastName: true, position: true } } },
  });
}

export async function clockOut(ownerId: string, attendanceId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);

  const attendance = await prisma.attendance.findFirst({ where: { id: attendanceId, businessId: business.id, clockOut: null } });
  if (!attendance) throw new AppError('Pointage actif introuvable', 404);

  const now = new Date();
  const totalMinutes = Math.round((now.getTime() - attendance.clockIn.getTime()) / 60000);
  const isLate = totalMinutes > 15;
  const lateMinutes = isLate ? totalMinutes - 15 : 0;

  return prisma.attendance.update({
    where: { id: attendanceId },
    data: { clockOut: now, totalMinutes, isLate, lateMinutes },
    include: { employee: { select: { id: true, firstName: true, lastName: true, position: true } } },
  });
}

export async function markAbsent(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);

  return prisma.attendance.create({
    data: { businessId: business.id, employeeId: data.employeeId, clockIn: new Date(data.date || new Date()), isAbsent: true, absenceReason: data.reason || 'Non justifié', notes: data.notes },
    include: { employee: { select: { id: true, firstName: true, lastName: true, position: true } } },
  });
}

// ===================== DOCUMENTS =====================

export async function listEmployeeDocuments(ownerId: string, employeeId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);
  return prisma.employeeDocument.findMany({ where: { businessId: business.id, employeeId }, orderBy: { createdAt: 'desc' } });
}

export async function createEmployeeDocument(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);

  return prisma.employeeDocument.create({
    data: { businessId: business.id, employeeId: data.employeeId, type: data.type, title: data.title, description: data.description, fileUrl: data.fileUrl, fileSize: data.fileSize, mimeType: data.mimeType, expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined },
  });
}

export async function deleteEmployeeDocument(ownerId: string, documentId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);
  const existing = await prisma.employeeDocument.findFirst({ where: { id: documentId, businessId: business.id } });
  if (!existing) throw new AppError('Document introuvable', 404);
  await prisma.employeeDocument.delete({ where: { id: documentId } });
  return { message: 'Document supprimé' };
}

// ===================== PERFORMANCE =====================

export async function listEmployeePerformances(ownerId: string, employeeId: string, filters: any) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);
  return prisma.employeePerformance.findMany({ where: { businessId: business.id, employeeId }, orderBy: { periodEnd: 'desc' }, take: Math.max(1, parseInt(filters.limit || '12') || 12) });
}

export async function createEmployeePerformance(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);

  return prisma.employeePerformance.create({
    data: { businessId: business.id, employeeId: data.employeeId, periodStart: new Date(data.periodStart), periodEnd: new Date(data.periodEnd), punctuality: data.punctuality, tasksCompleted: data.tasksCompleted, tasksAssigned: data.tasksAssigned, salesGenerated: data.salesGenerated, clientSatisfaction: data.clientSatisfaction, efficiency: data.efficiency, rating: data.rating, overallScore: data.overallScore, reviewNotes: data.reviewNotes, reviewedBy: data.reviewedBy },
  });
}

// ===================== ACTIVITIES =====================

export async function listEmployeeActivities(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);

  const where: Prisma.EmployeeActivityWhereInput = { businessId: business.id };
  const { employeeId, action, dateFrom, dateTo, page = '1', limit = '30' } = filters;

  if (employeeId) where.employeeId = employeeId;
  if (action) where.action = action;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }

  const actPage = Math.max(1, parseInt(page) || 1);
  const actLimit = Math.max(1, parseInt(limit) || 30);
  const skip = (actPage - 1) * actLimit;
  const take = actLimit;

  const [activities, total] = await Promise.all([
    prisma.employeeActivity.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { employee: { select: { id: true, firstName: true, lastName: true, position: true } } } }),
    prisma.employeeActivity.count({ where }),
  ]);
  return { activities, total, page: actPage, limit: actLimit };
}

// ===================== STATS =====================

export async function getEmployeeStats(ownerId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
  if (!business) throw new AppError('Business not found', 404);

  const bizId = business.id;
  const todayStart = new Date(new Date().toDateString());

  const [totalEmployees, activeEmployees, onLeave, suspended, totalRoles, todayAttendances, todayLate, todayAbsent, totalDocuments, expiringDocuments] = await Promise.all([
    prisma.employee.count({ where: { businessId: bizId } }),
    prisma.employee.count({ where: { businessId: bizId, status: 'ACTIVE', isActive: true } }),
    prisma.employee.count({ where: { businessId: bizId, status: 'ON_LEAVE' } }),
    prisma.employee.count({ where: { businessId: bizId, status: 'SUSPENDED' } }),
    prisma.employeeRole.count({ where: { businessId: bizId } }),
    prisma.attendance.count({ where: { businessId: bizId, clockIn: { gte: todayStart }, isAbsent: false } }),
    prisma.attendance.count({ where: { businessId: bizId, clockIn: { gte: todayStart }, isLate: true } }),
    prisma.attendance.count({ where: { businessId: bizId, clockIn: { gte: todayStart }, isAbsent: true } }),
    prisma.employeeDocument.count({ where: { businessId: bizId } }),
    prisma.employeeDocument.count({ where: { businessId: bizId, expiresAt: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, isExpired: false } }),
  ]);

  return { totalEmployees, activeEmployees, onLeave, suspended, totalRoles, todayAttendances, todayLate, todayAbsent, totalDocuments, expiringDocuments };
}

// ===================== ACTIVITY LOGGER =====================

export async function logEmployeeActivity(ownerId: string, employeeId: string, action: string, module?: string, description?: string, metadata?: any, ipAddress?: string) {
  try {
    const business = await prisma.business.findFirst({ where: { ownerId, isActive: true }, select: { id: true } });
    if (!business) return;
    await prisma.employeeActivity.create({ data: { businessId: business.id, employeeId, action, module, description, metadata: metadata || undefined, ipAddress } });
  } catch (e) {
    logger.error('Employee activity log failed', { error: e });
  }
}
