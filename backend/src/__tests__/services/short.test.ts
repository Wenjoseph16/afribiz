import { mockPrisma } from '../setup';
import * as shortService from '../../services/shortService';
import { AppError } from '../../middlewares/errorHandler';

const mockBusiness = {
  id: 'biz-1',
  name: 'Biz',
  slug: 'biz',
  logo: null,
  type: 'SHOP',
  city: 'Abidjan',
};
const mockShort = {
  id: 'short-1',
  businessId: 'biz-1',
  title: 'Mon short',
  description: 'Description',
  videoUrl: 'https://example.com/vid.mp4',
  thumbnailUrl: null,
  duration: 30,
  linkTargetType: 'PRODUCT',
  linkTargetId: 'prod-1',
  linkUrl: null,
  isActive: true,
  likesCount: 5,
  viewsCount: 10,
  sharesCount: 2,
  commentsCount: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  business: mockBusiness,
  comments: [],
  _count: { likes: 5, comments: 1, views: 10 },
};

describe('ShortService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getShorts', () => {
    it('should return paginated shorts', async () => {
      (mockPrisma.short.findMany as jest.Mock).mockResolvedValue([mockShort]);
      (mockPrisma.short.count as jest.Mock).mockResolvedValue(1);
      const result = await shortService.getShorts();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by businessId', async () => {
      (mockPrisma.short.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.short.count as jest.Mock).mockResolvedValue(0);
      await shortService.getShorts({ businessId: 'biz-1' });
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ businessId: 'biz-1' }) })
      );
    });

    it('should return empty when no shorts', async () => {
      (mockPrisma.short.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.short.count as jest.Mock).mockResolvedValue(0);
      const result = await shortService.getShorts();
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getShortById', () => {
    it('should return short with details', async () => {
      (mockPrisma.short.findUnique as jest.Mock).mockResolvedValue(mockShort);
      const result = await shortService.getShortById('short-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('short-1');
    });

    it('should return null when not found', async () => {
      (mockPrisma.short.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await shortService.getShortById('nonexistent');
      expect(result).toBeNull();
    });

    it('should resolve isLiked when userId provided', async () => {
      (mockPrisma.short.findUnique as jest.Mock).mockResolvedValue(mockShort);
      (mockPrisma.shortLike.findUnique as jest.Mock).mockResolvedValue({
        id: 'like-1',
        shortId: 'short-1',
        userId: 'user-1',
      });
      const result = await shortService.getShortById('short-1', 'user-1');
      expect(result!.isLiked).toBe(true);
    });
  });

  describe('createShort', () => {
    it('should create short and feed item', async () => {
      (mockPrisma.short.create as jest.Mock).mockResolvedValue(mockShort);
      (mockPrisma.feedItem.create as jest.Mock).mockResolvedValue({});

      const result = await shortService.createShort({
        businessId: 'biz-1',
        title: 'Mon short',
        videoUrl: 'https://example.com/vid.mp4',
        linkTargetType: 'PRODUCT',
      });

      expect(result.id).toBe('short-1');
      expect(mockPrisma.feedItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'SHORT', referenceId: 'short-1' }),
        })
      );
    });
  });

  describe('updateShort', () => {
    it('should update short when owned', async () => {
      (mockPrisma.short.findFirst as jest.Mock).mockResolvedValue(mockShort);
      (mockPrisma.short.update as jest.Mock).mockResolvedValue({ ...mockShort, title: 'Updated' });

      const result = await shortService.updateShort('short-1', 'biz-1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('should throw when not found', async () => {
      (mockPrisma.short.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(shortService.updateShort('nonexistent', 'biz-1', {})).rejects.toThrow(AppError);
    });
  });

  describe('deleteShort', () => {
    it('should delete short when owned', async () => {
      (mockPrisma.short.findFirst as jest.Mock).mockResolvedValue(mockShort);
      (mockPrisma.short.delete as jest.Mock).mockResolvedValue(mockShort);
      await expect(shortService.deleteShort('short-1', 'biz-1')).resolves.not.toThrow();
    });

    it('should throw when not owned', async () => {
      (mockPrisma.short.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(shortService.deleteShort('short-1', 'other-biz')).rejects.toThrow(AppError);
    });
  });

  describe('likeShort', () => {
    it('should like when not already liked', async () => {
      (mockPrisma.shortLike.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.shortLike.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.short.update as jest.Mock).mockResolvedValue(mockShort);

      const result = await shortService.likeShort('short-1', 'user-1');
      expect(result.liked).toBe(true);
      expect(mockPrisma.short.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { likesCount: { increment: 1 } } })
      );
    });

    it('should unlike when already liked', async () => {
      (mockPrisma.shortLike.findUnique as jest.Mock).mockResolvedValue({
        id: 'like-1',
        shortId: 'short-1',
        userId: 'user-1',
      });
      (mockPrisma.shortLike.delete as jest.Mock).mockResolvedValue({});
      (mockPrisma.short.update as jest.Mock).mockResolvedValue(mockShort);

      const result = await shortService.likeShort('short-1', 'user-1');
      expect(result.liked).toBe(false);
      expect(mockPrisma.short.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { likesCount: { decrement: 1 } } })
      );
    });
  });

  describe('addComment', () => {
    it('should create comment and increment count', async () => {
      const mockComment = {
        id: 'comment-1',
        shortId: 'short-1',
        userId: 'user-1',
        userName: 'User',
        content: 'Super !',
        createdAt: new Date(),
      };
      (mockPrisma.shortComment.create as jest.Mock).mockResolvedValue(mockComment);
      (mockPrisma.short.update as jest.Mock).mockResolvedValue(mockShort);

      const result = await shortService.addComment('short-1', 'user-1', 'User', 'Super !');
      expect(result.content).toBe('Super !');
      expect(mockPrisma.short.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { commentsCount: { increment: 1 } } })
      );
    });
  });

  describe('getComments', () => {
    it('should return paginated comments', async () => {
      const mockComments = [
        {
          id: 'c1',
          shortId: 'short-1',
          userId: 'user-1',
          userName: 'User',
          content: 'Top !',
          createdAt: new Date(),
        },
      ];
      (mockPrisma.shortComment.findMany as jest.Mock).mockResolvedValue(mockComments);
      (mockPrisma.shortComment.count as jest.Mock).mockResolvedValue(1);

      const result = await shortService.getComments('short-1');
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('viewShort', () => {
    it('should record view for authenticated user', async () => {
      (mockPrisma.shortView.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.shortView.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.short.update as jest.Mock).mockResolvedValue(mockShort);

      await shortService.viewShort('short-1', 'user-1');
      expect(mockPrisma.shortView.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) })
      );
    });

    it('should not double-count views for same user', async () => {
      (mockPrisma.shortView.findUnique as jest.Mock).mockResolvedValue({
        id: 'view-1',
        shortId: 'short-1',
        userId: 'user-1',
      });

      await shortService.viewShort('short-1', 'user-1');
      expect(mockPrisma.shortView.create).not.toHaveBeenCalled();
    });

    it('should record view for visitor', async () => {
      (mockPrisma.shortView.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.short.update as jest.Mock).mockResolvedValue(mockShort);

      await shortService.viewShort('short-1', undefined, 'visitor-ip');
      expect(mockPrisma.shortView.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ visitorId: 'visitor-ip' }) })
      );
    });
  });

  describe('shareShort', () => {
    it('should increment shares count', async () => {
      (mockPrisma.short.update as jest.Mock).mockResolvedValue(mockShort);
      await shortService.shareShort('short-1');
      expect(mockPrisma.short.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { sharesCount: { increment: 1 } } })
      );
    });
  });

  describe('saveShort', () => {
    it('should save when not already saved', async () => {
      (mockPrisma.shortSave.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.shortSave.create as jest.Mock).mockResolvedValue({});

      const result = await shortService.saveShort('short-1', 'user-1');
      expect(result.saved).toBe(true);
    });

    it('should unsave when already saved', async () => {
      (mockPrisma.shortSave.findUnique as jest.Mock).mockResolvedValue({
        id: 'save-1',
        shortId: 'short-1',
        userId: 'user-1',
      });
      (mockPrisma.shortSave.delete as jest.Mock).mockResolvedValue({});

      const result = await shortService.saveShort('short-1', 'user-1');
      expect(result.saved).toBe(false);
    });
  });
});
