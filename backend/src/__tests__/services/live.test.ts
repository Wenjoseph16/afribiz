import { mockPrisma } from '../setup';
import * as liveService from '../../services/liveService';
import { AppError } from '../../middlewares/errorHandler';

const mockBusiness = {
  id: 'biz-1',
  name: 'Biz',
  slug: 'biz',
  logo: null,
  type: 'SHOP',
  city: 'Abidjan',
};
const mockLive = {
  id: 'live-1',
  businessId: 'biz-1',
  title: 'Live special',
  description: 'Vente en direct',
  coverImage: null,
  streamUrl: null,
  streamKey: null,
  status: 'LIVE',
  hasEscrow: false,
  scheduledAt: null,
  startedAt: new Date(),
  endedAt: null,
  viewerCount: 10,
  maxViewers: null,
  viewerCountPeak: 15,
  createdAt: new Date(),
  updatedAt: new Date(),
  business: mockBusiness,
  products: [],
  chats: [],
  _count: { participants: 5, reactions: 20 },
};

const mockProduct = {
  id: 'prod-1',
  liveId: 'live-1',
  productId: null,
  name: 'Article live',
  description: 'Super article',
  price: 5000,
  currency: 'FCFA',
  image: null,
  stock: 50,
  remainingStock: 48,
  isActive: true,
  sortOrder: 0,
  createdAt: new Date(),
  live: { businessId: 'biz-1' },
};

