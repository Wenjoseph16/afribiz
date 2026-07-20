import { mockPrisma } from '../setup';
import * as monetizationAudit from '../../services/monetizationAudit';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockLog = {
  id: 'log-1',
  action: 'ADMIN_SETTINGS_CHANGE',
  metadata: { resource: 'monetization', resourceId: 'key1' },
  createdAt: new Date(),
  user: { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
};

describe('monetizationAudit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logMonetizationChange', () => {
    it('should create a security log entry', async () => {
      (mockPrisma.securityLog.create as jest.Mock).mockResolvedValue(mockLog);
      await monetizationAudit.logMonetizationChange({
        action: 'UPDATE',
        key: 'commissionRate',
        oldValue: 0.01,
        newValue: 0.02,
        changedByUserId: 'admin-1',
        source: 'admin_settings_page',
      });
      expect(mockPrisma.securityLog.create).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (mockPrisma.securityLog.create as jest.Mock).mockRejectedValue(new Error('DB error'));
      await expect(
        monetizationAudit.logMonetizationChange({
          action: 'UPDATE',
          key: 'key1',
          changedByUserId: 'admin-1',
          source: 'api',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('logMonetizationChanges', () => {
    it('should log multiple changes', async () => {
      (mockPrisma.securityLog.create as jest.Mock).mockResolvedValue(mockLog);
      await monetizationAudit.logMonetizationChanges(
        [
          { key: 'rate1', oldValue: undefined, newValue: 0.05 },
          { key: 'rate2', oldValue: 0.01, newValue: 0.02 },
        ],
        'admin-1',
        'commissions_page'
      );
      expect(mockPrisma.securityLog.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMonetizationAuditLogs', () => {
    it('should return formatted audit logs', async () => {
      const mockUser = { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' };
      (mockPrisma.securityLog.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'log-1',
          action: 'ADMIN_SETTINGS_CHANGE',
          metadata: { key: 'rate' },
          createdAt: new Date(),
          user: mockUser,
        },
      ]);
      const result = await monetizationAudit.getMonetizationAuditLogs(10);
      expect(result).toHaveLength(1);
      expect(result[0].createdBy).toBe('John Doe');
    });

    it('should return empty array when no logs', async () => {
      (mockPrisma.securityLog.findMany as jest.Mock).mockResolvedValue([]);
      const result = await monetizationAudit.getMonetizationAuditLogs();
      expect(result).toEqual([]);
    });
  });
});
