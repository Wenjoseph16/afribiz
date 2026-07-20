import { mockPrisma } from '../setup';
import {
  listLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  createQuiz,
  submitQuizAttempt,
  getUserQuizAttempts,
  updateTrainingProgress,
  getUserTrainingProgress,
} from '../../services/trainingAdvanced';
import { AppError } from '../../middlewares/errorHandler';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockTraining = { id: 'tr-1', title: 'React', business: { ownerId: 'u1' } };
const mockLesson = {
  id: 'les-1',
  trainingId: 'tr-1',
  title: 'Intro',
  content: 'Content',
  videoUrl: null,
  duration: 10,
  sortOrder: 1,
  isFree: false,
  description: 'Desc',
  training: { id: 'tr-1', title: 'React', businessId: 'b1', business: { ownerId: 'u1' } },
};
const mockQuiz = {
  id: 'qz-1',
  lessonId: 'les-1',
  title: 'Quiz 1',
  passingScore: 70,
  maxAttempts: 3,
  timeLimit: null,
  questions: [{ id: 'q-1', question: 'Q1', options: ['A', 'B'], correctIndex: 0, sortOrder: 0 }],
};
const mockAttempt = {
  id: 'att-1',
  userId: 'u1',
  quizId: 'qz-1',
  score: 100,
  totalQuestions: 1,
  passed: true,
  completedAt: new Date(),
};

