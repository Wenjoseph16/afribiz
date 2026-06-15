const fs = require('fs');
const path = require('path');

// ============================================================
// SERVICE: backend/src/services/employees.ts
// ============================================================
const serviceContent = `import { Prisma, PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/response';

const prisma = new PrismaClient();

// ===================== EMPLOYEES =====================

export async function listEmployees(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

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

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        employeeRole: { select: { id: true, name: true, permissions: true } },
        _count: { select: { attendances: true, documents: true, assignedTasks: true } },
      },
    }),
    prisma.employee.count({ where }),
  ]);

  return { employees, total, page: parseInt(page), limit: take };
}

export async function getEmployee(ownerId: string, employeeId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, businessId: business.id },
    include: {
      employeeRole: true,
      schedules: { orderBy: { date: 'desc' }, take: 10 },
      attendances: { orderBy: { clockIn: 'desc' }, take: 20 },
      documents: true,
      performances: { orderBy: { periodEnd: 'desc' }, take: 6 },
      activities: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!employee) throw new ApiError(404, 'Employé introuvable');

  return employee;
}

export async function createEmployee(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

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
  if (!business) throw new ApiError(404, 'Business not found');

  const existing = await prisma.employee.findFirst({
    where: { id: employeeId, businessId: business.id },
  });
  if (!existing) throw new ApiError(404, 'Employé introuvable');

  const updateData: any = {};
  const fields = ['firstName', 'lastName', 'photo', 'phone', 'whatsapp', 'email',
    'gender', 'address', 'city', 'country', 'position', 'department',
    'employeeRoleId', 'pinCode', 'status', 'salaryCurrency'];
  fields.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });
  if (data.salary !== undefined) updateData.salary = data.salary;
  if (data.hireDate !== undefined) updateData.hireDate = new Date(data.hireDate);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data: updateData,
    include: { employeeRole: { select: { id: true, name: true, permissions: true } } },
  });

  return employee;
}

export async function deleteEmployee(ownerId: string, employeeId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const existing = await prisma.employee.findFirst({
    where: { id: employeeId, businessId: business.id },
  });
  if (!existing) throw new ApiError(404, 'Employé introuvable');

  await prisma.employee.update({
    where: { id: employeeId },
    data: { status: 'INACTIVE', isActive: false },
  });

  return { message: 'Employé désactivé avec succès' };
}

// ===================== EMPLOYEE ROLES =====================

export async function listEmployeeRoles(ownerId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const roles = await prisma.employeeRole.findMany({
    where: { businessId: business.id },
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true } } },
  });

  return roles;
}

export async function createEmployeeRole(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const role = await prisma.employeeRole.create({
    data: {
      businessId: business.id,
      name: data.name,
      description: data.description,
      permissions: data.permissions || [],
      isDefault: data.isDefault || false,
    },
  });

  return role;
}

export async function updateEmployeeRole(ownerId: string, roleId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const existing = await prisma.employeeRole.findFirst({
    where: { id: roleId, businessId: business.id },
  });
  if (!existing) throw new ApiError(404, 'Rôle introuvable');

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

  const role = await prisma.employeeRole.update({
    where: { id: roleId },
    data: updateData,
    include: { _count: { select: { employees: true } } },
  });

  return role;
}

export async function deleteEmployeeRole(ownerId: string, roleId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const existing = await prisma.employeeRole.findFirst({
    where: { id: roleId, businessId: business.id },
  });
  if (!existing) throw new ApiError(404, 'Rôle introuvable');

  await prisma.employeeRole.delete({ where: { id: roleId } });
  return { message: 'Rôle supprimé avec succès' };
}

// ===================== ATTENDANCE =====================

export async function listAttendances(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

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

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take,
      orderBy: { clockIn: 'desc' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, photo: true, position: true } },
      },
    }),
    prisma.attendance.count({ where }),
  ]);

  return { attendances, total, page: parseInt(page), limit: take };
}

export async function clockIn(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, businessId: business.id, isActive: true },
  });
  if (!employee) throw new ApiError(404, 'Employé introuvable ou inactif');

  const now = new Date();
  const attendance = await prisma.attendance.create({
    data: {
      businessId: business.id,
      employeeId: data.employeeId,
      clockIn: now,
      method: data.method || 'MANUAL',
      clockInLat: data.lat,
      clockInLng: data.lng,
      notes: data.notes,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true } },
    },
  });

  return attendance;
}

export async function clockOut(ownerId: string, attendanceId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const attendance = await prisma.attendance.findFirst({
    where: { id: attendanceId, businessId: business.id, clockOut: null },
  });
  if (!attendance) throw new ApiError(404, 'Pointage actif introuvable');

  const now = new Date();
  const totalMinutes = Math.round((now.getTime() - attendance.clockIn.getTime()) / 60000);
  const isLate = totalMinutes > 15; // Late if more than 15 min difference from expected
  const lateMinutes = isLate ? totalMinutes - 15 : 0;

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      clockOut: now,
      totalMinutes,
      isLate,
      lateMinutes,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true } },
    },
  });

  return updated;
}

export async function markAbsent(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const attendance = await prisma.attendance.create({
    data: {
      businessId: business.id,
      employeeId: data.employeeId,
      clockIn: new Date(data.date || new Date()),
      isAbsent: true,
      absenceReason: data.reason || 'Non justifié',
      notes: data.notes,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true } },
    },
  });

  return attendance;
}

// ===================== EMPLOYEE DOCUMENTS =====================

export async function listEmployeeDocuments(ownerId: string, employeeId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const docs = await prisma.employeeDocument.findMany({
    where: { businessId: business.id, employeeId },
    orderBy: { createdAt: 'desc' },
  });

  return docs;
}

export async function createEmployeeDocument(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const doc = await prisma.employeeDocument.create({
    data: {
      businessId: business.id,
      employeeId: data.employeeId,
      type: data.type,
      title: data.title,
      description: data.description,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
  });

  return doc;
}

export async function deleteEmployeeDocument(ownerId: string, documentId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const existing = await prisma.employeeDocument.findFirst({
    where: { id: documentId, businessId: business.id },
  });
  if (!existing) throw new ApiError(404, 'Document introuvable');

  await prisma.employeeDocument.delete({ where: { id: documentId } });
  return { message: 'Document supprimé avec succès' };
}

// ===================== PERFORMANCE =====================

export async function listEmployeePerformances(ownerId: string, employeeId: string, filters: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const where: Prisma.EmployeePerformanceWhereInput = { businessId: business.id, employeeId };
  const { limit = '12' } = filters;

  const performances = await prisma.employeePerformance.findMany({
    where,
    orderBy: { periodEnd: 'desc' },
    take: parseInt(limit),
  });

  return performances;
}

export async function createEmployeePerformance(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const performance = await prisma.employeePerformance.create({
    data: {
      businessId: business.id,
      employeeId: data.employeeId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      punctuality: data.punctuality,
      tasksCompleted: data.tasksCompleted,
      tasksAssigned: data.tasksAssigned,
      salesGenerated: data.salesGenerated,
      clientSatisfaction: data.clientSatisfaction,
      efficiency: data.efficiency,
      rating: data.rating,
      overallScore: data.overallScore,
      reviewNotes: data.reviewNotes,
      reviewedBy: data.reviewedBy,
    },
  });

  return performance;
}

// ===================== ACTIVITY LOG =====================

export async function listEmployeeActivities(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const where: Prisma.EmployeeActivityWhereInput = { businessId: business.id };
  const { employeeId, action, dateFrom, dateTo, page = '1', limit = '30' } = filters;

  if (employeeId) where.employeeId = employeeId;
  if (action) where.action = action;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [activities, total] = await Promise.all([
    prisma.employeeActivity.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, position: true } },
      },
    }),
    prisma.employeeActivity.count({ where }),
  ]);

  return { activities, total, page: parseInt(page), limit: take };
}

// ===================== STATS =====================

export async function getEmployeeStats(ownerId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new ApiError(404, 'Business not found');

  const bizId = business.id;

  const [
    totalEmployees,
    activeEmployees,
    onLeave,
    suspended,
    totalRoles,
    todayAttendances,
    todayLate,
    todayAbsent,
    totalDocuments,
    expiringDocuments,
  ] = await Promise.all([
    prisma.employee.count({ where: { businessId: bizId } }),
    prisma.employee.count({ where: { businessId: bizId, status: 'ACTIVE', isActive: true } }),
    prisma.employee.count({ where: { businessId: bizId, status: 'ON_LEAVE' } }),
    prisma.employee.count({ where: { businessId: bizId, status: 'SUSPENDED' } }),
    prisma.employeeRole.count({ where: { businessId: bizId } }),
    prisma.attendance.count({
      where: {
        businessId: bizId,
        clockIn: { gte: new Date(new Date().toDateString()) },
        isAbsent: false,
      },
    }),
    prisma.attendance.count({
      where: {
        businessId: bizId,
        clockIn: { gte: new Date(new Date().toDateString()) },
        isLate: true,
      },
    }),
    prisma.attendance.count({
      where: {
        businessId: bizId,
        clockIn: { gte: new Date(new Date().toDateString()) },
        isAbsent: true,
      },
    }),
    prisma.employeeDocument.count({ where: { businessId: bizId } }),
    prisma.employeeDocument.count({
      where: {
        businessId: bizId,
        expiresAt: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        isExpired: false,
      },
    }),
  ]);

  return {
    totalEmployees,
    activeEmployees,
    onLeave,
    suspended,
    totalRoles,
    todayAttendances,
    todayLate,
    todayAbsent,
    totalDocuments,
    expiringDocuments,
  };
}

// ===================== ACTIVITY LOGGER (internal) =====================

export async function logEmployeeActivity(ownerId: string, employeeId: string, action: string, module?: string, description?: string, metadata?: any, ipAddress?: string) {
  try {
    const business = await prisma.business.findFirst({
      where: { ownerId, isActive: true },
      select: { id: true },
    });
    if (!business) return;

    await prisma.employeeActivity.create({
      data: {
        businessId: business.id,
        employeeId,
        action,
        module,
        description,
        metadata: metadata || undefined,
        ipAddress,
      },
    });
  } catch (e) {
    console.error('Employee activity log failed:', e);
  }
}
`;

