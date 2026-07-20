import { mockPrisma } from '../setup';
import { enrollInTraining, listAllTrainings, getUserTrainings } from '../../services/training';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockTraining = {
  id: 'tr-1',
  title: 'Formation React',
  description: 'Apprenez React',
  price: 25000,
  currency: 'FCFA',
  isPublished: true,
  category: 'DEV',
  duration: 30,
  lessons: 10,
  business: null,
  businessId: null,
  createdAt: new Date(),
  deletedAt: null,
};

describe('Training Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('enrollInTraining creates enrollment', async () => {
    jest.spyOn(mockPrisma.training, 'findUnique').mockResolvedValue(mockTraining as any);
    jest.spyOn(mockPrisma.userTraining, 'findUnique').mockResolvedValue(null);
    jest.spyOn(mockPrisma.userTraining, 'create').mockResolvedValue({
      trainingId: 'tr-1',
      userId: 'u1',
      status: 'NOT_STARTED',
      training: mockTraining,
    } as any);
    const r = await enrollInTraining('u1', 'tr-1');
    expect(r).toBeDefined();
  });

  test('enrollInTraining rejects duplicate', async () => {
    jest.spyOn(mockPrisma.training, 'findUnique').mockResolvedValue(mockTraining as any);
    jest
      .spyOn(mockPrisma.userTraining, 'findUnique')
      .mockResolvedValue({ userId: 'u1', trainingId: 'tr-1' } as any);
    await expect(enrollInTraining('u1', 'tr-1')).rejects.toThrow('déjà inscrit');
  });

  test('listAllTrainings returns published', async () => {
    jest.spyOn(mockPrisma.training, 'findMany').mockResolvedValue([mockTraining as any]);
    const r = await listAllTrainings();
    expect(r).toHaveLength(1);
  });

  test('getUserTrainings returns user enrollments', async () => {
    jest.spyOn(mockPrisma.userTraining, 'findMany').mockResolvedValue([
      {
        userId: 'u1',
        trainingId: 'tr-1',
        training: { ...mockTraining, business: { name: 'Biz' } },
        status: 'NOT_STARTED',
        progress: 0,
        url: null,
        certificateUrl: null,
      } as any,
    ]);
    const r = await getUserTrainings('u1');
    expect(r).toHaveLength(1);
  });
});