describe('trainingAdvanced', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listLessons', () => {
    it('should return lessons for valid training', async () => {
      jest.spyOn(mockPrisma.training, 'findFirst').mockResolvedValue(mockTraining as any);
      jest.spyOn(mockPrisma.trainingLesson, 'findMany').mockResolvedValue([mockLesson as any]);
      const r = await listLessons('u1', 'tr-1');
      expect(r).toHaveLength(1);
      expect(r[0].title).toBe('Intro');
    });

    it('should throw if training not found', async () => {
      jest.spyOn(mockPrisma.training, 'findFirst').mockResolvedValue(null);
      await expect(listLessons('u1', 'tr-1')).rejects.toThrow(AppError);
    });
  });

  describe('getLesson', () => {
    it('should return lesson by id', async () => {
      jest.spyOn(mockPrisma.trainingLesson, 'findUnique').mockResolvedValue(mockLesson as any);
      const r = await getLesson('les-1');
      expect(r.title).toBe('Intro');
    });

    it('should throw if not found', async () => {
      jest.spyOn(mockPrisma.trainingLesson, 'findUnique').mockResolvedValue(null);
      await expect(getLesson('les-1')).rejects.toThrow(AppError);
    });
  });

  describe('createLesson', () => {
    it('should create a lesson', async () => {
      jest.spyOn(mockPrisma.training, 'findFirst').mockResolvedValue(mockTraining as any);
      jest.spyOn(mockPrisma.trainingLesson, 'create').mockResolvedValue(mockLesson as any);
      const r = await createLesson('u1', { trainingId: 'tr-1', title: 'Intro' });
      expect(r.title).toBe('Intro');
    });

    it('should throw if training not found', async () => {
      jest.spyOn(mockPrisma.training, 'findFirst').mockResolvedValue(null);
      await expect(createLesson('u1', { trainingId: 'tr-1', title: 'Intro' })).rejects.toThrow(
        AppError
      );
    });
  });

  describe('updateLesson', () => {
    it('should update a lesson', async () => {
      jest.spyOn(mockPrisma.trainingLesson, 'findUnique').mockResolvedValue(mockLesson as any);
      jest
        .spyOn(mockPrisma.trainingLesson, 'update')
        .mockResolvedValue({ ...mockLesson, title: 'Updated' } as any);
      const r = await updateLesson('u1', 'les-1', { title: 'Updated' });
      expect(r.title).toBe('Updated');
    });

    it('should throw if not found', async () => {
      jest.spyOn(mockPrisma.trainingLesson, 'findUnique').mockResolvedValue(null);
      await expect(updateLesson('u1', 'les-1', { title: 'Updated' })).rejects.toThrow(AppError);
    });
  });

  describe('deleteLesson', () => {
    it('should delete a lesson', async () => {
      jest.spyOn(mockPrisma.trainingLesson, 'findUnique').mockResolvedValue(mockLesson as any);
      jest.spyOn(mockPrisma.trainingLesson, 'delete').mockResolvedValue(mockLesson as any);
      await deleteLesson('u1', 'les-1');
      expect(mockPrisma.trainingLesson.delete).toHaveBeenCalledWith({ where: { id: 'les-1' } });
    });

    it('should throw if not found', async () => {
      jest.spyOn(mockPrisma.trainingLesson, 'findUnique').mockResolvedValue(null);
      await expect(deleteLesson('u1', 'les-1')).rejects.toThrow(AppError);
    });
  });

  describe('createQuiz', () => {
    it('should create quiz with questions', async () => {
      jest.spyOn(mockPrisma.trainingLesson, 'findUnique').mockResolvedValue(mockLesson as any);
      jest.spyOn(mockPrisma.trainingQuiz, 'create').mockResolvedValue(mockQuiz as any);
      const r = await createQuiz('u1', {
        lessonId: 'les-1',
        title: 'Quiz 1',
        questions: [{ question: 'Q1', options: ['A', 'B'], correctIndex: 0 }],
      });
      expect(r.title).toBe('Quiz 1');
    });

    it('should throw if lesson not found', async () => {
      jest.spyOn(mockPrisma.trainingLesson, 'findUnique').mockResolvedValue(null);
      await expect(createQuiz('u1', { lessonId: 'les-1', title: 'Quiz 1' })).rejects.toThrow(
        AppError
      );
    });
  });

  describe('submitQuizAttempt', () => {
    it('should grade and return attempt', async () => {
      jest.spyOn(mockPrisma.trainingQuiz, 'findUnique').mockResolvedValue(mockQuiz as any);
      jest
        .spyOn(mockPrisma.trainingLesson, 'findUnique')
        .mockResolvedValue({ id: 'les-1', trainingId: 'tr-1' } as any);
      jest.spyOn(mockPrisma.userQuizAttempt, 'create').mockResolvedValue(mockAttempt as any);
      jest.spyOn(mockPrisma.trainingLesson, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.userQuizAttempt, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.userTraining, 'update').mockResolvedValue({} as any);
      const r = await submitQuizAttempt('u1', 'qz-1', [0]);
      expect(r.passed).toBe(true);
      expect(r.score).toBe(100);
    });

    it('should throw if quiz not found', async () => {
      jest.spyOn(mockPrisma.trainingQuiz, 'findUnique').mockResolvedValue(null);
      await expect(submitQuizAttempt('u1', 'qz-1', [0])).rejects.toThrow(AppError);
    });
  });

  describe('getUserQuizAttempts', () => {
    it('should return attempts', async () => {
      jest.spyOn(mockPrisma.userQuizAttempt, 'findMany').mockResolvedValue([mockAttempt as any]);
      const r = await getUserQuizAttempts('u1', 'qz-1');
      expect(r).toHaveLength(1);
    });
  });

  describe('updateTrainingProgress', () => {
    it('should calculate progress', async () => {
      jest.spyOn(mockPrisma.trainingLesson, 'count').mockResolvedValue(2);
      jest.spyOn(mockPrisma.userQuizAttempt, 'count').mockResolvedValue(1);
      jest
        .spyOn(mockPrisma.userTraining, 'update')
        .mockResolvedValue({ progress: 50, status: 'IN_PROGRESS' } as any);
      const r = await updateTrainingProgress('u1', 'tr-1');
      expect(r.progress).toBe(50);
    });

    it('should return 0 if no lessons', async () => {
      jest.spyOn(mockPrisma.trainingLesson, 'count').mockResolvedValue(0);
      jest
        .spyOn(mockPrisma.userTraining, 'update')
        .mockResolvedValue({ progress: 0, status: 'NOT_STARTED' } as any);
      const r = await updateTrainingProgress('u1', 'tr-1');
      expect(r.progress).toBe(0);
    });
  });

  describe('getUserTrainingProgress', () => {
    it('should return full progress', async () => {
      jest.spyOn(mockPrisma.training, 'findUnique').mockResolvedValue({
        id: 'tr-1',
        title: 'React',
        lessons: [{ id: 'les-1', title: 'Intro', quiz: mockQuiz }],
      } as any);
      jest.spyOn(mockPrisma.userQuizAttempt, 'findMany').mockResolvedValue([mockAttempt as any]);
      jest
        .spyOn(mockPrisma.userTraining, 'findUnique')
        .mockResolvedValue({ progress: 100, status: 'COMPLETED' } as any);
      const r = await getUserTrainingProgress('u1', 'tr-1');
      expect(r.progress).toBe(100);
      expect(r.status).toBe('COMPLETED');
    });

    it('should throw if training not found', async () => {
      jest.spyOn(mockPrisma.training, 'findUnique').mockResolvedValue(null);
      await expect(getUserTrainingProgress('u1', 'tr-1')).rejects.toThrow(AppError);
    });
  });
});
