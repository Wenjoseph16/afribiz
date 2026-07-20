import { mockPrisma } from '../setup';
import {
  listEmployees,
  createEmployee,
  getEmployee,
  deleteEmployee,
  getEmployeeStats,
} from '../../services/employees';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({ publishNewMessage: jest.fn() }));

const mockBiz = { id: 'biz-1', name: 'TestBiz', modules: [], settings: {} };
const mockEmp = {
  id: 'emp-1',
  businessId: 'biz-1',
  firstName: 'Jean',
  lastName: 'Kone',
  email: 'j@t.com',
  phone: '+22501',
  role: 'SERVER',
  isActive: true,
  createdAt: new Date(),
};

describe('Employees Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.business.findUnique.mockResolvedValue(mockBiz as any);
  });

  test('listEmployees returns paginated', async () => {
    jest.spyOn(mockPrisma.employee, 'findMany').mockResolvedValue([mockEmp as any]);
    jest.spyOn(mockPrisma.employee, 'count').mockResolvedValue(1);
    const r = await listEmployees('u1', {});
    expect(r.total).toBe(1);
  });

  test('createEmployee creates', async () => {
    jest.spyOn(mockPrisma.employee, 'create').mockResolvedValue(mockEmp as any);
    const r = await createEmployee('u1', {
      firstName: 'Jean',
      lastName: 'Kone',
      email: 'j@t.com',
      role: 'SERVER',
    });
    expect(r.id).toBe('emp-1');
  });

  test('getEmployee returns employee', async () => {
    jest.spyOn(mockPrisma.employee, 'findFirst').mockResolvedValue(mockEmp as any);
    const r = await getEmployee('u1', 'emp-1');
    expect(r.id).toBe('emp-1');
  });

  test('deleteEmployee soft-deletes', async () => {
    jest.spyOn(mockPrisma.employee, 'findFirst').mockResolvedValue(mockEmp as any);
    jest.spyOn(mockPrisma.employee, 'update').mockResolvedValue(mockEmp as any);
    await deleteEmployee('u1', 'emp-1');
    expect(mockPrisma.employee.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isActive: false }) })
    );
  });

  test('getEmployeeStats aggregates', async () => {
    jest.spyOn(mockPrisma.employee, 'count').mockResolvedValue(5);
    jest
      .spyOn(mockPrisma.employee, 'groupBy')
      .mockResolvedValue([{ role: 'SERVER', _count: 3 }] as any);
    const r = await getEmployeeStats('u1');
    expect(r.totalEmployees).toBe(5);
  });
});
