import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee,
  listEmployeeRoles, createEmployeeRole, updateEmployeeRole, deleteEmployeeRole,
  listAttendances, clockIn, clockOut, markAbsent,
  listEmployeeDocuments, createEmployeeDocument, deleteEmployeeDocument,
  listEmployeePerformances, createEmployeePerformance,
  listEmployeeActivities, getEmployeeStats,
} from '../controllers/employees';
import {
  createEmployeeSchema, updateEmployeeSchema,
  createEmployeeRoleSchema, updateEmployeeRoleSchema,
  clockInSchema, markAbsentSchema,
  createEmployeeDocumentSchema, createEmployeePerformanceSchema,
} from '../validators/employees';

const router = Router();
router.use(authMiddleware);

// ===== Static routes MUST come before /:id =====

// Stats
router.get('/stats', getEmployeeStats);

// Roles (static paths before /:id)
router.get('/roles/list', listEmployeeRoles);
router.post('/roles', validateBody(createEmployeeRoleSchema), createEmployeeRole);
router.patch('/roles/:id', validateBody(updateEmployeeRoleSchema), updateEmployeeRole);
router.delete('/roles/:id', deleteEmployeeRole);

// Attendance
router.get('/attendances', listAttendances);
router.post('/attendance/clock-in', validateBody(clockInSchema), clockIn);
router.patch('/attendance/clock-out/:id', clockOut);
router.post('/attendance/absent', validateBody(markAbsentSchema), markAbsent);

// Documents (no /:employeeId conflict)
router.post('/documents', validateBody(createEmployeeDocumentSchema), createEmployeeDocument);
router.delete('/documents/:id', deleteEmployeeDocument);

// Performances
router.post('/performances', validateBody(createEmployeePerformanceSchema), createEmployeePerformance);

// Activities
router.get('/activities/logs', listEmployeeActivities);

// ===== Employee CRUD with :id param (must be last) =====
router.get('/', listEmployees);
router.get('/:id', getEmployee);
router.post('/', validateBody(createEmployeeSchema), createEmployee);
router.patch('/:id', validateBody(updateEmployeeSchema), updateEmployee);
router.delete('/:id', deleteEmployee);

// ===== Nested routes under employee :id =====
router.get('/:employeeId/documents', listEmployeeDocuments);
router.get('/:employeeId/performances', listEmployeePerformances);

export default router;
