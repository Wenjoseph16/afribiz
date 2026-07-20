import { getBusinessByOwner } from '../lib/businessAccess';
import { AppError } from '../middlewares/errorHandler';
import { prisma } from '../lib/db';

export async function listLeaves(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const where: any = { businessId: business.id };
  const { employeeId, status, type, page = '1', limit = '20' } = filters;
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;
  if (type) where.type = type;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 20);
  const skip = (pageNum - 1) * limitNum;
  const [items, total] = await Promise.all([
    prisma.leave.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, position: true } },
      },
    }),
    prisma.leave.count({ where }),
  ]);
  return { items, total, page: pageNum, limit: limitNum };
}

export async function getLeave(ownerId: string, leaveId: string) {
  const business = await getBusinessByOwner(ownerId);
  const leave = await prisma.leave.findFirst({
    where: { id: leaveId, businessId: business.id },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true } },
    },
  });
  if (!leave) throw new AppError('Congé introuvable', 404);
  return leave;
}

export async function createLeave(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, businessId: business.id },
  });
  if (!employee) throw new AppError('Employé introuvable', 404);
  return prisma.leave.create({
    data: {
      businessId: business.id,
      employeeId: data.employeeId,
      type: data.type || 'VACATION',
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason,
      status: data.status || 'PENDING',
      approvedById: data.approvedById,
      approvedAt: data.status === 'APPROVED' ? new Date() : undefined,
      notes: data.notes,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true } },
    },
  });
}

export async function updateLeaveStatus(
  ownerId: string,
  leaveId: string,
  data: { status: string; notes?: string }
) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.leave.findFirst({
    where: { id: leaveId, businessId: business.id },
  });
  if (!existing) throw new AppError('Congé introuvable', 404);
  const updateData: any = { status: data.status };
  if (data.status === 'APPROVED') updateData.approvedAt = new Date();
  if (data.notes !== undefined) updateData.notes = data.notes;
  return prisma.leave.update({
    where: { id: leaveId },
    data: updateData,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true } },
    },
  });
}

export async function deleteLeave(ownerId: string, leaveId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.leave.findFirst({
    where: { id: leaveId, businessId: business.id },
  });
  if (!existing) throw new AppError('Congé introuvable', 404);
  await prisma.leave.delete({ where: { id: leaveId } });
  return { message: 'Congé supprimé' };
}

export async function getLeaveStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const [total, pending, approved, rejected] = await Promise.all([
    prisma.leave.count({ where: { businessId: business.id } }),
    prisma.leave.count({ where: { businessId: business.id, status: 'PENDING' as const } }),
    prisma.leave.count({ where: { businessId: business.id, status: 'APPROVED' as const } }),
    prisma.leave.count({ where: { businessId: business.id, status: 'REJECTED' as const } }),
  ]);
  return { total, pending, approved, rejected };
}

// ===================== PAYROLL =====================

export async function listPayrolls(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const where: any = { businessId: business.id };
  const { employeeId, status, page = '1', limit = '20' } = filters;
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 20);
  const skip = (pageNum - 1) * limitNum;
  const [items, total] = await Promise.all([
    prisma.payroll.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, position: true } },
      },
    }),
    prisma.payroll.count({ where }),
  ]);
  return { items, total, page: pageNum, limit: limitNum };
}

export async function getPayroll(ownerId: string, payrollId: string) {
  const business = await getBusinessByOwner(ownerId);
  const payroll = await prisma.payroll.findFirst({
    where: { id: payrollId, businessId: business.id },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          salary: true,
          salaryCurrency: true,
        },
      },
    },
  });
  if (!payroll) throw new AppError('Fiche de paie introuvable', 404);
  return payroll;
}

export async function createPayroll(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, businessId: business.id },
  });
  if (!employee) throw new AppError('Employé introuvable', 404);

  const baseSalary = data.baseSalary ?? employee.salary ?? 0;
  const bonuses = data.bonuses ?? 0;
  const deductions = data.deductions ?? 0;
  const overtime = data.overtime ?? 0;
  const netAmount = Number(baseSalary) + Number(bonuses) + Number(overtime) - Number(deductions);

  return prisma.payroll.create({
    data: {
      businessId: business.id,
      employeeId: data.employeeId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      baseSalary,
      bonuses,
      deductions,
      overtime,
      netAmount,
      currency: data.currency || 'FCFA',
      status: (data.status || 'DRAFT') as 'DRAFT' | 'PAID' | 'CANCELLED',
      notes: data.notes,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true } },
    },
  });
}

export async function updatePayrollStatus(
  ownerId: string,
  payrollId: string,
  data: { status: string; notes?: string }
) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.payroll.findFirst({
    where: { id: payrollId, businessId: business.id },
  });
  if (!existing) throw new AppError('Fiche de paie introuvable', 404);
  const updateData: any = { status: data.status };
  if (data.status === 'PAID') updateData.paidAt = new Date();
  if (data.notes !== undefined) updateData.notes = data.notes;
  return prisma.payroll.update({
    where: { id: payrollId },
    data: updateData,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true } },
    },
  });
}

export async function deletePayroll(ownerId: string, payrollId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.payroll.findFirst({
    where: { id: payrollId, businessId: business.id },
  });
  if (!existing) throw new AppError('Fiche de paie introuvable', 404);
  await prisma.payroll.delete({ where: { id: payrollId } });
  return { message: 'Fiche de paie supprimée' };
}

export async function getPayrollStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const [total, draft, paid] = await Promise.all([
    prisma.payroll.count({ where: { businessId: business.id } }),
    prisma.payroll.count({ where: { businessId: business.id, status: 'DRAFT' as const } }),
    prisma.payroll.count({ where: { businessId: business.id, status: 'PAID' as const } }),
  ]);
  return { total, draft, paid };
}
