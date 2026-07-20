import { mockPrisma } from '../setup';
import {
  connectAccount,
  disconnectAccount,
  listAccounts,
  updateShareSettings,
  autoShareToSocial,
} from '../../services/socialShareService';
import { AppError } from '../../middlewares/errorHandler';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({
  publishSocialShareRequested: jest.fn(),
  publishSocialShareSuccess: jest.fn(),
  publishSocialShareFailed: jest.fn(),
}));
jest.mock('../../config/env', () => ({
  config: { FACEBOOK_API_VERSION: 'v21.0' },
}));

const mockAccount = {
  id: 'acc-1',
  businessId: 'b1',
  platform: 'FACEBOOK',
  accountName: 'My Page',
  accountId: 'page-1',
  accessToken: 'tok-1',
  tokenExpiresAt: null,
  refreshToken: null,
  avatar: null,
  autoShare: true,
  autoShareTypes: ['PRODUCT', 'SERVICE'],
  isActive: true,
  lastPostedAt: null,
};

describe('socialShareService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connectAccount', () => {
    it('should upsert social account', async () => {
      jest.spyOn(mockPrisma.socialAccount, 'upsert').mockResolvedValue(mockAccount as any);
      const r = await connectAccount('b1', {
        platform: 'FACEBOOK',
        accountName: 'My Page',
        accessToken: 'tok-1',
      });
      expect(r).toBeDefined();
      expect(mockPrisma.socialAccount.upsert).toHaveBeenCalled();
    });
  });

  describe('disconnectAccount', () => {
    it('should disconnect an account', async () => {
      jest.spyOn(mockPrisma.socialAccount, 'findFirst').mockResolvedValue(mockAccount as any);
      jest.spyOn(mockPrisma.socialAccount, 'update').mockResolvedValue(mockAccount as any);
      const r = await disconnectAccount('b1', 'acc-1');
      expect(r.message).toContain('déconnecté');
    });

    it('should throw if account not found', async () => {
      jest.spyOn(mockPrisma.socialAccount, 'findFirst').mockResolvedValue(null);
      await expect(disconnectAccount('b1', 'acc-1')).rejects.toThrow(AppError);
    });
  });

  describe('listAccounts', () => {
    it('should return accounts for business', async () => {
      jest.spyOn(mockPrisma.socialAccount, 'findMany').mockResolvedValue([mockAccount as any]);
      const r = await listAccounts('b1');
      expect(r).toHaveLength(1);
    });
  });

  describe('updateShareSettings', () => {
    it('should update autoShare', async () => {
      jest.spyOn(mockPrisma.socialAccount, 'findFirst').mockResolvedValue(mockAccount as any);
      jest
        .spyOn(mockPrisma.socialAccount, 'update')
        .mockResolvedValue({ ...mockAccount, autoShare: false } as any);
      const r = await updateShareSettings('b1', 'acc-1', { autoShare: false });
      expect(r.autoShare).toBe(false);
    });

    it('should throw if account not found', async () => {
      jest.spyOn(mockPrisma.socialAccount, 'findFirst').mockResolvedValue(null);
      await expect(updateShareSettings('b1', 'acc-1', { autoShare: false })).rejects.toThrow(
        AppError
      );
    });
  });

  describe('autoShareToSocial', () => {
    const content = {
      type: 'PRODUCT' as const,
      title: 'New Product',
      description: 'Great item',
      link: 'https://afribiz.com/p/1',
      businessId: 'b1',
      businessName: 'Biz',
      ownerId: 'u1',
    };

    it('should skip if no active accounts', async () => {
      jest.spyOn(mockPrisma.socialAccount, 'findMany').mockResolvedValue([]);
      await autoShareToSocial(content);
      expect(mockPrisma.socialAccount.findMany).toHaveBeenCalled();
    });

    it('should attempt to post to matching platforms', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      } as any);
      jest.spyOn(mockPrisma.socialAccount, 'findMany').mockResolvedValue([mockAccount as any]);
      jest.spyOn(mockPrisma.socialAccount, 'update').mockResolvedValue(mockAccount as any);
      await autoShareToSocial(content);
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
