import { mockPrisma } from '../setup';
import {
  getActiveStories,
  getBusinessStories,
  createStory,
  updateStory,
  addStorySticker,
  removeStorySticker,
  getBusinessHighlights,
  viewStory,
  recordStoryClick,
  deleteStory,
  getFeedItems,
  createFeedItem,
  deleteFeedItem,
  expireOldStories,
  expireOldFeedItems,
} from '../../services/storyService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBusiness = {
  id: 'b1',
  name: 'Biz',
  slug: 'biz',
  logo: null,
  type: 'RESTAURANT',
  isActive: true,
  isVerified: true,
};
const mockStory = {
  id: 'story-1',
  businessId: 'b1',
  mediaType: 'IMAGE',
  mediaUrl: 'img.jpg',
  caption: 'Ma story',
  isActive: true,
  isHighlight: false,
  viewsCount: 0,
  clicksCount: 0,
  stickers: [],
  expiresAt: new Date(Date.now() + 86400000),
  createdAt: new Date(),
  updatedAt: new Date(),
  business: mockBusiness,
  views: [],
};

describe('Story Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getActiveStories returns grouped stories', async () => {
    jest.spyOn(mockPrisma.story, 'findMany').mockResolvedValue([mockStory as any]);
    const r = await getActiveStories();
    expect(r).toBeDefined();
  });

  test('getActiveStories with userId returns viewed status', async () => {
    jest
      .spyOn(mockPrisma.story, 'findMany')
      .mockResolvedValue([{ ...mockStory, views: [] } as any]);
    const r = await getActiveStories('u1');
    expect(r).toBeDefined();
  });

  test('getBusinessStories returns business stories', async () => {
    jest.spyOn(mockPrisma.story, 'findMany').mockResolvedValue([mockStory as any]);
    const r = await getBusinessStories('b1');
    expect(r).toHaveLength(1);
  });

  test('createStory creates story and feed item', async () => {
    jest.spyOn(mockPrisma.story, 'create').mockResolvedValue(mockStory as any);
    jest.spyOn(mockPrisma.feedItem, 'create').mockResolvedValue({} as any);
    const r = await createStory({
      businessId: 'b1',
      mediaType: 'IMAGE',
      mediaUrl: 'img.jpg',
      caption: 'Ma story',
    });
    expect(r.id).toBe('story-1');
  });

  test('updateStory updates fields', async () => {
    jest.spyOn(mockPrisma.story, 'findFirst').mockResolvedValue(mockStory as any);
    jest
      .spyOn(mockPrisma.story, 'update')
      .mockResolvedValue({ ...mockStory, caption: 'Updated' } as any);
    const r = await updateStory('story-1', 'b1', { caption: 'Updated' });
    expect(r!.caption).toBe('Updated');
  });

  test('updateStory throws if not found', async () => {
    jest.spyOn(mockPrisma.story, 'findFirst').mockResolvedValue(null);
    await expect(updateStory('story-x', 'b1', { caption: 'Test' })).rejects.toThrow(
      'Story non trouvée'
    );
  });

  test('viewStory records view', async () => {
    jest.spyOn(mockPrisma.storyView, 'findUnique').mockResolvedValue(null);
    jest.spyOn(mockPrisma.storyView, 'create').mockResolvedValue({} as any);
    jest.spyOn(mockPrisma.story, 'update').mockResolvedValue(mockStory as any);
    await expect(viewStory('story-1', 'u1')).resolves.not.toThrow();
  });

  test('viewStory skips without userId or visitorId', async () => {
    await expect(viewStory('story-1')).resolves.not.toThrow();
  });

  test('recordStoryClick increments clicks', async () => {
    jest.spyOn(mockPrisma.story, 'update').mockResolvedValue(mockStory as any);
    await expect(recordStoryClick('story-1')).resolves.not.toThrow();
  });

  test('deleteStory deletes existing', async () => {
    jest.spyOn(mockPrisma.story, 'findFirst').mockResolvedValue(mockStory as any);
    jest.spyOn(mockPrisma.story, 'delete').mockResolvedValue(mockStory as any);
    await expect(deleteStory('story-1', 'b1')).resolves.not.toThrow();
  });

  test('getBusinessHighlights returns highlight stories', async () => {
    jest
      .spyOn(mockPrisma.story, 'findMany')
      .mockResolvedValue([{ ...mockStory, isHighlight: true } as any]);
    const r = await getBusinessHighlights('b1');
    expect(r).toHaveLength(1);
  });

  test('addStorySticker adds sticker', async () => {
    const sticker = {
      id: 's1',
      type: 'LINK' as const,
      label: 'Shop',
      value: 'https://shop.com',
      positionX: 50,
      positionY: 50,
    };
    jest.spyOn(mockPrisma.story, 'findFirst').mockResolvedValue(mockStory as any);
    jest
      .spyOn(mockPrisma.story, 'update')
      .mockResolvedValue({ ...mockStory, stickers: [sticker] } as any);
    const r = await addStorySticker('story-1', 'b1', sticker);
    expect(r).toBeDefined();
  });

  test('createFeedItem creates feed item', async () => {
    jest.spyOn(mockPrisma.feedItem, 'create').mockResolvedValue({
      id: 'fi-1',
      businessId: 'b1',
      type: 'STORY',
      referenceId: 'story-1',
    } as any);
    const r = await createFeedItem({ businessId: 'b1', type: 'STORY', referenceId: 'story-1' });
    expect(r.id).toBe('fi-1');
  });

  test('expireOldStories batch updates', async () => {
    jest.spyOn(mockPrisma.story, 'updateMany').mockResolvedValue({ count: 3 } as any);
    await expect(expireOldStories()).resolves.not.toThrow();
  });
});
