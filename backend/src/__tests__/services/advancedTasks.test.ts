import { mockPrisma } from '../setup';
import {
  listCategories,
  createCategory,
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  reorderTask,
  getKanbanBoard,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  addComment,
  deleteComment,
  startTimer,
  stopTimer,
  addResource,
  deleteResource,
  requestValidation,
  approveValidation,
  getTaskStats,
  listTaskHistory,
} from '../../services/advancedTasks';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBiz = { id: 'biz-1', name: 'TestBiz', modules: ['ADVANCED_TASKS'] };
const mockTask = {
  id: 't1',
  title: 'Test Task',
  status: 'TODO',
  priority: 'MEDIUM',
  businessId: 'biz-1',
  description: null,
  categoryId: null,
  dueDate: null,
  startDate: null,
  estimatedHours: null,
  assigneeId: null,
  assignedTo: null,
  orderId: null,
  bookingId: null,
  deliveryId: null,
  eventId: null,
  rentalId: null,
  partnerId: null,
  clientName: null,
  recurrence: 'NONE',
  recurrenceRule: null,
  requiresValidation: false,
  requiresPhoto: false,
  requiresSignature: false,
  notes: null,
  sortOrder: 0,
  completedAt: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: null,
  assignee: null,
  checklists: [],
  resources: [],
  _count: { comments: 0, timers: 0 },
};

