import { mockPrisma } from '../setup';
import { generateCertificate } from '../../services/certificateGenerator';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../services/pdfGenerator', () => ({
  generateTrainingCertificatePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
}));

const mockEnrollment = {
  id: 'e1',
  userId: 'u1',
  trainingId: 't1',
  status: 'COMPLETED',
  completedAt: new Date(),
  training: { id: 't1', title: 'Training', business: { name: 'Biz' } },
};
const mockUser = { id: 'u1', firstName: 'John', lastName: 'Doe' };

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
  resolve: jest.fn((...args: string[]) => args.join('/')),
  default: { join: jest.fn((...args: string[]) => args.join('/')) },
}));

describe('certificateGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generates certificate for completed training', async () => {
    jest.spyOn(mockPrisma.userTraining, 'findUnique').mockResolvedValue(mockEnrollment as any);
    jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(mockUser as any);
    jest.spyOn(mockPrisma.userTraining, 'update').mockResolvedValue({} as any);

    const r = await generateCertificate('u1', 't1');
    expect(r.certificateUrl).toContain('/certificates/');
    expect(r.userName).toBe('John Doe');
  });

  test('throws if enrollment not found', async () => {
    jest.spyOn(mockPrisma.userTraining, 'findUnique').mockResolvedValue(null);
    await expect(generateCertificate('u1', 't1')).rejects.toThrow('Inscription non trouvée');
  });

  test('throws if training not completed', async () => {
    jest
      .spyOn(mockPrisma.userTraining, 'findUnique')
      .mockResolvedValue({ ...mockEnrollment, status: 'IN_PROGRESS' } as any);
    await expect(generateCertificate('u1', 't1')).rejects.toThrow('Formation non terminée');
  });

  test('handles missing user gracefully', async () => {
    jest.spyOn(mockPrisma.userTraining, 'findUnique').mockResolvedValue(mockEnrollment as any);
    jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(null);
    jest.spyOn(mockPrisma.userTraining, 'update').mockResolvedValue({} as any);

    const r = await generateCertificate('u1', 't1');
    expect(r.userName).toBe('');
  });
});
