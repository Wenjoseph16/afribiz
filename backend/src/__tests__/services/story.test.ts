import { mockPrisma } from '../setup';
import * as storyService from '../../services/storyService';
import { AppError } from '../../middlewares/errorHandler';

const mockBusiness = {
  id: 'biz-1',
  name: 'Test Business',
  slug: 'test-biz',
  logo: null,
  type: 'RESTAURANT',
};
const mockStory = {
  id: 'story-1',
  businessId: 'biz-1',
  mediaType: 'IMAGE',
  mediaUrl: 'https://example.com/img.jpg',
  caption: 'Super offre !',
  linkTargetType: 'PRODUCT',
  linkTargetId: 'prod-1',
  linkUrl: null,
  isActive: true,
  expiresAt: new Date(Date.now() + 86400000),
  viewsCount: 0,
  clicksCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  business: mockBusiness,
  views: [],
};

describe('StoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveStories', () => {
    it('should return active stories grouped by business', async () => {
      (mockPrisma.story.findMany as jest.Mock).mockResolvedValue([mockStory]);
      const result = await storyService.getActiveStories();
      expect(result).toHaveLength(1);
      expect(result[0].business.name).toBe('Test Business');
      expect(result[0].stories).toHaveLength(1);
    });

    it('should return empty array when no active stories', async () => {
      (mockPrisma.story.findMany as jest.Mock).mockResolvedValue([]);
      const result = await storyService.getActiveStories();
      expect(result).toHaveLength(0);
    });

    it('should filter by expiry date', async () => {
      (mockPrisma.story.findMany as jest.Mock).mockResolvedValue([]);
      await storyService.getActiveStories();
      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            expiresAt: { gte: expect.any(Date) },
          }),
        })
      );
    });
  });

  describe('getBusinessStories', () => {
    it('should return stories for a specific business', async () => {
      (mockPrisma.story.findMany as jest.Mock).mockResolvedValue([mockStory]);
      const result = await storyService.getBusinessStories('biz-1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ businessId: 'biz-1' }),
        })
      );
    });

    it('should include user view status when userId provided', async () => {
      (mockPrisma.story.findMany as jest.Mock).mockResolvedValue([]);
      await storyService.getBusinessStories('biz-1', 'user-1');
      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            views: { where: { userId: 'user-1' } },
          }),
        })
      );
    });
  });

  describe('createStory', () => {
    const createInput = {
      businessId: 'biz-1',
      mediaType: 'IMAGE' as const,
      mediaUrl: 'https://example.com/img.jpg',
      caption: 'Super offre !',
      linkTargetType: 'PRODUCT',
      linkTargetId: 'prod-1',
    };

    it('should create a story and feed item', async () => {
      (mockPrisma.story.create as jest.Mock).mockResolvedValue(mockStory);
      (mockPrisma.feedItem.create as jest.Mock).mockResolvedValue({ id: 'feed-1' });

      const result = await storyService.createStory(createInput);
      expect(result).toEqual(mockStory);
      expect(mockPrisma.story.create).toHaveBeenCalled();
      expect(mockPrisma.feedItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            businessId: 'biz-1',
            type: 'STORY',
            referenceId: 'story-1',
          }),
        })
      );
    });

    it('should default expiresInHours to 24', async () => {
      (mockPrisma.story.create as jest.Mock).mockResolvedValue(mockStory);
      (mockPrisma.feedItem.create as jest.Mock).mockResolvedValue({ id: 'feed-1' });

      await storyService.createStory(createInput);
      const callData = (mockPrisma.story.create as jest.Mock).mock.calls[0][0].data;
      const expiresAt = callData.expiresAt;
      const expected = new Date();
      expected.setHours(expected.getHours() + 24);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + 82800000);
    });

    it('should use custom expiresInHours when provided', async () => {
      (mockPrisma.story.create as jest.Mock).mockResolvedValue(mockStory);
      (mockPrisma.feedItem.create as jest.Mock).mockResolvedValue({ id: 'feed-1' });

      await storyService.createStory({ ...createInput, expiresInHours: 48 });
      const callData = (mockPrisma.story.create as jest.Mock).mock.calls[0][0].data;
      const expiresAt = callData.expiresAt;
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + 169200000);
    });
  });

  describe('viewStory', () => {
    it('should create a view if not existing', async () => {
      (mockPrisma.storyView.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.storyView.create as jest.Mock).mockResolvedValue({ id: 'view-1' });
      (mockPrisma.story.update as jest.Mock).mockResolvedValue(mockStory);

      await storyService.viewStory('story-1', 'user-1');
      expect(mockPrisma.storyView.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { storyId: 'story-1', userId: 'user-1', visitorId: undefined },
        })
      );
      expect(mockPrisma.story.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'story-1' },
          data: { viewsCount: { increment: 1 } },
        })
      );
    });

    it('should not create duplicate view', async () => {
      (mockPrisma.storyView.findFirst as jest.Mock).mockResolvedValue({ id: 'view-1' });

      await storyService.viewStory('story-1', 'user-1');
      expect(mockPrisma.storyView.create).not.toHaveBeenCalled();
      expect(mockPrisma.story.update).not.toHaveBeenCalled();
    });

    it('should do nothing if no userId and no visitorId', async () => {
      await storyService.viewStory('story-1');
      expect(mockPrisma.storyView.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('recordStoryClick', () => {
    it('should increment clicksCount', async () => {
      (mockPrisma.story.update as jest.Mock).mockResolvedValue(mockStory);
      await storyService.recordStoryClick('story-1');
      expect(mockPrisma.story.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'story-1' },
          data: { clicksCount: { increment: 1 } },
        })
      );
    });
  });

  describe('deleteStory', () => {
    it('should delete story if owner matches', async () => {
      (mockPrisma.story.findFirst as jest.Mock).mockResolvedValue(mockStory);
      (mockPrisma.story.delete as jest.Mock).mockResolvedValue(mockStory);

      await storyService.deleteStory('story-1', 'biz-1');
      expect(mockPrisma.story.delete).toHaveBeenCalledWith({ where: { id: 'story-1' } });
    });

    it('should throw if story not found for this business', async () => {
      (mockPrisma.story.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(storyService.deleteStory('story-1', 'biz-2')).rejects.toThrow(AppError);
    });
  });

  describe('getFeedItems', () => {
    it('should return paginated feed items', async () => {
      (mockPrisma.feedItem.findMany as jest.Mock).mockResolvedValue([
        { id: 'feed-1', business: mockBusiness },
      ]);
      (mockPrisma.feedItem.count as jest.Mock).mockResolvedValue(1);

      const result = await storyService.getFeedItems({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by types', async () => {
      (mockPrisma.feedItem.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.feedItem.count as jest.Mock).mockResolvedValue(0);

      await storyService.getFeedItems({ types: ['STORY', 'PROMOTION'] });
      expect(mockPrisma.feedItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: { in: ['STORY', 'PROMOTION'] } }),
        })
      );
    });

    it('should filter by businessId', async () => {
      (mockPrisma.feedItem.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.feedItem.count as jest.Mock).mockResolvedValue(0);

      await storyService.getFeedItems({ businessId: 'biz-1' });
      expect(mockPrisma.feedItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ businessId: 'biz-1' }),
        })
      );
    });
  });

  describe('createFeedItem', () => {
    it('should create a feed item', async () => {
      const mockItem = { id: 'feed-1', business: mockBusiness };
      (mockPrisma.feedItem.create as jest.Mock).mockResolvedValue(mockItem);

      const result = await storyService.createFeedItem({
        businessId: 'biz-1',
        type: 'PROMOTION',
        title: 'Super promo',
      });
      expect(result).toEqual(mockItem);
      expect(mockPrisma.feedItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            businessId: 'biz-1',
            type: 'PROMOTION',
            title: 'Super promo',
          }),
        })
      );
    });
  });

  describe('deleteFeedItem', () => {
    it('should delete feed item if owner matches', async () => {
      (mockPrisma.feedItem.findFirst as jest.Mock).mockResolvedValue({
        id: 'feed-1',
        businessId: 'biz-1',
      });
      (mockPrisma.feedItem.delete as jest.Mock).mockResolvedValue({});

      await storyService.deleteFeedItem('feed-1', 'biz-1');
      expect(mockPrisma.feedItem.delete).toHaveBeenCalledWith({ where: { id: 'feed-1' } });
    });

    it('should throw if feed item not found', async () => {
      (mockPrisma.feedItem.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(storyService.deleteFeedItem('feed-1', 'biz-2')).rejects.toThrow(AppError);
    });
  });

  describe('expireOldStories', () => {
    it('should deactivate expired stories', async () => {
      (mockPrisma.story.updateMany as jest.Mock).mockResolvedValue({ count: 3 });
      const result = await storyService.expireOldStories();
      expect(result).toBe(3);
      expect(mockPrisma.story.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ expiresAt: { lt: expect.any(Date) }, isActive: true }),
          data: { isActive: false },
        })
      );
    });
  });

  describe('expireOldFeedItems', () => {
    it('should deactivate expired feed items', async () => {
      (mockPrisma.feedItem.updateMany as jest.Mock).mockResolvedValue({ count: 5 });
      const result = await storyService.expireOldFeedItems();
      expect(result).toBe(5);
    });
  });
});
