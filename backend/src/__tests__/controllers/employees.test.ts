import * as employeeCtrl from '../../controllers/employees';

jest.mock('../../services/employees', () => ({
  listEmployees: jest.fn(),
  getEmployee: jest.fn(),
  createEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  deleteEmployee: jest.fn(),
  listEmployeeRoles: jest.fn(),
  createEmployeeRole: jest.fn(),
  updateEmployeeRole: jest.fn(),
  deleteEmployeeRole: jest.fn(),
  leaveRequests: jest.fn(),
  approveLeave: jest.fn(),
  rejectLeave: jest.fn(),
  getLeaveBalance: jest.fn(),
  getAttendance: jest.fn(),
  recordAttendance: jest.fn(),
  getPayroll: jest.fn(),
  processPayroll: jest.fn(),
}));

import * as employeeService from '../../services/employees';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('employees controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listEmployees', async () => {
    (employeeService.listEmployees as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    employeeCtrl.listEmployees(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getEmployee', async () => {
    (employeeService.getEmployee as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    employeeCtrl.getEmployee(req({ params: { id: 'e1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createEmployee returns 201', async () => {
    (employeeService.createEmployee as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    employeeCtrl.createEmployee(req({ body: { firstName: 'John', role: 'EMPLOYEE' } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateEmployee', async () => {
    (employeeService.updateEmployee as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    employeeCtrl.updateEmployee(
      req({ params: { id: 'e1' }, body: { position: 'Manager' } }),
      res,
      next
    );
    await flush();
    expect(employeeService.updateEmployee).toHaveBeenCalledWith('u1', 'e1', {
      position: 'Manager',
    });
  });

  it('deleteEmployee', async () => {
    (employeeService.deleteEmployee as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    employeeCtrl.deleteEmployee(req({ params: { id: 'e1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('listEmployeeRoles', async () => {
    (employeeService.listEmployeeRoles as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    employeeCtrl.listEmployeeRoles(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createEmployeeRole returns 201', async () => {
    (employeeService.createEmployeeRole as jest.Mock).mockResolvedValue({ id: 'r1' });
    const res = mockRes();
    const next = jest.fn();
    employeeCtrl.createEmployeeRole(req({ body: { name: 'Supervisor' } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateEmployeeRole', async () => {
    (employeeService.updateEmployeeRole as jest.Mock).mockResolvedValue({ id: 'r1' });
    const res = mockRes();
    const next = jest.fn();
    employeeCtrl.updateEmployeeRole(
      req({ params: { id: 'r1' }, body: { name: 'Senior' } }),
      res,
      next
    );
    await flush();
    expect(employeeService.updateEmployeeRole).toHaveBeenCalledWith('u1', 'r1', { name: 'Senior' });
  });

  it('deleteEmployeeRole', async () => {
    (employeeService.deleteEmployeeRole as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    employeeCtrl.deleteEmployeeRole(req({ params: { id: 'r1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    employeeCtrl.listEmployees({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
