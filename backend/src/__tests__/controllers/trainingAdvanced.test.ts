jest.mock('../../services/trainingAdvanced', () => ({
  listLessons: jest.fn(),
  getLesson: jest.fn(),
  createLesson: jest.fn(),
  updateLesson: jest.fn(),
  deleteLesson: jest.fn(),
  createQuiz: jest.fn(),
  submitQuizAttempt: jest.fn(),
  getUserQuizAttempts: jest.fn(),
  getUserTrainingProgress: jest.fn(),
}));

import * as ctrl from '../../controllers/trainingAdvanced';
import * as tsvc from '../../services/trainingAdvanced';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('trainingAdvanced controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('lessons', () => {
    it('listLessons', async () => {
      (tsvc.listLessons as jest.Mock).mockResolvedValue([{ id: 'l1' }]);
      const res = mockRes();
      ctrl.listLessons(req({ params: { trainingId: 't1' } }), res, jest.fn());
      await flush();
      expect(tsvc.listLessons).toHaveBeenCalledWith('u1', 't1');
    });

    it('getLesson', async () => {
      (tsvc.getLesson as jest.Mock).mockResolvedValue({ id: 'l1' });
      const res = mockRes();
      ctrl.getLesson(req({ params: { id: 'l1' } }), res, jest.fn());
      await flush();
    });

    it('createLesson', async () => {
      (tsvc.createLesson as jest.Mock).mockResolvedValue({ id: 'l1' });
      const res = mockRes();
      ctrl.createLesson(req({ body: { title: 'Lesson' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deleteLesson', async () => {
      (tsvc.deleteLesson as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.deleteLesson(req({ params: { id: 'l1' } }), res, jest.fn());
      await flush();
    });
  });

  describe('quizzes', () => {
    it('createQuiz', async () => {
      (tsvc.createQuiz as jest.Mock).mockResolvedValue({ id: 'q1' });
      const res = mockRes();
      ctrl.createQuiz(req({ body: { lessonId: 'l1' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('submitQuizAttempt passed', async () => {
      (tsvc.submitQuizAttempt as jest.Mock).mockResolvedValue({ passed: true, score: 80 });
      const res = mockRes();
      ctrl.submitQuizAttempt(
        req({ params: { quizId: 'q1' }, body: { answers: [] } }),
        res,
        jest.fn()
      );
      await flush();
      expect(res.json).toHaveBeenCalled();
    });

    it('submitQuizAttempt failed', async () => {
      (tsvc.submitQuizAttempt as jest.Mock).mockResolvedValue({ passed: false, score: 30 });
      const res = mockRes();
      ctrl.submitQuizAttempt(
        req({ params: { quizId: 'q1' }, body: { answers: [] } }),
        res,
        jest.fn()
      );
      await flush();
    });

    it('getQuizAttempts', async () => {
      (tsvc.getUserQuizAttempts as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getQuizAttempts(req({ params: { quizId: 'q1' } }), res, jest.fn());
      await flush();
    });
  });

  describe('getTrainingProgress', () => {
    it('should return progress', async () => {
      (tsvc.getUserTrainingProgress as jest.Mock).mockResolvedValue({ completed: 3, total: 10 });
      const res = mockRes();
      ctrl.getTrainingProgress(req({ params: { trainingId: 't1' } }), res, jest.fn());
      await flush();
    });
  });

  describe('errors', () => {
    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.listLessons({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