describe('advancedTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
  });

  describe('Categories', () => {
    test('listCategories returns categories', async () => {
      jest.spyOn(mockPrisma.taskCategory, 'findMany').mockResolvedValue([
        {
          id: 'c1',
          name: 'Work',
          color: '#6366f1',
          icon: 'work',
          sortOrder: 0,
          businessId: 'biz-1',
        },
      ]);
      const r = await listCategories('ownerId');
      expect(r).toHaveLength(1);
    });

    test('createCategory creates', async () => {
      jest.spyOn(mockPrisma.taskCategory, 'create').mockResolvedValue({
        id: 'c1',
        name: 'Work',
        color: '#6366f1',
        icon: null,
        sortOrder: 0,
        businessId: 'biz-1',
      });
      const r = await createCategory('ownerId', { name: 'Work' });
      expect(r.name).toBe('Work');
    });
  });

  describe('Tasks', () => {
    test('listTasks returns paginated', async () => {
      jest.spyOn(mockPrisma.planningTask, 'findMany').mockResolvedValue([mockTask]);
      jest.spyOn(mockPrisma.planningTask, 'count').mockResolvedValue(1);
      const r = await listTasks('ownerId', {});
      expect(r.total).toBe(1);
    });

    test('getTask returns or throws', async () => {
      jest.spyOn(mockPrisma.planningTask, 'findFirst').mockResolvedValue(mockTask);
      expect((await getTask('ownerId', 't1')).id).toBe('t1');
    });

    test('getTask throws if not found', async () => {
      jest.spyOn(mockPrisma.planningTask, 'findFirst').mockResolvedValue(null);
      await expect(getTask('ownerId', 'x')).rejects.toThrow('non trouvée');
    });

    test('createTask creates', async () => {
      jest.spyOn(mockPrisma.planningTask, 'create').mockResolvedValue(mockTask);
      jest.spyOn(mockPrisma.planningLog, 'create').mockResolvedValue({} as any);
      const r = await createTask('ownerId', { title: 'Test Task' });
      expect(r.title).toBe('Test Task');
    });

    test('updateTask updates', async () => {
      jest.spyOn(mockPrisma.planningTask, 'findFirst').mockResolvedValue(mockTask);
      jest
        .spyOn(mockPrisma.planningTask, 'update')
        .mockResolvedValue({ ...mockTask, title: 'Updated' });
      jest.spyOn(mockPrisma.planningLog, 'create').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.taskChecklist, 'updateMany').mockResolvedValue({ count: 0 } as any);
      const r = await updateTask('ownerId', 't1', { title: 'Updated' });
      expect(r.title).toBe('Updated');
    });

    test('deleteTask soft-deletes', async () => {
      jest.spyOn(mockPrisma.planningTask, 'update').mockResolvedValue(mockTask);
      jest.spyOn(mockPrisma.planningLog, 'create').mockResolvedValue({} as any);
      await deleteTask('ownerId', 't1');
      expect(mockPrisma.planningTask.update).toHaveBeenCalled();
    });

    test('reorderTask reorders', async () => {
      jest.spyOn(mockPrisma.planningTask, 'update').mockResolvedValue(mockTask);
      await reorderTask('ownerId', 't1', 'IN_PROGRESS', 1);
      expect(mockPrisma.planningTask.update).toHaveBeenCalled();
    });
  });

  describe('Kanban', () => {
    test('getKanbanBoard returns columns', async () => {
      jest.spyOn(mockPrisma.planningTask, 'findMany').mockResolvedValue([mockTask]);
      const r = await getKanbanBoard('ownerId', {});
      expect(r.columns.TODO).toBeDefined();
      expect(r.totalTasks).toBe(1);
    });
  });

  describe('Checklists', () => {
    test('addChecklistItem adds', async () => {
      jest.spyOn(mockPrisma.taskChecklist, 'create').mockResolvedValue({
        id: 'cl1',
        taskId: 't1',
        label: 'Item',
        assignedTo: null,
        sortOrder: 0,
        completedAt: null,
        createdAt: new Date(),
      });
      const r = await addChecklistItem('ownerId', 't1', { label: 'Item' });
      expect(r.label).toBe('Item');
    });

    test('toggleChecklistItem toggles', async () => {
      jest.spyOn(mockPrisma.taskChecklist, 'findFirst').mockResolvedValue({
        id: 'cl1',
        taskId: 't1',
        label: 'Item',
        assignedTo: null,
        sortOrder: 0,
        completedAt: null,
        createdAt: new Date(),
      });
      jest
        .spyOn(mockPrisma.taskChecklist, 'update')
        .mockResolvedValue({ id: 'cl1', completedAt: new Date() } as any);
      const r = await toggleChecklistItem('ownerId', 't1', 'cl1');
      expect(r.completedAt).toBeTruthy();
    });

    test('deleteChecklistItem deletes', async () => {
      jest.spyOn(mockPrisma.taskChecklist, 'delete').mockResolvedValue({} as any);
      await deleteChecklistItem('ownerId', 't1', 'cl1');
      expect(mockPrisma.taskChecklist.delete).toHaveBeenCalled();
    });
  });

  describe('Comments', () => {
    test('addComment adds', async () => {
      jest.spyOn(mockPrisma.taskComment, 'create').mockResolvedValue({
        id: 'cm1',
        content: 'Hello',
        authorId: 'u1',
        taskId: 't1',
        createdAt: new Date(),
        author: { id: 'u1', firstName: 'A', lastName: 'B', avatar: null },
      });
      jest.spyOn(mockPrisma.planningLog, 'create').mockResolvedValue({} as any);
      const r = await addComment('ownerId', 't1', { content: 'Hello' }, 'u1');
      expect(r.content).toBe('Hello');
    });

    test('deleteComment deletes', async () => {
      jest.spyOn(mockPrisma.taskComment, 'delete').mockResolvedValue({} as any);
      await deleteComment('ownerId', 't1', 'cm1');
      expect(mockPrisma.taskComment.delete).toHaveBeenCalled();
    });
  });

  describe('Timers', () => {
    test('startTimer starts', async () => {
      jest.spyOn(mockPrisma.taskTimer, 'updateMany').mockResolvedValue({ count: 0 } as any);
      jest.spyOn(mockPrisma.taskTimer, 'create').mockResolvedValue({
        id: 'tm1',
        taskId: 't1',
        userId: 'u1',
        startedAt: new Date(),
        endedAt: null,
        durationMs: null,
      });
      const r = await startTimer('ownerId', 't1', 'u1');
      expect(r.taskId).toBe('t1');
    });

    test('stopTimer stops', async () => {
      jest.spyOn(mockPrisma.taskTimer, 'findFirst').mockResolvedValue({
        id: 'tm1',
        taskId: 't1',
        userId: 'u1',
        startedAt: new Date(),
        endedAt: null,
        durationMs: null,
      });
      jest
        .spyOn(mockPrisma.taskTimer, 'update')
        .mockResolvedValue({ id: 'tm1', endedAt: new Date(), durationMs: 3600 } as any);
      const r = await stopTimer('ownerId', 't1', 'u1');
      expect(r.durationMs).toBe(3600);
    });
  });

  describe('Resources', () => {
    test('addResource adds', async () => {
      jest.spyOn(mockPrisma.taskResource, 'create').mockResolvedValue({
        id: 'rs1',
        taskId: 't1',
        type: 'document',
        label: 'Doc',
        url: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date(),
      });
      const r = await addResource('ownerId', 't1', { label: 'Doc' });
      expect(r.label).toBe('Doc');
    });

    test('deleteResource deletes', async () => {
      jest.spyOn(mockPrisma.taskResource, 'delete').mockResolvedValue({} as any);
      await deleteResource('ownerId', 't1', 'rs1');
      expect(mockPrisma.taskResource.delete).toHaveBeenCalled();
    });
  });

  describe('Validations', () => {
    test('requestValidation requests', async () => {
      jest.spyOn(mockPrisma.taskValidation, 'create').mockResolvedValue({
        id: 'v1',
        taskId: 't1',
        status: 'PENDING',
        requestedBy: 'u1',
        type: 'manager',
        notes: null,
        reviewedBy: null,
        reviewedAt: null,
        createdAt: new Date(),
      });
      const r = await requestValidation('ownerId', 't1', {});
      expect(r.status).toBe('PENDING');
    });

    test('approveValidation approves', async () => {
      jest.spyOn(mockPrisma.taskValidation, 'findFirst').mockResolvedValue({
        id: 'v1',
        taskId: 't1',
        status: 'PENDING',
        requestedBy: 'u1',
        type: 'manager',
        notes: null,
        reviewedBy: null,
        reviewedAt: null,
        createdAt: new Date(),
      });
      jest
        .spyOn(mockPrisma.taskValidation, 'update')
        .mockResolvedValue({ id: 'v1', status: 'APPROVED' } as any);
      const r = await approveValidation('ownerId', 't1', 'v1', { approved: true });
      expect(r.status).toBe('APPROVED');
    });
  });

  describe('Stats & History', () => {
    test('getTaskStats returns stats', async () => {
      jest.spyOn(mockPrisma.planningTask, 'count').mockResolvedValue(10);
      jest.spyOn(mockPrisma.taskChecklist, 'count').mockResolvedValue(5);
      jest
        .spyOn(mockPrisma.taskTimer, 'aggregate')
        .mockResolvedValue({ _sum: { durationMs: 36000 } } as any);
      const r = await getTaskStats('ownerId');
      expect(r.totalTasks).toBe(10);
    });

    test('listTaskHistory returns history', async () => {
      jest.spyOn(mockPrisma.planningLog, 'findMany').mockResolvedValue([
        {
          id: 'h1',
          action: 'TASK_CREATED',
          entityType: 'ADVANCED_TASK',
          entityId: 't1',
          description: 'Created',
          businessId: 'biz-1',
          createdAt: new Date(),
        },
      ]);
      const r = await listTaskHistory('ownerId', 't1');
      expect(r).toHaveLength(1);
    });
  });

  describe('Error cases', () => {
    test('getTask throws when business not found', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
      await expect(getTask('ownerId', 't1')).rejects.toThrow('Business not found');
    });

    test('updateTask throws when task not found', async () => {
      jest.spyOn(mockPrisma.planningTask, 'findFirst').mockResolvedValue(null);
      await expect(updateTask('ownerId', 'x', { title: 'New' })).rejects.toThrow('non trouvée');
    });

    test('stopTimer throws when no active timer', async () => {
      jest.spyOn(mockPrisma.taskTimer, 'findFirst').mockResolvedValue(null);
      await expect(stopTimer('ownerId', 't1', 'u1')).rejects.toThrow('Aucun timer actif');
    });

    test('approveValidation throws when already processed', async () => {
      jest
        .spyOn(mockPrisma.taskValidation, 'findFirst')
        .mockResolvedValue({ id: 'v1', status: 'APPROVED' } as any);
      await expect(approveValidation('ownerId', 't1', 'v1', { approved: true })).rejects.toThrow(
        'Déjà traitée'
      );
    });
  });
});
