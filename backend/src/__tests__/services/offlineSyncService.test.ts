import { mockPrisma } from '../setup';
import * as offlineSyncService from '../../services/offlineSyncService';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

const mockItem = {
  id: 'sync-1',
  userId: 'user-1',
  entityType: 'PRODUCT',
  entityId: 'prod-1',
  action: 'CREATE',
  payload: {},
  status: 'PENDING',
  createdAt: new Date(),
  syncedAt: null,
};

describe('offlineSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listSyncItems', () => {
    it('should list sync items for user', async () => {
      (mockPrisma.offlineSyncQueue.findMany as jest.Mock).mockResolvedValue([mockItem]);
      const result = await offlineSyncService.listSyncItems('user-1');
      expect(result).toHaveLength(1);
    });

    it('should filter by status', async () => {
      (mockPrisma.offlineSyncQueue.findMany as jest.Mock).mockResolvedValue([]);
      await offlineSyncService.listSyncItems('user-1', 'PENDING');
      expect(mockPrisma.offlineSyncQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', status: 'PENDING' } })
      );
    });
  });

  describe('createSyncItem', () => {
    it('should create a sync item', async () => {
      (mockPrisma.offlineSyncQueue.create as jest.Mock).mockResolvedValue(mockItem);
      const result = await offlineSyncService.createSyncItem({
        userId: 'user-1',
        entityType: 'PRODUCT',
        entityId: 'prod-1',
        action: 'CREATE',
        payload: {},
      });
      expect(result.status).toBe('PENDING');
    });
  });

  describe('processSyncItem', () => {
    it('should update status to SYNCED', async () => {
      (mockPrisma.offlineSyncQueue.findUnique as jest.Mock).mockResolvedValue(mockItem);
      (mockPrisma.offlineSyncQueue.update as jest.Mock).mockResolvedValue({
        ...mockItem,
        status: 'SYNCED',
        syncedAt: new Date(),
      });
      const result = await offlineSyncService.processSyncItem('sync-1');
      expect(result.status).toBe('SYNCED');
    });

    it('should throw if item not found', async () => {
      (mockPrisma.offlineSyncQueue.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(offlineSyncService.processSyncItem('invalid')).rejects.toThrow('non trouvé');
    });
  });

  describe('getPendingSyncCount', () => {
    it('should return count of pending items', async () => {
      (mockPrisma.offlineSyncQueue.count as jest.Mock).mockResolvedValue(5);
      const result = await offlineSyncService.getPendingSyncCount('user-1');
      expect(result).toBe(5);
    });
  });

  describe('bulkSync', () => {
    it('should create multiple items and return count', async () => {
      (mockPrisma.offlineSyncQueue.createMany as jest.Mock).mockResolvedValue({ count: 2 });
      const result = await offlineSyncService.bulkSync('user-1', [
        { entityType: 'PRODUCT', entityId: 'p1', action: 'CREATE', payload: {} },
        { entityType: 'PRODUCT', entityId: 'p2', action: 'UPDATE', payload: {} },
      ]);
      expect(result.synced).toBe(2);
    });
  });
});
