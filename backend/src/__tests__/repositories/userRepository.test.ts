import { UserRepository } from '../../repositories/userRepository';
import { mockPrisma } from '../setup';

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('emailExists', () => {
    it('should return true when email exists and is not deleted', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'user-1' });
      const result = await UserRepository.emailExists('test@example.com');
      expect(result).toBe(true);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true },
      });
    });

    it('should return false when email does not exist', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);
      const result = await UserRepository.emailExists('nonexistent@example.com');
      expect(result).toBe(false);
    });

    it('should return false for soft-deleted users', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);
      const result = await UserRepository.emailExists('deleted@example.com');
      expect(result).toBe(false);
    });
  });

  describe('phoneExists', () => {
    it('should return true when phone exists and is not deleted', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'user-1' });
      const result = await UserRepository.phoneExists('+22890123456');
      expect(result).toBe(true);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: '+22890123456' },
        select: { id: true },
      });
    });

    it('should return false when phone does not exist', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);
      const result = await UserRepository.phoneExists('+22800000000');
      expect(result).toBe(false);
    });
  });
});
