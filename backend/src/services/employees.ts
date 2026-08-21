import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { getBusinessByOwner } from '../lib/businessAccess';
import { logger } from '../lib/logger';
import { hashPassword } from '../lib/password';

// ===================== EMPLOYEES =====================

export async function listEmployees(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);

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

  return { employees, total, page: pageNum, limit: limitNum };
}

export async function getEmployee(ownerId: string, employeeId: string) {
  const business = await getBusinessByOwner(ownerId);

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
  const business = await getBusinessByOwner(ownerId);

  // Hasher le PIN si fourni (Chantier 7 : sécurité)
  const hashedPin = data.pinCode ? await hashPassword(data.pinCode) : undefined;

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
      pinCode: hashedPin,
      maxDiscountPercentage: data.maxDiscountPercentage,
      status: data.status || 'ACTIVE',
    },
    include: { employeeRole: { select: { id: true, name: true, permissions: true } } },
  });
  return employee;
}

export async function updateEmployee(ownerId: string, employeeId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);

  const existing = await prisma.employee.findFirst({
    where: { id: employeeId, businessId: business.id },
  });
  if (!existing) throw new AppError('Employé introuvable', 404);

  const updateData: any = {};
  const fields = [
    'firstName',
    'lastName',
    'photo',
    'phone',
    'whatsapp',
    'email',
    'gender',
    'address',
    'city',
    'country',
    'position',
    'department',
    'employeeRoleId',
    'status',
    'salaryCurrency',
  ];
  fields.forEach((f) => {
    if (data[f] !== undefined) updateData[f] = data[f];
  });
  if (data.salary !== undefined) updateData.salary = data.salary;
  if (data.hireDate !== undefined) updateData.hireDate = new Date(data.hireDate);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.maxDiscountPercentage !== undefined)
    updateData.maxDiscountPercentage = data.maxDiscountPercentage;

  // Hasher le PIN si modifié (Chantier 7 : sécurité)
  if (data.pinCode !== undefined) {
    updateData.pinCode = data.pinCode ? await hashPassword(data.pinCode) : null;
  }

  return prisma.employee.update({
    where: { id: employeeId },
    data: updateData,
    include: { employeeRole: { select: { id: true, name: true, permissions: true } } },
  });
}

export async function deleteEmployee(ownerId: string, employeeId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.employee.findFirst({
    where: { id: employeeId, businessId: business.id },
  });
  if (!existing) throw new AppError('Employé introuvable', 404);

  await prisma.employee.update({
    where: { id: employeeId },
    data: { status: 'INACTIVE', isActive: false },
  });
  return { message: 'Employé désactivé' };
}

// ===================== ROLES =====================

export async function listEmployeeRoles(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.employeeRole.findMany({
    where: { businessId: business.id },
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true } } },
  });
}

export async function createEmployeeRole(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.employeeRole.create({
    data: {
      businessId: business.id,
      name: data.name,
      description: data.description,
      permissions: data.permissions || [],
      isDefault: data.isDefault || false,
    },
  });
}

export async function updateEmployeeRole(ownerId: string, roleId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.employeeRole.findFirst({
    where: { id: roleId, businessId: business.id },
  });
  if (!existing) throw new AppError('Rôle introuvable', 404);

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

  return prisma.employeeRole.update({
    where: { id: roleId },
    data: updateData,
    include: { _count: { select: { employees: true } } },
  });
}

export async function deleteEmployeeRole(ownerId: string, roleId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.employeeRole.findFirst({
    where: { id: roleId, businessId: business.id },
  });
  if (!existing) throw new AppError('Rôle introuvable', 404);
  await prisma.employeeRole.delete({ where: { id: roleId } });
  return { message: 'Rôle supprimé' };
}

// ===================== ATTENDANCE =====================