fs.writeFileSync('backend/src/services/employees.ts', serviceContent);
console.log('✅ Service created');

// ============================================================
// CONTROLLER: backend/src/controllers/employees.ts
// ============================================================
const controllerContent = `import { Request, Response, NextFunction } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as employeeService from '../services/employees';
import { sendSuccess } from '../utils/response';

// ===================== EMPLOYEES =====================

export const listEmployees = catchAsyncErrors(async (req: Request, res: Response) => {
  const result = await employeeService.listEmployees(req.user!.id, req.query);
  sendSuccess(res, { result });
});

export const getEmployee = catchAsyncErrors(async (req: Request, res: Response) => {
  const employee = await employeeService.getEmployee(req.user!.id, req.params.id);
  sendSuccess(res, { employee });
});

export const createEmployee = catchAsyncErrors(async (req: Request, res: Response) => {
  const employee = await employeeService.createEmployee(req.user!.id, req.body);
  sendSuccess(res, { employee }, 201);
});

export const updateEmployee = catchAsyncErrors(async (req: Request, res: Response) => {
  const employee = await employeeService.updateEmployee(req.user!.id, req.params.id, req.body);
  sendSuccess(res, { employee });
});

export const deleteEmployee = catchAsyncErrors(async (req: Request, res: Response) => {
  const result = await employeeService.deleteEmployee(req.user!.id, req.params.id);
  sendSuccess(res, { result });
});

// ===================== ROLES =====================

export const listEmployeeRoles = catchAsyncErrors(async (req: Request, res: Response) => {
  const roles = await employeeService.listEmployeeRoles(req.user!.id);
  sendSuccess(res, { roles });
});

export const createEmployeeRole = catchAsyncErrors(async (req: Request, res: Response) => {
  const role = await employeeService.createEmployeeRole(req.user!.id, req.body);
  sendSuccess(res, { role }, 201);
});

export const updateEmployeeRole = catchAsyncErrors(async (req: Request, res: Response) => {
  const role = await employeeService.updateEmployeeRole(req.user!.id, req.params.id, req.body);
  sendSuccess(res, { role });
});

export const deleteEmployeeRole = catchAsyncErrors(async (req: Request, res: Response) => {
  const result = await employeeService.deleteEmployeeRole(req.user!.id, req.params.id);
  sendSuccess(res, { result });
});

// ===================== ATTENDANCE =====================

export const listAttendances = catchAsyncErrors(async (req: Request, res: Response) => {
  const result = await employeeService.listAttendances(req.user!.id, req.query);
  sendSuccess(res, { result });
});

export const clockIn = catchAsyncErrors(async (req: Request, res: Response) => {
  const attendance = await employeeService.clockIn(req.user!.id, req.body);
  sendSuccess(res, { attendance }, 201);
});

export const clockOut = catchAsyncErrors(async (req: Request, res: Response) => {
  const attendance = await employeeService.clockOut(req.user!.id, req.params.id);
  sendSuccess(res, { attendance });
});

export const markAbsent = catchAsyncErrors(async (req: Request, res: Response) => {
  const attendance = await employeeService.markAbsent(req.user!.id, req.body);
  sendSuccess(res, { attendance }, 201);
});

// ===================== DOCUMENTS =====================

export const listEmployeeDocuments = catchAsyncErrors(async (req: Request, res: Response) => {
  const documents = await employeeService.listEmployeeDocuments(req.user!.id, req.params.employeeId);
  sendSuccess(res, { documents });
});

export const createEmployeeDocument = catchAsyncErrors(async (req: Request, res: Response) => {
  const document = await employeeService.createEmployeeDocument(req.user!.id, req.body);
  sendSuccess(res, { document }, 201);
});

export const deleteEmployeeDocument = catchAsyncErrors(async (req: Request, res: Response) => {
  const result = await employeeService.deleteEmployeeDocument(req.user!.id, req.params.id);
  sendSuccess(res, { result });
});

// ===================== PERFORMANCE =====================

export const listEmployeePerformances = catchAsyncErrors(async (req: Request, res: Response) => {
  const performances = await employeeService.listEmployeePerformances(req.user!.id, req.params.employeeId, req.query);
  sendSuccess(res, { performances });
});

export const createEmployeePerformance = catchAsyncErrors(async (req: Request, res: Response) => {
  const performance = await employeeService.createEmployeePerformance(req.user!.id, req.body);
  sendSuccess(res, { performance }, 201);
});

// ===================== ACTIVITIES =====================

export const listEmployeeActivities = catchAsyncErrors(async (req: Request, res: Response) => {
  const result = await employeeService.listEmployeeActivities(req.user!.id, req.query);
  sendSuccess(res, { result });
});

// ===================== STATS =====================

export const getEmployeeStats = catchAsyncErrors(async (req: Request, res: Response) => {
  const stats = await employeeService.getEmployeeStats(req.user!.id);
  sendSuccess(res, { stats });
});
`;

