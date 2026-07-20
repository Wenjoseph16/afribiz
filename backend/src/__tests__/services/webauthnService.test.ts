import { mockPrisma } from '../setup';
import { WebAuthnService } from '../../services/webauthnService';
import { AppError } from '../../middlewares/errorHandler';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockUser = { id: 'u1', email: 'test@test.com', firstName: 'Jean', lastName: 'Dupont' };
const mockCredential = {
  id: 1,
  userId: 'u1',
  credentialId: 'cred-1',
  publicKey: Buffer.from('key'),
  counter: BigInt(0),
  transports: [],
  deviceName: 'Test Device',
  backedUp: false,
  createdAt: new Date(),
  lastUsedAt: null,
};

describe('WebAuthnService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRegistrationOptions', () => {
    it('should generate options for user', async () => {
      jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(mockPrisma.webAuthnCredential, 'findMany').mockResolvedValue([]);
      const r = await WebAuthnService.generateRegistrationOptions('u1');
      expect(r.challenge).toBeDefined();
      expect(r.rp.name).toBe('AfriBiz');
      expect(r.user.id).toBe('u1');
    });

    it('should throw if user not found', async () => {
      jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(null);
      await expect(WebAuthnService.generateRegistrationOptions('u1')).rejects.toThrow(AppError);
    });
  });

  describe('verifyAndRegister', () => {
    const credential = {
      id: 'cred-1',
      rawId: 'cred-1',
      response: { clientDataJSON: '{}', attestationObject: Buffer.from('att').toString('base64') },
    };

    it('should register new credential', async () => {
      jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(mockPrisma.webAuthnCredential, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.webAuthnCredential, 'create').mockResolvedValue(mockCredential as any);
      await WebAuthnService.verifyAndRegister('u1', credential as any);
      expect(mockPrisma.webAuthnCredential.create).toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(null);
      await expect(WebAuthnService.verifyAndRegister('u1', credential as any)).rejects.toThrow(
        AppError
      );
    });

    it('should throw if credential already registered', async () => {
      jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest
        .spyOn(mockPrisma.webAuthnCredential, 'findUnique')
        .mockResolvedValue(mockCredential as any);
      await expect(WebAuthnService.verifyAndRegister('u1', credential as any)).rejects.toThrow(
        AppError
      );
    });
  });

  describe('getCredentials', () => {
    it('should return credentials list', async () => {
      jest
        .spyOn(mockPrisma.webAuthnCredential, 'findMany')
        .mockResolvedValue([mockCredential as any]);
      const r = await WebAuthnService.getCredentials('u1');
      expect(r).toHaveLength(1);
      expect(r[0].deviceName).toBe('Test Device');
    });
  });

  describe('removeCredential', () => {
    it('should remove credential', async () => {
      jest
        .spyOn(mockPrisma.webAuthnCredential, 'findUnique')
        .mockResolvedValue(mockCredential as any);
      jest.spyOn(mockPrisma.webAuthnCredential, 'delete').mockResolvedValue(mockCredential as any);
      await WebAuthnService.removeCredential('u1', 'cred-1');
      expect(mockPrisma.webAuthnCredential.delete).toHaveBeenCalledWith({
        where: { credentialId: 'cred-1' },
      });
    });

    it('should throw if not found', async () => {
      jest.spyOn(mockPrisma.webAuthnCredential, 'findUnique').mockResolvedValue(null);
      await expect(WebAuthnService.removeCredential('u1', 'cred-1')).rejects.toThrow(AppError);
    });

    it('should throw if userId mismatch', async () => {
      jest
        .spyOn(mockPrisma.webAuthnCredential, 'findUnique')
        .mockResolvedValue({ ...mockCredential, userId: 'other' } as any);
      await expect(WebAuthnService.removeCredential('u1', 'cred-1')).rejects.toThrow(AppError);
    });
  });
});