describe('LiveService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveLives', () => {
    it('should return paginated lives', async () => {
      (mockPrisma.live.findMany as jest.Mock).mockResolvedValue([mockLive]);
      (mockPrisma.live.count as jest.Mock).mockResolvedValue(1);
      const result = await liveService.getActiveLives();
      expect(result!.items).toHaveLength(1);
      expect(result!.total).toBe(1);
    });

    it('should filter by status', async () => {
      (mockPrisma.live.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.live.count as jest.Mock).mockResolvedValue(0);
      await liveService.getActiveLives({ status: 'LIVE' });
      expect(mockPrisma.live.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'LIVE' }) })
      );
    });

    it('should filter by businessId', async () => {
      (mockPrisma.live.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.live.count as jest.Mock).mockResolvedValue(0);
      await liveService.getActiveLives({ businessId: 'biz-1' });
      expect(mockPrisma.live.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ businessId: 'biz-1' }) })
      );
    });

    it('should return empty when no lives', async () => {
      (mockPrisma.live.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.live.count as jest.Mock).mockResolvedValue(0);
      const result = await liveService.getActiveLives();
      expect(result!.items).toHaveLength(0);
    });
  });

  describe('getLiveById', () => {
    it('should return live with details', async () => {
      (mockPrisma.live.findUnique as jest.Mock).mockResolvedValue(mockLive);
      const result = await liveService.getLiveById('live-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('live-1');
    });

    it('should return null when not found', async () => {
      (mockPrisma.live.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await liveService.getLiveById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createLive', () => {
    it('should create live with products and feed item', async () => {
      (mockPrisma.live.create as jest.Mock).mockResolvedValue(mockLive);
      (mockPrisma.liveProduct.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (mockPrisma.feedItem.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.live.findUnique as jest.Mock).mockResolvedValue(mockLive);

      const result = await liveService.createLive({
        businessId: 'biz-1',
        title: 'Live special',
        products: [{ name: 'Article live', price: 5000 }],
      });

      expect(result!.id).toBe('live-1');
      expect(mockPrisma.liveProduct.createMany).toHaveBeenCalled();
      expect(mockPrisma.feedItem.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'LIVE' }) })
      );
    });

    it('should create scheduled live', async () => {
      (mockPrisma.live.create as jest.Mock).mockResolvedValue({ ...mockLive, status: 'SCHEDULED' });
      (mockPrisma.feedItem.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.live.findUnique as jest.Mock).mockResolvedValue({
        ...mockLive,
        status: 'SCHEDULED',
      });

      await liveService.createLive({
        businessId: 'biz-1',
        title: 'Live planifié',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });

      expect(mockPrisma.live.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'SCHEDULED' }) })
      );
    });

    it('should create live with escrow', async () => {
      (mockPrisma.live.create as jest.Mock).mockResolvedValue(mockLive);
      (mockPrisma.feedItem.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.live.findUnique as jest.Mock).mockResolvedValue(mockLive);

      await liveService.createLive({
        businessId: 'biz-1',
        title: 'Live escrow',
        hasEscrow: true,
      });

      expect(mockPrisma.live.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ hasEscrow: true }) })
      );
    });
  });

  describe('startLive', () => {
    it('should start scheduled live', async () => {
      (mockPrisma.live.findFirst as jest.Mock).mockResolvedValue({
        ...mockLive,
        status: 'SCHEDULED',
      });
      (mockPrisma.live.update as jest.Mock).mockResolvedValue({ ...mockLive, status: 'LIVE' });

      const result = await liveService.startLive('live-1', 'biz-1');
      expect(result!.status).toBe('LIVE');
    });

    it('should throw when not found', async () => {
      (mockPrisma.live.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(liveService.startLive('nonexistent', 'biz-1')).rejects.toThrow(AppError);
    });

    it('should throw when not scheduled', async () => {
      (mockPrisma.live.findFirst as jest.Mock).mockResolvedValue({ ...mockLive, status: 'ENDED' });
      await expect(liveService.startLive('live-1', 'biz-1')).rejects.toThrow(AppError);
    });
  });

  describe('endLive', () => {
    it('should end active live', async () => {
      (mockPrisma.live.findFirst as jest.Mock).mockResolvedValue(mockLive);
      (mockPrisma.live.update as jest.Mock).mockResolvedValue({ ...mockLive, status: 'ENDED' });

      const result = await liveService.endLive('live-1', 'biz-1');
      expect(result!.status).toBe('ENDED');
    });

    it('should throw when not found', async () => {
      (mockPrisma.live.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(liveService.endLive('nonexistent', 'biz-1')).rejects.toThrow(AppError);
    });
  });

  describe('updateLiveStatus', () => {
    it('should update status', async () => {
      (mockPrisma.live.findFirst as jest.Mock).mockResolvedValue(mockLive);
      (mockPrisma.live.update as jest.Mock).mockResolvedValue({ ...mockLive, status: 'ENDED' });

      const result = await liveService.updateLiveStatus('live-1', 'ENDED', 'biz-1');
      expect(result!.status).toBe('ENDED');
    });

    it('should throw when not found', async () => {
      (mockPrisma.live.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(liveService.updateLiveStatus('nonexistent', 'ENDED', 'biz-1')).rejects.toThrow(
        AppError
      );
    });
  });

  describe('addLiveProduct', () => {
    it('should add product to live', async () => {
      (mockPrisma.live.findFirst as jest.Mock).mockResolvedValue(mockLive);
      (mockPrisma.liveProduct.create as jest.Mock).mockResolvedValue(mockProduct);

      const result = await liveService.addLiveProduct('live-1', 'biz-1', {
        name: 'Nouveau produit',
        price: 3000,
      });
      expect(result!.name).toBe('Article live');
    });

    it('should throw when live not found', async () => {
      (mockPrisma.live.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        liveService.addLiveProduct('nonexistent', 'biz-1', { name: 'Test', price: 1000 })
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateLiveProduct', () => {
    it('should update product when owned', async () => {
      (mockPrisma.liveProduct.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (mockPrisma.liveProduct.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        price: 6000,
      });

      const result = await liveService.updateLiveProduct('prod-1', 'biz-1', { price: 6000 });
      expect(result!.price).toBe(6000);
    });

    it('should throw when not found', async () => {
      (mockPrisma.liveProduct.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(liveService.updateLiveProduct('nonexistent', 'biz-1', {})).rejects.toThrow(
        AppError
      );
    });
  });

  describe('removeLiveProduct', () => {
    it('should remove product when owned', async () => {
      (mockPrisma.liveProduct.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (mockPrisma.liveProduct.delete as jest.Mock).mockResolvedValue(mockProduct);
      await expect(liveService.removeLiveProduct('prod-1', 'biz-1')).resolves.not.toThrow();
    });

    it('should throw when not found', async () => {
      (mockPrisma.liveProduct.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(liveService.removeLiveProduct('nonexistent', 'biz-1')).rejects.toThrow(AppError);
    });
  });

  describe('joinLive', () => {
    it('should add participant and increment counts', async () => {
      (mockPrisma.liveParticipant.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.liveParticipant.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.live.update as jest.Mock).mockResolvedValue(mockLive);

      await liveService.joinLive('live-1', 'user-1', 'User');
      expect(mockPrisma.liveParticipant.create).toHaveBeenCalled();
      expect(mockPrisma.live.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { viewerCount: { increment: 1 }, viewerCountPeak: { increment: 1 } },
        })
      );
    });

    it('should not duplicate active participant', async () => {
      (mockPrisma.liveParticipant.findFirst as jest.Mock).mockResolvedValue({
        id: 'part-1',
        liveId: 'live-1',
        userId: 'user-1',
        isActive: true,
      });
      await liveService.joinLive('live-1', 'user-1');
      expect(mockPrisma.liveParticipant.create).not.toHaveBeenCalled();
    });
  });

  describe('leaveLive', () => {
    it('should mark participant inactive and decrement count', async () => {
      (mockPrisma.liveParticipant.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (mockPrisma.live.findUnique as jest.Mock).mockResolvedValue({ viewerCount: 10 });
      (mockPrisma.live.update as jest.Mock).mockResolvedValue(mockLive);

      await liveService.leaveLive('live-1', 'user-1');
      expect(mockPrisma.liveParticipant.updateMany).toHaveBeenCalled();
      expect(mockPrisma.live.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { viewerCount: { decrement: 1 } } })
      );
    });
  });

  describe('sendChat', () => {
    it('should create chat message', async () => {
      const mockChat = {
        id: 'chat-1',
        liveId: 'live-1',
        userId: 'user-1',
        userName: 'User',
        message: 'Bonjour !',
        createdAt: new Date(),
      };
      (mockPrisma.liveChat.create as jest.Mock).mockResolvedValue(mockChat);

      const result = await liveService.sendChat('live-1', 'user-1', 'User', 'Bonjour !');
      expect(result!.message).toBe('Bonjour !');
    });
  });

  describe('sendReaction', () => {
    it('should create reaction', async () => {
      const mockReaction = {
        id: 'reaction-1',
        liveId: 'live-1',
        userId: 'user-1',
        emoji: '❤️',
        createdAt: new Date(),
      };
      (mockPrisma.liveReaction.create as jest.Mock).mockResolvedValue(mockReaction);

      const result = await liveService.sendReaction('live-1', 'user-1', '❤️');
      expect(result!.emoji).toBe('❤️');
    });
  });

  describe('getLiveChats', () => {
    it('should return recent chats', async () => {
      const mockChats = [
        {
          id: 'chat-1',
          liveId: 'live-1',
          userId: 'user-1',
          userName: 'User',
          message: 'Salut',
          createdAt: new Date(),
        },
      ];
      (mockPrisma.liveChat.findMany as jest.Mock).mockResolvedValue(mockChats);

      const result = await liveService.getLiveChats('live-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getLiveStats', () => {
    it('should return aggregated stats', async () => {
      (mockPrisma.live.count as jest.Mock).mockResolvedValueOnce(5);
      (mockPrisma.live.count as jest.Mock).mockResolvedValueOnce(2);
      (mockPrisma.live.aggregate as jest.Mock).mockResolvedValue({
        _sum: { viewerCountPeak: 100 },
      });
      (mockPrisma.liveChat.count as jest.Mock).mockResolvedValue(50);

      const result = await liveService.getLiveStats('biz-1');
      expect(result!.totalLives).toBe(5);
      expect(result!.activeLives).toBe(2);
      expect(result!.totalViewers).toBe(100);
      expect(result!.totalChats).toBe(50);
    });
  });
});