fs.writeFileSync('backend/src/controllers/employees.ts', controllerContent);
console.log('✅ Controller created');

// ============================================================
// ROUTES: backend/src/routes/employees.ts
// ============================================================
const routesContent = `import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listEmployeeRoles,
  createEmployeeRole,
  updateEmployeeRole,
  deleteEmployeeRole,
  listAttendances,
  clockIn,
  clockOut,
  markAbsent,
  listEmployeeDocuments,
  createEmployeeDocument,
  deleteEmployeeDocument,
  listEmployeePerformances,
  createEmployeePerformance,
  listEmployeeActivities,
  getEmployeeStats,
} from '../controllers/employees';

const router = Router();

router.use(authMiddleware);

// Stats
router.get('/stats', getEmployeeStats);

// Employees CRUD
router.get('/', listEmployees);
router.get('/:id', getEmployee);
router.post('/', createEmployee);
router.patch('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

// Roles
router.get('/roles/list', listEmployeeRoles);
router.post('/roles', createEmployeeRole);
router.patch('/roles/:id', updateEmployeeRole);
router.delete('/roles/:id', deleteEmployeeRole);

// Attendance
router.get('/attendances', listAttendances);
router.post('/attendance/clock-in', clockIn);
router.patch('/attendance/clock-out/:id', clockOut);
router.post('/attendance/absent', markAbsent);

// Documents
router.get('/:employeeId/documents', listEmployeeDocuments);
router.post('/documents', createEmployeeDocument);
router.delete('/documents/:id', deleteEmployeeDocument);

// Performance
router.get('/:employeeId/performances', listEmployeePerformances);
router.post('/performances', createEmployeePerformance);

// Activities
router.get('/activities/logs', listEmployeeActivities);

export default router;
`;

fs.writeFileSync('backend/src/routes/employees.ts', routesContent);
console.log('✅ Routes created');
console.log('✅ All backend files generated');
`;

// ============================================================
// RUN
// ============================================================
const evalContent = `
const fs2 = require('fs');
const serviceContent = ${JSON.stringify(serviceContent)};
const controllerContent = ${JSON.stringify(controllerContent)};
const routesContent = ${JSON.stringify(routesContent)};

fs2.writeFileSync('backend/src/services/employees.ts', serviceContent);
fs2.writeFileSync('backend/src/controllers/employees.ts', controllerContent);
fs2.writeFileSync('backend/src/routes/employees.ts', routesContent);
console.log('✅ All backend files generated');
`;

// Use simpler approach - write directly
console.log('Using simpler approach...');
fs.writeFileSync('backend/src/services/employees.ts', serviceContent);
fs.writeFileSync('backend/src/controllers/employees.ts', controllerContent);
fs.writeFileSync('backend/src/routes/employees.ts', routesContent);
console.log('✅ All backend files written successfully');
