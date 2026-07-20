import { mockPrisma } from '../setup';

jest.mock('../../services/planning', () => ({
  getCalendarFeed: jest.fn(),
  listTasks: jest.fn(),
  getTask: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  listSchedules: jest.fn(),
  upsertSchedule: jest.fn(),
  deleteSchedule: jest.fn(),
  listPlanningLogs: jest.fn(),
  getPlanningStats: jest.fn(),
}));

import * as planningCtrl from '../../controllers/planning';

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

const planningService = jest.requireMock('../../services/planning');

describe('planning controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getCalendarFeed — success', async () => {
    planningService.getCalendarFeed.mockResolvedValue({ feed: [], total: 0 });
    const r = mockRes();
    const n = jest.fn();
    planningCtrl.getCalendarFeed(
      req({ query: { dateFrom: '2025-01-01', dateTo: '2025-01-31' } }),
      r,
      n
    );
    await flush();
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getCalendarFeed — 401 if no user', async () => {
    const r = mockRes();
    const n = jest.fn();
    planningCtrl.getCalendarFeed({ query: {} } as any, r, n);
    await flush();
    expect(n).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('getCalendarFeed — 400 if missing date params', async () => {
    const r = mockRes();
    const n = jest.fn();
    planningCtrl.getCalendarFeed(req({ query: {} }), r, n);
    await flush();
    expect(n).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('createTask returns 201', async () => {
    planningService.createTask.mockResolvedValue({ id: 't1' });
    const r = mockRes();
    const n = jest.fn();
    planningCtrl.createTask(req({ body: { title: 'Nouvelle tâche' } }), r, n);
    await flush();
    expect(r.status).toHaveBeenCalledWith(201);
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Tâche créée' }));
  });

  it('deleteTask returns success message', async () => {
    planningService.deleteTask.mockResolvedValue(undefined);
    const r = mockRes();
    const n = jest.fn();
    planningCtrl.deleteTask(req({ params: { id: 't1' } }), r, n);
    await flush();
    expect(r.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Tâche supprimée' })
    );
  });

  it('listSchedules', async () => {
    planningService.listSchedules.mockResolvedValue({ schedules: [], total: 0 });
    const r = mockRes();
    const n = jest.fn();
    planningCtrl.listSchedules(req({ query: { page: '1' } }), r, n);
    await flush();
    expect(planningService.listSchedules).toHaveBeenCalledWith('u1', { page: '1' });
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getPlanningStats', async () => {
    planningService.getPlanningStats.mockResolvedValue({ totalTasks: 5, todoTasks: 2 });
    const r = mockRes();
    const n = jest.fn();
    planningCtrl.getPlanningStats(req(), r, n);
    await flush();
    expect(r.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { totalTasks: 5, todoTasks: 2 } })
    );
  });
});
