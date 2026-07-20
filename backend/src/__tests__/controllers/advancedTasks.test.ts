import { mockPrisma } from '../setup';
import * as tasksCtrl from '../../controllers/advancedTasks';
import * as s from '../../services/advancedTasks';

jest.mock('../../services/advancedTasks', () => ({
  listTasks: jest.fn(),
  getTask: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  reorderTask: jest.fn(),
  getKanbanBoard: jest.fn(),
  listCategories: jest.fn(),
  createCategory: jest.fn(),
  addChecklistItem: jest.fn(),
  toggleChecklistItem: jest.fn(),
  deleteChecklistItem: jest.fn(),
  addComment: jest.fn(),
  deleteComment: jest.fn(),
  startTimer: jest.fn(),
  stopTimer: jest.fn(),
  addResource: jest.fn(),
  deleteResource: jest.fn(),
  requestValidation: jest.fn(),
  approveValidation: jest.fn(),
  getTaskStats: jest.fn(),
  listTaskHistory: jest.fn(),
}));

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn().mockReturnValue(r);
  r.send = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('advancedTasks controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listTasks', () => {
    it('success', async () => {
      (s.listTasks as jest.Mock).mockResolvedValue([{ id: 't1' }]);
      const res = mockRes();
      const next = jest.fn();
      tasksCtrl.listTasks(req(), res, next);
      await flush();
      expect(s.listTasks).toHaveBeenCalledWith('u1', {});
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 't1' }] });
    });

    it('401', async () => {
      const res = mockRes();
      const next = jest.fn();
      tasksCtrl.listTasks({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('createTask', () => {
    it('success 201', async () => {
      (s.createTask as jest.Mock).mockResolvedValue({ id: 't1', title: 'Test' });
      const res = mockRes();
      const next = jest.fn();
      tasksCtrl.createTask(req({ body: { title: 'Test' } }), res, next);
      await flush();
      expect(s.createTask).toHaveBeenCalledWith('u1', { title: 'Test' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 't1', title: 'Test' },
        message: 'Tâche créée',
      });
    });

    it('401', async () => {
      const res = mockRes();
      const next = jest.fn();
      tasksCtrl.createTask({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('deleteTask', () => {
    it('success message', async () => {
      (s.deleteTask as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      const next = jest.fn();
      tasksCtrl.deleteTask(req({ params: { id: 't1' } }), res, next);
      await flush();
      expect(s.deleteTask).toHaveBeenCalledWith('u1', 't1');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Tâche supprimée' });
    });
  });

  describe('getKanbanBoard', () => {
    it('success', async () => {
      (s.getKanbanBoard as jest.Mock).mockResolvedValue({ columns: [] });
      const res = mockRes();
      const next = jest.fn();
      tasksCtrl.getKanbanBoard(req(), res, next);
      await flush();
      expect(s.getKanbanBoard).toHaveBeenCalledWith('u1', {});
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { columns: [] } });
    });
  });

  describe('getTaskStats', () => {
    it('success', async () => {
      (s.getTaskStats as jest.Mock).mockResolvedValue({ total: 10, done: 5 });
      const res = mockRes();
      const next = jest.fn();
      tasksCtrl.getTaskStats(req(), res, next);
      await flush();
      expect(s.getTaskStats).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { total: 10, done: 5 } });
    });
  });
});
