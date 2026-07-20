import { mockPrisma } from '../setup';
import * as empLeaves from '../../services/employeeLeaves';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

const mockBusiness = { id: 'biz-1', name: 'Biz', latitude: null, longitude: null };
const mockEmployee = {
  id: 'emp-1',
  firstName: 'John',
  lastName: 'Doe',
  position: 'Dev',
  salary: 500,
  salaryCurrency: 'FCFA',
  businessId: 'biz-1',
};
const mockLeave = {
  id: 'lv-1',
  businessId: 'biz-1',
  employeeId: 'emp-1',
  type: 'VACATION',
  status: 'PENDING',
  startDate: new Date(),
  endDate: new Date(),
  reason: 'Vacation',
  employee: { id: 'emp-1', firstName: 'John', lastName: 'Doe', position: 'Dev' },
};
const mockPayroll = {
  id: 'pr-1',
  businessId: 'biz-1',
  employeeId: 'emp-1',
  baseSalary: 500,
  bonuses: 0,
  deductions: 0,
  overtime: 0,
  netAmount: 500,
  status: 'DRAFT',
  periodStart: new Date(),
  periodEnd: new Date(),
  currency: 'FCFA',
  employee: { id: 'emp-1', firstName: 'John', lastName: 'Doe', position: 'Dev' },
};

describe('employeeLeaves', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listLeaves', () => {
    test('returns paginated leaves', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.leave.findMany as jest.Mock).mockResolvedValue([mockLeave]);
      (mockPrisma.leave.count as jest.Mock).mockResolvedValue(1);
      const r = await empLeaves.listLeaves('u1', {});
      expect(r.items).toHaveLength(1);
      expect(r.total).toBe(1);
    });

    test('filters by employeeId', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.leave.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.leave.count as jest.Mock).mockResolvedValue(0);
      const r = await empLeaves.listLeaves('u1', { employeeId: 'emp-1' });
      expect(r.total).toBe(0);
    });

    test('throws if business not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(empLeaves.listLeaves('u-x', {})).rejects.toThrow(
        'Business non trouvé ou inactif'
      );
    });
  });

  describe('getLeave', () => {
    test('returns leave by id', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.leave.findFirst as jest.Mock).mockResolvedValue(mockLeave);
      const r = await empLeaves.getLeave('u1', 'lv-1');
      expect(r.id).toBe('lv-1');
    });

    test('throws if not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.leave.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(empLeaves.getLeave('u1', 'bad-id')).rejects.toThrow('Congé introuvable');
    });
  });

  describe('createLeave', () => {
    test('creates leave', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
      (mockPrisma.leave.create as jest.Mock).mockResolvedValue(mockLeave);
      const r = await empLeaves.createLeave('u1', {
        employeeId: 'emp-1',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
      });
      expect(r.id).toBe('lv-1');
    });

    test('throws if employee not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.employee.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        empLeaves.createLeave('u1', {
          employeeId: 'bad-id',
          startDate: '2025-01-01',
          endDate: '2025-01-10',
        })
      ).rejects.toThrow('Employé introuvable');
    });
  });

  describe('updateLeaveStatus', () => {
    test('updates leave status to APPROVED', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.leave.findFirst as jest.Mock).mockResolvedValue(mockLeave);
      (mockPrisma.leave.update as jest.Mock).mockResolvedValue({
        ...mockLeave,
        status: 'APPROVED',
        approvedAt: new Date(),
      });
      const r = await empLeaves.updateLeaveStatus('u1', 'lv-1', { status: 'APPROVED' });
      expect(mockPrisma.leave.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'APPROVED' }) })
      );
    });

    test('throws if leave not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.leave.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        empLeaves.updateLeaveStatus('u1', 'bad-id', { status: 'APPROVED' })
      ).rejects.toThrow('Congé introuvable');
    });
  });

  describe('deleteLeave', () => {
    test('deletes leave', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.leave.findFirst as jest.Mock).mockResolvedValue(mockLeave);
      (mockPrisma.leave.delete as jest.Mock).mockResolvedValue(mockLeave);
      const r = await empLeaves.deleteLeave('u1', 'lv-1');
      expect(r.message).toBe('Congé supprimé');
    });
  });

  describe('getLeaveStats', () => {
    test('returns leave counts by status', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.leave.count as jest.Mock).mockResolvedValue(1);
      const r = await empLeaves.getLeaveStats('u1');
      expect(r.total).toBe(1);
    });
  });

  describe('listPayrolls', () => {
    test('returns paginated payrolls', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.payroll.findMany as jest.Mock).mockResolvedValue([mockPayroll]);
      (mockPrisma.payroll.count as jest.Mock).mockResolvedValue(1);
      const r = await empLeaves.listPayrolls('u1', {});
      expect(r.items).toHaveLength(1);
    });
  });

  describe('getPayroll', () => {
    test('returns payroll by id', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.payroll.findFirst as jest.Mock).mockResolvedValue(mockPayroll);
      const r = await empLeaves.getPayroll('u1', 'pr-1');
      expect(r.id).toBe('pr-1');
    });

    test('throws if not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.payroll.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(empLeaves.getPayroll('u1', 'bad-id')).rejects.toThrow(
        'Fiche de paie introuvable'
      );
    });
  });

  describe('createPayroll', () => {
    test('creates payroll with computed net amount', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
      (mockPrisma.payroll.create as jest.Mock).mockResolvedValue(mockPayroll);
      const r = await empLeaves.createPayroll('u1', {
        employeeId: 'emp-1',
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
      });
      expect(r.id).toBe('pr-1');
    });
  });

  describe('updatePayrollStatus', () => {
    test('updates payroll status', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.payroll.findFirst as jest.Mock).mockResolvedValue(mockPayroll);
      (mockPrisma.payroll.update as jest.Mock).mockResolvedValue({
        ...mockPayroll,
        status: 'PAID',
      });
      const r = await empLeaves.updatePayrollStatus('u1', 'pr-1', { status: 'PAID' });
      expect(mockPrisma.payroll.update).toHaveBeenCalled();
    });
  });

  describe('deletePayroll', () => {
    test('deletes payroll', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.payroll.findFirst as jest.Mock).mockResolvedValue(mockPayroll);
      (mockPrisma.payroll.delete as jest.Mock).mockResolvedValue(mockPayroll);
      const r = await empLeaves.deletePayroll('u1', 'pr-1');
      expect(r.message).toBe('Fiche de paie supprimée');
    });
  });

  describe('getPayrollStats', () => {
    test('returns payroll counts', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.payroll.count as jest.Mock).mockResolvedValue(1);
      const r = await empLeaves.getPayrollStats('u1');
      expect(r.total).toBe(1);
    });
  });
});
