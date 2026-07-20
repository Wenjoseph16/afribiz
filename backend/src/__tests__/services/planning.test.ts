import { mockPrisma } from '../setup';
import * as planning from '../../services/planning';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

const mockBusiness = { id: 'biz-1', name: 'Biz', modules: ['PLANNING'], settings: null };

describe('planning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
  });

  describe('getCalendarFeed', () => {
    it('should return calendar feed with all types', async () => {
      (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.planningTask.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.employeeSchedule.findMany as jest.Mock).mockResolvedValue([]);
      const result = await planning.getCalendarFeed('owner-1', '2024-01-01', '2024-01-31');
      expect(result.feed).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should throw if business not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(planning.getCalendarFeed('owner-1', '2024-01-01', '2024-01-31')).rejects.toThrow(
        'Business not found'
      );
    });

    it('should throw if PLANNING module not activated', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
        ...mockBusiness,
        modules: [],
      });
      await expect(planning.getCalendarFeed('owner-1', '2024-01-01', '2024-01-31')).rejects.toThrow(
        'Module Planning non activé'
      );
    });
  });

  describe('listTasks', () => {
    it('should return paginated tasks', async () => {
      (mockPrisma.planningTask.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.planningTask.count as jest.Mock).mockResolvedValue(0);
      const result = await planning.listTasks('owner-1', {});
      expect(result.tasks).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getTask', () => {
    it('should return a task by id', async () => {
      const mockTask = { id: 'task-1', businessId: 'biz-1', title: 'Test' };
      (mockPrisma.planningTask.findFirst as jest.Mock).mockResolvedValue(mockTask);
      const result = await planning.getTask('owner-1', 'task-1');
      expect(result.id).toBe('task-1');
    });

    it('should throw if task not found', async () => {
      (mockPrisma.planningTask.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(planning.getTask('owner-1', 'invalid')).rejects.toThrow('Tâche non trouvée');
    });
  });

  describe('createTask', () => {
    it('should create a task and log it', async () => {
      (mockPrisma.planningTask.create as jest.Mock).mockResolvedValue({
        id: 'task-1',
        title: 'New Task',
      });
      (mockPrisma.planningLog.create as jest.Mock).mockResolvedValue({});
      const result = await planning.createTask('owner-1', { title: 'New Task', priority: 'HIGH' });
      expect(result.id).toBe('task-1');
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      (mockPrisma.planningTask.findFirst as jest.Mock).mockResolvedValue({
        id: 'task-1',
        businessId: 'biz-1',
        title: 'Old',
        status: 'TODO',
      });
      (mockPrisma.planningTask.update as jest.Mock).mockResolvedValue({
        id: 'task-1',
        title: 'Updated',
        status: 'DONE',
      });
      (mockPrisma.planningLog.create as jest.Mock).mockResolvedValue({});
      const result = await planning.updateTask('owner-1', 'task-1', {
        title: 'Updated',
        status: 'DONE',
      });
      expect(result.title).toBe('Updated');
    });

    it('should throw if task not found', async () => {
      (mockPrisma.planningTask.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(planning.updateTask('owner-1', 'invalid', {})).rejects.toThrow(
        'Tâche non trouvée'
      );
    });
  });

  describe('deleteTask', () => {
    it('should soft-delete a task', async () => {
      (mockPrisma.planningTask.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.planningLog.create as jest.Mock).mockResolvedValue({});
      await planning.deleteTask('owner-1', 'task-1');
      expect(mockPrisma.planningTask.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { deletedAt: expect.any(Date) } })
      );
    });
  });

  describe('listSchedules', () => {
    it('should return paginated schedules', async () => {
      (mockPrisma.employeeSchedule.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.employeeSchedule.count as jest.Mock).mockResolvedValue(0);
      const result = await planning.listSchedules('owner-1', {});
      expect(result.schedules).toEqual([]);
    });
  });

  describe('upsertSchedule', () => {
    it('should create a new schedule', async () => {
      (mockPrisma.employeeSchedule.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.employeeSchedule.create as jest.Mock).mockResolvedValue({
        id: 'sched-1',
        employee: { id: 'emp-1', firstName: 'John', lastName: 'Doe' },
      });
      (mockPrisma.planningLog.create as jest.Mock).mockResolvedValue({});
      const result = await planning.upsertSchedule('owner-1', {
        employeeId: 'emp-1',
        dayOfWeek: 1,
      });
      expect(result.id).toBe('sched-1');
    });

    it('should update existing schedule', async () => {
      (mockPrisma.employeeSchedule.findFirst as jest.Mock).mockResolvedValue({
        id: 'sched-1',
        employeeId: 'emp-1',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '17:00',
      });
      (mockPrisma.employeeSchedule.update as jest.Mock).mockResolvedValue({
        id: 'sched-1',
        employee: { id: 'emp-1', firstName: 'John', lastName: 'Doe' },
      });
      (mockPrisma.planningLog.create as jest.Mock).mockResolvedValue({});
      const result = await planning.upsertSchedule('owner-1', {
        employeeId: 'emp-1',
        dayOfWeek: 1,
        startTime: '09:00',
      });
      expect(result.id).toBe('sched-1');
    });

    it('should throw if employeeId is missing', async () => {
      await expect(planning.upsertSchedule('owner-1', { dayOfWeek: 1 })).rejects.toThrow(
        'employeeId est requis'
      );
    });
  });

  describe('deleteSchedule', () => {
    it('should delete a schedule', async () => {
      (mockPrisma.employeeSchedule.delete as jest.Mock).mockResolvedValue({});
      await planning.deleteSchedule('owner-1', 'sched-1');
      expect(mockPrisma.employeeSchedule.delete).toHaveBeenCalledWith({
        where: { id: 'sched-1', businessId: 'biz-1' },
      });
    });
  });

  describe('listPlanningLogs', () => {
    it('should return paginated logs', async () => {
      (mockPrisma.planningLog.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.planningLog.count as jest.Mock).mockResolvedValue(0);
      const result = await planning.listPlanningLogs('owner-1', {});
      expect(result.logs).toEqual([]);
    });
  });

  describe('getPlanningStats', () => {
    it('should return planning stats', async () => {
      (mockPrisma.planningTask.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.employeeSchedule.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.booking.count as jest.Mock).mockResolvedValue(3);
      const result = await planning.getPlanningStats('owner-1');
      expect(result.totalTasks).toBe(10);
      expect(result.upcomingBookings).toBe(3);
    });
  });
});
