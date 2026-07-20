import { mockPrisma } from '../setup';
import {
  listBusinessTrainings,
  getBusinessTraining,
  createBusinessTraining,
  updateBusinessTraining,
  deleteBusinessTraining,
  getTrainingStudents,
  getTrainingStats,
  listLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  createQuiz,
  deleteQuiz,
} from '../../services/trainingBusiness';
import { AppError } from '../../middlewares/errorHandler';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBusiness = { id: 'b1', ownerId: 'u1', name: 'Biz' };
const mockTraining = {
  id: 'tr-1',
  businessId: 'b1',
  title: 'React',
  description: 'Desc',
  category: 'DEV',
  duration: 30,
  deletedAt: null,
  createdAt: new Date(),
  lessons: 2,
  _count: { users: 5, TrainingLesson: 2 },
  TrainingLesson: [],
  users: [],
};
const mockLesson = {
  id: 'les-1',
  trainingId: 'tr-1',
  title: 'Intro',
  description: 'Desc',
  content: 'Cnt',
  videoUrl: null,
  duration: 10,
  sortOrder: 1,
  isFree: false,
  training: { business: { ownerId: 'u1' } },
  TrainingQuiz: null,
};
const mockQuiz = {
  id: 'qz-1',
  lessonId: 'les-1',
  title: 'Quiz 1',
  passingScore: 70,
  maxAttempts: 3,
  timeLimit: null,
  lesson: { training: { business: { ownerId: 'u1' } } },
  QuizQuestion: [],
};