export async function listAttendances(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);

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
      where,
      skip,
      take,
      orderBy: { clockIn: 'desc' },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, photo: true, position: true },
        },
      },
    }),
    prisma.attendance.count({ where }),
  ]);
  return { attendances, total, page: attPage, limit: attLimit };
}

/**
 * Haversine formula to calculate distance between two coordinates in meters.
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function clockIn(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);

  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, businessId: business.id, isActive: true },
  });
  if (!employee) throw new AppError('Employé introuvable', 404);

  // F4 — GPS Geo-fence validation
  if (data.method === 'GPS' && data.lat !== undefined && data.lng !== undefined) {
    if (!business.latitude || !business.longitude) {
      throw new AppError(
        "L'entreprise n'a pas de coordonnées GPS configurées. Veuillez définir la position dans les paramètres.",
        400
      );
    }
    const maxRadiusMeters = 100; // 100m default radius
    const distance = haversineDistance(business.latitude, business.longitude, data.lat, data.lng);
    if (distance > maxRadiusMeters) {
      throw new AppError(
        `Vous êtes à ${Math.round(distance)}m de l'entreprise (max: ${maxRadiusMeters}m). Rapprochez-vous pour pointer.`,
        400
      );
    }
  }

  // F4 — QR Code validation
  if (data.method === 'QR_CODE') {
    if (!data.qrToken) {
      throw new AppError('Token QR requis pour le pointage par QR code.', 400);
    }
    // Validate QR token: must match businessId-based token
    const expectedToken = Buffer.from(`afribiz:qr:${business.id}:${employee.id}`).toString(
      'base64'
    );
    if (data.qrToken !== expectedToken) {
      throw new AppError('QR code invalide ou expiré.', 400);
    }
  }

  return prisma.attendance.create({
    data: {
      businessId: business.id,
      employeeId: data.employeeId,
      clockIn: new Date(),
      method: data.method || 'MANUAL',
      clockInLat: data.lat,
      clockInLng: data.lng,
      notes: data.notes,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true } },
    },
  });
}

export async function clockOut(ownerId: string, attendanceId: string) {
  const business = await getBusinessByOwner(ownerId);

  const attendance = await prisma.attendance.findFirst({
    where: { id: attendanceId, businessId: business.id, clockOut: null },
  });
  if (!attendance) throw new AppError('Pointage actif introuvable', 404);

  const now = new Date();
  const totalMinutes = Math.round((now.getTime() - attendance.clockIn.getTime()) / 60000);
  const isLate = totalMinutes > 15;
  const lateMinutes = isLate ? totalMinutes - 15 : 0;

  return prisma.attendance.update({
    where: { id: attendanceId },
    data: { clockOut: now, totalMinutes, isLate, lateMinutes },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true } },
    },
  });
}

export async function markAbsent(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);

  return prisma.attendance.create({
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
}

// ===================== DOCUMENTS =====================

export async function listEmployeeDocuments(ownerId: string, employeeId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.employeeDocument.findMany({
    where: { businessId: business.id, employeeId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createEmployeeDocument(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);

  return prisma.employeeDocument.create({
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
}

export async function deleteEmployeeDocument(ownerId: string, documentId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.employeeDocument.findFirst({
    where: { id: documentId, businessId: business.id },
  });
  if (!existing) throw new AppError('Document introuvable', 404);
  await prisma.employeeDocument.delete({ where: { id: documentId } });
  return { message: 'Document supprimé' };
}

// ===================== PERFORMANCE =====================

export async function listEmployeePerformances(ownerId: string, employeeId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.employeePerformance.findMany({
    where: { businessId: business.id, employeeId },
    orderBy: { periodEnd: 'desc' },
    take: Math.max(1, parseInt(filters.limit || '12') || 12),
  });
}

export async function createEmployeePerformance(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);

  return prisma.employeePerformance.create({
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
}

// ===================== ACTIVITIES =====================

export async function listEmployeeActivities(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);

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
  return { activities, total, page: actPage, limit: actLimit };
}

// ===================== STATS =====================

export async function getEmployeeStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);

  const bizId = business.id;
  const todayStart = new Date(new Date().toDateString());

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
      where: { businessId: bizId, clockIn: { gte: todayStart }, isAbsent: false },
    }),
    prisma.attendance.count({
      where: { businessId: bizId, clockIn: { gte: todayStart }, isLate: true },
    }),
    prisma.attendance.count({
      where: { businessId: bizId, clockIn: { gte: todayStart }, isAbsent: true },
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

export async function getEmployeeEnrichedStats(businessId: string) {
  const bizId = businessId;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalEmployees,
    activeEmployees,
    onLeaveCount,
    suspendedCount,
    inactiveCount,
    ,
    departedLast30Days,
    activeEmployeesWithHireDate,
    departmentGroup,
    positionGroup,
    genderGroup,
    totalPayrollResult,
    averageSalaryResult,
    last30DaysAttendances,
  ] = await Promise.all([
    prisma.employee.count({ where: { businessId: bizId } }),
    prisma.employee.count({ where: { businessId: bizId, status: 'ACTIVE', isActive: true } }),
    prisma.employee.count({ where: { businessId: bizId, status: 'ON_LEAVE' } }),
    prisma.employee.count({ where: { businessId: bizId, status: 'SUSPENDED' } }),
    prisma.employee.count({ where: { businessId: bizId, status: 'INACTIVE' } }),
    prisma.employee.count({
      where: { businessId: bizId, hireDate: { gte: thirtyDaysAgo } },
    }),
    prisma.employee.count({
      where: { businessId: bizId, status: 'INACTIVE', updatedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.employee.findMany({
      where: { businessId: bizId, status: 'ACTIVE', isActive: true, hireDate: { not: null } },
      select: { hireDate: true },
    }),
    prisma.employee.groupBy({
      by: ['department'],
      where: { businessId: bizId, department: { not: null } },
      _count: true,
    }),
    prisma.employee.groupBy({
      by: ['position'],
      where: { businessId: bizId },
      _count: true,
    }),
    prisma.employee.groupBy({
      by: ['gender'],
      where: { businessId: bizId, gender: { not: null } },
      _count: true,
    }),
    prisma.employee.aggregate({
      where: { businessId: bizId, status: 'ACTIVE', isActive: true },
      _sum: { salary: true },
    }),
    prisma.employee.aggregate({
      where: { businessId: bizId, status: 'ACTIVE', isActive: true },
      _avg: { salary: true },
    }),
    prisma.attendance.findMany({
      where: { businessId: bizId, clockIn: { gte: thirtyDaysAgo } },
      select: { isAbsent: true },
    }),
  ]);

  const turnoverRate = totalEmployees > 0 ? (departedLast30Days / totalEmployees) * 100 : 0;

  const totalTenureDays = activeEmployeesWithHireDate.reduce((sum, e) => {
    return sum + (now.getTime() - e.hireDate!.getTime()) / (1000 * 60 * 60 * 24);
  }, 0);
  const averageTenure =
    activeEmployeesWithHireDate.length > 0
      ? Math.round(totalTenureDays / activeEmployeesWithHireDate.length)
      : 0;

  const departmentBreakdown: Record<string, number> = {};
  departmentGroup.forEach((g) => {
    if (g.department) departmentBreakdown[g.department] = g._count;
  });

  const positionBreakdown: Record<string, number> = {};
  positionGroup.forEach((g) => {
    positionBreakdown[g.position] = g._count;
  });

  const genderDistribution: Record<string, number> = {};
  genderGroup.forEach((g) => {
    if (g.gender) genderDistribution[g.gender] = g._count;
  });

  const presentCount = last30DaysAttendances.filter((a) => !a.isAbsent).length;
  const absentCount = last30DaysAttendances.filter((a) => a.isAbsent).length;
  const attendanceRate =
    presentCount + absentCount > 0 ? (presentCount / (presentCount + absentCount)) * 100 : 0;

  return {
    totalEmployees,
    activeEmployees,
    onLeaveCount,
    suspendedCount,
    inactiveCount,
    turnoverRate: Math.round(turnoverRate * 100) / 100,
    averageTenure,
    departmentBreakdown,
    positionBreakdown,
    totalPayroll: Number(totalPayrollResult._sum.salary || 0),
    averageSalary: Number(averageSalaryResult._avg.salary || 0),
    genderDistribution,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
  };
}

// ===================== PAYSLIP PDF =====================

export async function generatePayslipPDF(employeeId: string, period: string) {
  const now = new Date();
  const [yearStr, monthStr] = period.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1;
  const startOfPeriod = new Date(year, month, 1);
  const endOfPeriod = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      employeeRole: { select: { id: true, name: true, permissions: true } },
      attendances: {
        where: { clockIn: { gte: startOfPeriod, lte: endOfPeriod } },
        select: { isAbsent: true },
      },
      Leave: {
        where: {
          status: 'APPROVED',
          startDate: { lte: endOfPeriod },
          endDate: { gte: startOfPeriod },
        },
        select: { startDate: true, endDate: true },
      },
      Payroll: {
        where: { periodStart: { gte: startOfPeriod }, periodEnd: { lte: endOfPeriod } },
        select: { baseSalary: true, bonuses: true, deductions: true, netAmount: true },
      },
    },
  });
  if (!employee) throw new AppError('Employé introuvable', 404);

  const grossSalary = Number(employee.salary || 0);
  let deductions = 0;
  const payrollData = (employee as any).Payroll || [];
  if (payrollData.length > 0) {
    deductions = Number(payrollData[0].deductions || 0);
  } else {
    deductions = Math.round(grossSalary * 0.08 * 100) / 100;
  }
  const netSalary = grossSalary - deductions;

  const attendanceArr = (employee as any).attendances || [];
  const presentDays = attendanceArr.filter((a: any) => !a.isAbsent).length;
  const absentDays = attendanceArr.filter((a: any) => a.isAbsent).length;

  let leaveDays = 0;
  const leavesArr = (employee as any).Leave || [];
  if (leavesArr.length > 0) {
    leavesArr.forEach((l: any) => {
      const diffTime = l.endDate.getTime() - l.startDate.getTime();
      leaveDays += Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    });
  }

  const currency = employee.salaryCurrency || 'FCFA';
  const fmt = (amount: number): string =>
    amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) +
    ' ' +
    currency;

  const pdfModule: any = await import('pdfmake');
  const vfsFonts: any = await import('pdfmake/build/vfs_fonts');
  pdfModule.default.vfs = vfsFonts.default || vfsFonts;

  const docDef: any = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    defaultStyle: { font: 'Roboto', fontSize: 10, color: '#374151' },
    info: {
      title: `Fiche de paie - ${employee.firstName} ${employee.lastName} - ${period}`,
      author: 'AfriBiz',
    },
    content: [
      {
        columns: [
          { text: 'AfriBiz', fontSize: 16, bold: true, color: '#6366f1' },
          { text: 'FICHE DE PAIE', fontSize: 14, bold: true, alignment: 'right', color: '#1f2937' },
        ],
        margin: [0, 0, 0, 4],
      },
      {
        text: `Période : ${period}`,
        fontSize: 10,
        color: '#6b7280',
        margin: [0, 0, 0, 20],
        alignment: 'right',
      },
      {
        canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 1, color: '#e5e7eb' }],
        margin: [0, 0, 0, 16],
      },
      {
        text: 'INFORMATIONS EMPLOYÉ',
        fontSize: 11,
        bold: true,
        color: '#374151',
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: 'Nom', bold: true, fontSize: 9, color: '#6b7280' },
              { text: `${employee.firstName} ${employee.lastName}`, fontSize: 9 },
              { text: 'Poste', bold: true, fontSize: 9, color: '#6b7280' },
              { text: employee.position || '-', fontSize: 9 },
            ],
            [
              { text: 'Département', bold: true, fontSize: 9, color: '#6b7280' },
              { text: employee.department || '-', fontSize: 9 },
              { text: 'Statut', bold: true, fontSize: 9, color: '#6b7280' },
              { text: employee.status || '-', fontSize: 9 },
            ],
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 16],
      },
      {
        canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 1, color: '#e5e7eb' }],
        margin: [0, 0, 0, 16],
      },
      {
        text: 'RUBRIQUES SALARIALES',
        fontSize: 11,
        bold: true,
        color: '#374151',
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          widths: ['*', 'auto'],
          headerRows: 1,
          body: [
            [
              {
                text: 'Rubrique',
                bold: true,
                fontSize: 10,
                color: '#374151',
                fillColor: '#f3f4f6',
              },
              {
                text: 'Montant',
                bold: true,
                fontSize: 10,
                color: '#374151',
                alignment: 'right',
                fillColor: '#f3f4f6',
              },
            ],
            [
              { text: 'Salaire brut', fontSize: 10 },
              { text: fmt(grossSalary), fontSize: 10, alignment: 'right' },
            ],
            [
              { text: 'Déductions (taxes, sécurité sociale)', fontSize: 10, color: '#dc2626' },
              { text: `- ${fmt(deductions)}`, fontSize: 10, alignment: 'right', color: '#dc2626' },
            ],
            [
              { text: 'Salaire net', bold: true, fontSize: 11, color: '#16a34a' },
              {
                text: fmt(netSalary),
                bold: true,
                fontSize: 11,
                alignment: 'right',
                color: '#16a34a',
              },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      },
      {
        canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 1, color: '#e5e7eb' }],
        margin: [0, 0, 0, 16],
      },
      {
        text: 'RÉSUMÉ DES PRÉSENCES',
        fontSize: 11,
        bold: true,
        color: '#374151',
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          widths: ['*', 'auto'],
          headerRows: 1,
          body: [
            [
              {
                text: 'Indicateur',
                bold: true,
                fontSize: 10,
                color: '#374151',
                fillColor: '#f3f4f6',
              },
              {
                text: 'Valeur',
                bold: true,
                fontSize: 10,
                color: '#374151',
                alignment: 'right',
                fillColor: '#f3f4f6',
              },
            ],
            [
              { text: 'Jours présents', fontSize: 10 },
              { text: `${presentDays}`, fontSize: 10, alignment: 'right' },
            ],
            [
              { text: 'Jours absents', fontSize: 10 },
              { text: `${absentDays}`, fontSize: 10, alignment: 'right' },
            ],
            [
              { text: 'Jours de congé', fontSize: 10 },
              { text: `${leaveDays}`, fontSize: 10, alignment: 'right' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      },
    ],
    footer: (currentPage: number, pageCount: number) => ({
      text: `Généré le ${now.toLocaleDateString('fr-FR')} | Page ${currentPage}/${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: '#9ca3af',
      margin: [0, 20, 0, 0],
    }),
  };

  return new Promise<string>((resolve, reject) => {
    try {
      const pdfDoc = pdfModule.default.createPdf(docDef);
      pdfDoc.getBuffer((error: any, buffer: Buffer) => {
        if (error) reject(error);
        else resolve(buffer.toString('base64'));
      });
    } catch (err) {
      reject(err);
    }
  });
}

// ===================== ACTIVITY LOGGER =====================

export async function logEmployeeActivity(
  ownerId: string,
  employeeId: string,
  action: string,
  module?: string,
  description?: string,
  metadata?: any,
  ipAddress?: string
) {
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
    logger.error('Employee activity log failed', { error: e });
  }
}
