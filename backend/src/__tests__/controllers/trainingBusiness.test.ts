jest.mock('../../services/trainingBusiness', () => ({
  listBusinessTrainings: jest.fn(),
  getBusinessTraining: jest.fn(),
  createBusinessTraining: jest.fn(),
  updateBusinessTraining: jest.fn(),
  deleteBusinessTraining: jest.fn(),
  getTrainingStudents: jest.fn(),
  getTrainingStats: jest.fn(),
  listLessons: jest.fn(),
  createLesson: jest.fn(),
  updateLesson: jest.fn(),
  deleteLesson: jest.fn(),
  createQuiz: jest.fn(),
  deleteQuiz: jest.fn(),
}));

import * as ctrl from '../../controllers/trainingBusiness';
import * as tbsvc from '../../services/trainingBusiness';

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

describe('trainingBusiness controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CRUD', () => {
    it('listBusinessTrainings', async () => {
      (tbsvc.listBusinessTrainings as jest.Mock).mockResolvedValue([{ id: 't1' }]);
      const res = mockRes();
      ctrl.listBusinessTrainings(req(), res, jest.fn());
      await flush();
      expect(tbsvc.listBusinessTrainings).toHaveBeenCalledWith('u1', {});
    });

    it('createBusinessTraining', async () => {
      (tbsvc.createBusinessTraining as jest.Mock).mockResolvedValue({ id: 't1' });
      const res = mockRes();
      ctrl.createBusinessTraining(req({ body: { title: 'Training' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('updateBusinessTraining', async () => {
      (tbsvc.updateBusinessTraining as jest.Mock).mockResolvedValue({ id: 't1' });
      const res = mockRes();
      ctrl.updateBusinessTraining(
        req({ params: { id: 't1' }, body: { title: 'Updated' } }),
        res,
        jest.fn()
      );
      await flush();
    });

    it('deleteBusinessTraining', async () => {
      (tbsvc.deleteBusinessTraining as jest.Mock).mockResolvedValue({ message: 'Deleted' });
      const res = mockRes();
      ctrl.deleteBusinessTraining(req({ params: { id: 't1' } }), res, jest.fn());
      await flush();
    });
  });

  describe('students & stats', () => {
    it('getTrainingStudents', async () => {
      (tbsvc.getTrainingStudents as jest.Mock).mockResolvedValue([{ id: 's1' }]);
      const res = mockRes();
      ctrl.getTrainingStudents(
        req({ params: { id: 't1' }, query: { status: 'active' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(tbsvc.getTrainingStudents).toHaveBeenCalledWith('u1', 't1', { status: 'active' });
    });

    it('getTrainingStats', async () => {
      (tbsvc.getTrainingStats as jest.Mock).mockResolvedValue({ total: 5, active: 3 });
      const res = mockRes();
      ctrl.getTrainingStats(req(), res, jest.fn());
      await flush();
    });
  });

  describe('lessons & quizzes', () => {
    it('listLessons', async () => {
      (tbsvc.listLessons as jest.Mock).mockResolvedValue([{ id: 'l1' }]);
      const res = mockRes();
      ctrl.listLessons(req({ params: { trainingId: 't1' } }), res, jest.fn());
      await flush();
    });

    it('createLesson', async () => {
      (tbsvc.createLesson as jest.Mock).mockResolvedValue({ id: 'l1' });
      const res = mockRes();
      ctrl.createLesson(req({ body: { title: 'Lesson' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('createLesson', async () => {
      (tbsvc.createLesson as jest.Mock).mockResolvedValue({ id: 'l1' });
      const res = mockRes();
      ctrl.createLesson(req({ body: { title: 'Lesson' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('createQuiz', async () => {
      (tbsvc.createQuiz as jest.Mock).mockResolvedValue({ id: 'q1' });
      const res = mockRes();
      ctrl.createQuiz(req({ body: { lessonId: 'l1' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deleteQuiz', async () => {
      (tbsvc.deleteQuiz as jest.Mock).mockResolvedValue({ message: 'Deleted' });
      const res = mockRes();
      ctrl.deleteQuiz(req({ params: { quizId: 'q1' } }), res, jest.fn());
      await flush();
    });
  });

  describe('errors', () => {
    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.listBusinessTrainings({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