describe('trainingBusiness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listBusinessTrainings', () => {
    it('should return paginated trainings', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(mockBusiness as any);
      jest.spyOn(mockPrisma.training, 'findMany').mockResolvedValue([mockTraining as any]);
      jest.spyOn(mockPrisma.training, 'count').mockResolvedValue(1);
      const r = await listBusinessTrainings('u1');
      expect(r.items).toHaveLength(1);
      expect(r.total).toBe(1);
    });

    it('should throw if business not found', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(null);
      await expect(listBusinessTrainings('u1')).rejects.toThrow(AppError);
    });
  });

  describe('getBusinessTraining', () => {
    it('should return training with details', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(mockBusiness as any);
      jest.spyOn(mockPrisma.training, 'findFirst').mockResolvedValue(mockTraining as any);
      const r = await getBusinessTraining('u1', 'tr-1');
      expect(r.title).toBe('React');
    });

    it('should throw if not found', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(mockBusiness as any);
      jest.spyOn(mockPrisma.training, 'findFirst').mockResolvedValue(null);
      await expect(getBusinessTraining('u1', 'tr-1')).rejects.toThrow(AppError);
    });
  });

  describe('createBusinessTraining', () => {
    it('should create training', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(mockBusiness as any);
      jest.spyOn(mockPrisma.training, 'create').mockResolvedValue(mockTraining as any);
      const r = await createBusinessTraining('u1', {
        title: 'React',
        description: 'Desc',
        category: 'DEV',
        duration: 30,
      });
      expect(r.title).toBe('React');
    });

    it('should throw if business not found', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(null);
      await expect(createBusinessTraining('u1', { title: 'React' })).rejects.toThrow(AppError);
    });
  });

  describe('updateBusinessTraining', () => {
    it('should update training', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(mockBusiness as any);
      jest.spyOn(mockPrisma.training, 'findFirst').mockResolvedValue(mockTraining as any);
      jest
        .spyOn(mockPrisma.training, 'update')
        .mockResolvedValue({ ...mockTraining, title: 'Updated' } as any);
      const r = await updateBusinessTraining('u1', 'tr-1', { title: 'Updated' });
      expect(r.title).toBe('Updated');
    });

    it('should throw if not found', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(mockBusiness as any);
      jest.spyOn(mockPrisma.training, 'findFirst').mockResolvedValue(null);
      await expect(updateBusinessTraining('u1', 'tr-1', { title: 'Updated' })).rejects.toThrow(
        AppError
      );
    });
  });

  describe('deleteBusinessTraining', () => {
    it('should soft delete training', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(mockBusiness as any);
      jest.spyOn(mockPrisma.training, 'findFirst').mockResolvedValue(mockTraining as any);
      jest.spyOn(mockPrisma.training, 'update').mockResolvedValue(mockTraining as any);
      const r = await deleteBusinessTraining('u1', 'tr-1');
      expect(r.message).toContain('supprimée');
    });

    it('should throw if not found', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(mockBusiness as any);
      jest.spyOn(mockPrisma.training, 'findFirst').mockResolvedValue(null);
      await expect(deleteBusinessTraining('u1', 'tr-1')).rejects.toThrow(AppError);
    });
  });

  describe('getTrainingStudents', () => {
    it('should return paginated students', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(mockBusiness as any);
      jest.spyOn(mockPrisma.training, 'findFirst').mockResolvedValue(mockTraining as any);
      jest.spyOn(mockPrisma.userTraining, 'findMany').mockResolvedValue([
        {
          id: 'ut-1',
          user: { id: 'u2', firstName: 'Jean', lastName: 'Dupont', email: 'j@t.com' },
        },
      ] as any);
      jest.spyOn(mockPrisma.userTraining, 'count').mockResolvedValue(1);
      const r = await getTrainingStudents('u1', 'tr-1');
      expect(r.items).toHaveLength(1);
    });
  });

  describe('getTrainingStats', () => {
    it('should return aggregated stats', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(mockBusiness as any);
      jest.spyOn(mockPrisma.training, 'count').mockResolvedValue(5);
      jest
        .spyOn(mockPrisma.userTraining, 'count')
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(5);
      jest
        .spyOn(mockPrisma.training, 'findMany')
        .mockResolvedValue([{ id: 'tr-1', title: 'React', _count: { users: 5 } }] as any);
      const r = await getTrainingStats('u1');
      expect(r.total).toBe(5);
      expect(r.totalStudents).toBe(20);
    });
  });

  describe('listLessons', () => {
    it('should return lessons for training', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(mockBusiness as any);
      jest.spyOn(mockPrisma.training, 'findFirst').mockResolvedValue(mockTraining as any);
      jest.spyOn(mockPrisma.trainingLesson, 'findMany').mockResolvedValue([mockLesson as any]);
      const r = await listLessons('u1', 'tr-1');
      expect(r).toHaveLength(1);
    });
  });

  describe('createLesson', () => {
    it('should create lesson and update count', async () => {
      jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(mockBusiness as any);
      jest.spyOn(mockPrisma.training, 'findFirst').mockResolvedValue(mockTraining as any);
      jest.spyOn(mockPrisma.trainingLesson, 'create').mockResolvedValue(mockLesson as any);
      jest.spyOn(mockPrisma.trainingLesson, 'count').mockResolvedValue(3);
      jest.spyOn(mockPrisma.training, 'update').mockResolvedValue(mockTraining as any);
      const r = await createLesson('u1', {
        trainingId: 'tr-1',
        title: 'Intro',
        description: 'Desc',
        content: 'Cnt',
      });
      expect(r.title).toBe('Intro');
    });
  });

  describe('updateLesson', () => {
    it('should update lesson', async () => {
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
    it('should delete lesson and update count', async () => {
      jest.spyOn(mockPrisma.trainingLesson, 'findUnique').mockResolvedValue(mockLesson as any);
      jest.spyOn(mockPrisma.trainingLesson, 'delete').mockResolvedValue(mockLesson as any);
      jest.spyOn(mockPrisma.trainingLesson, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.training, 'update').mockResolvedValue(mockTraining as any);
      const r = await deleteLesson('u1', 'les-1');
      expect(r.message).toContain('supprimée');
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
  });

  describe('deleteQuiz', () => {
    it('should delete quiz', async () => {
      jest.spyOn(mockPrisma.trainingQuiz, 'findUnique').mockResolvedValue(mockQuiz as any);
      jest.spyOn(mockPrisma.trainingQuiz, 'delete').mockResolvedValue(mockQuiz as any);
      const r = await deleteQuiz('u1', 'qz-1');
      expect(r.message).toContain('supprime');
    });

    it('should throw if not found', async () => {
      jest.spyOn(mockPrisma.trainingQuiz, 'findUnique').mockResolvedValue(null);
      await expect(deleteQuiz('u1', 'qz-1')).rejects.toThrow(AppError);
    });
  });
});
