import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { getBusinessByOwner } from '../lib/businessAccess';
import * as employeeService from '../services/employees';

// ===================== EMPLOYEES =====================

export const listEmployees = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await employeeService.listEmployees(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getEmployee = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const employee = await employeeService.getEmployee(req.user.id, req.params.id);
  res.json({ success: true, data: employee });
});

export const createEmployee = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const employee = await employeeService.createEmployee(req.user.id, req.body);
  res.status(201).json({ success: true, data: employee, message: 'Employé créé' });
});

export const updateEmployee = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const employee = await employeeService.updateEmployee(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: employee, message: 'Employé mis à jour' });
});

export const deleteEmployee = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await employeeService.deleteEmployee(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

// ===================== ROLES =====================

export const listEmployeeRoles = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const roles = await employeeService.listEmployeeRoles(req.user.id);
    res.json({ success: true, data: roles });
  }
);

export const createEmployeeRole = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const role = await employeeService.createEmployeeRole(req.user.id, req.body);
    res.status(201).json({ success: true, data: role, message: 'Rôle créé' });
  }
);

export const updateEmployeeRole = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const role = await employeeService.updateEmployeeRole(req.user.id, req.params.id, req.body);
    res.json({ success: true, data: role, message: 'Rôle mis à jour' });
  }
);

export const deleteEmployeeRole = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await employeeService.deleteEmployeeRole(req.user.id, req.params.id);
    res.json({ success: true, data: result });
  }
);

// ===================== ATTENDANCE =====================

export const listAttendances = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await employeeService.listAttendances(req.user.id, req.query);
    res.json({ success: true, data: result });
  }
);

export const clockIn = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const attendance = await employeeService.clockIn(req.user.id, req.body);
  res.status(201).json({ success: true, data: attendance, message: 'Pointage enregistré' });
});

export const clockOut = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const attendance = await employeeService.clockOut(req.user.id, req.params.id);
  res.json({ success: true, data: attendance, message: 'Départ enregistré' });
});

export const markAbsent = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const attendance = await employeeService.markAbsent(req.user.id, req.body);
  res.status(201).json({ success: true, data: attendance, message: 'Absence enregistrée' });
});

// ===================== DOCUMENTS =====================

export const listEmployeeDocuments = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const documents = await employeeService.listEmployeeDocuments(
      req.user.id,
      req.params.employeeId
    );
    res.json({ success: true, data: documents });
  }
);

export const createEmployeeDocument = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const document = await employeeService.createEmployeeDocument(req.user.id, req.body);
    res.status(201).json({ success: true, data: document, message: 'Document ajouté' });
  }
);

export const deleteEmployeeDocument = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await employeeService.deleteEmployeeDocument(req.user.id, req.params.id);
    res.json({ success: true, data: result });
  }
);

// ===================== PERFORMANCE =====================

export const listEmployeePerformances = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const performances = await employeeService.listEmployeePerformances(
      req.user.id,
      req.params.employeeId,
      req.query
    );
    res.json({ success: true, data: performances });
  }
);

export const createEmployeePerformance = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const performance = await employeeService.createEmployeePerformance(req.user.id, req.body);
    res.status(201).json({ success: true, data: performance, message: 'Performance créée' });
  }
);

// ===================== ACTIVITIES =====================

export const listEmployeeActivities = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await employeeService.listEmployeeActivities(req.user.id, req.query);
    res.json({ success: true, data: result });
  }
);

// ===================== STATS =====================

export const getEmployeeStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const stats = await employeeService.getEmployeeStats(req.user.id);
    res.json({ success: true, data: stats });
  }
);

export const getEmployeeEnrichedStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const business = await getBusinessByOwner(req.user.id);
    const stats = await employeeService.getEmployeeEnrichedStats(business.id);
    res.json({ success: true, data: stats });
  }
);

export const generatePayslipPDF = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { employeeId, period } = req.params;
    const pdfBase64 = await employeeService.generatePayslipPDF(employeeId, period);
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="paie-${employeeId}-${period}.pdf"`);
    res.send(pdfBuffer);
  }
);
