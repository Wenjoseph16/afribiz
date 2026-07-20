import { mockPrisma } from '../setup';
import {
  getShorts,
  getShortById,
  createShort,
  updateShort,
  deleteShort,
  likeShort,
  addComment,
  getComments,
  viewShort,
  shareShort,
  saveShort,
} from '../../services/shortService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockShort = {
  id: 'short-1',
  businessId: 'b1',
  title: 'Mon short',
  videoUrl: 'vid.mp4',
  thumbnailUrl: 'thumb.jpg',
  duration: 30,
  isActive: true,
  viewsCount: 0,
  likesCount: 0,
  commentsCount: 0,
  sharesCount: 0,
  createdAt: new Date(),
  likes: [],
  comments: [],
  views: [],
  business: { id: 'b1', name: 'Biz', slug: 'biz', logo: null, type: 'RESTAURANT', city: 'Abidjan' },
  _count: { likes: 0, comments: 0, views: 0 },
};

describe('Short Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getShorts returns paginated', async () => {
    jest.spyOn(mockPrisma.short, 'findMany').mockResolvedValue([mockShort as any]);
    jest.spyOn(mockPrisma.short, 'count').mockResolvedValue(1);
    const r = await getShorts({});
    expect(r.items).toHaveLength(1);
  });

  test('getShortById returns short with like status', async () => {
    jest.spyOn(mockPrisma.short, 'findUnique').mockResolvedValue(mockShort as any);
    jest.spyOn(mockPrisma.shortLike, 'findUnique').mockResolvedValue(null);
    const r = await getShortById('short-1', 'u1');
    expect(r?.isLiked).toBe(false);
  });

  test('createShort creates and adds to feed', async () => {
    jest.spyOn(mockPrisma.short, 'create').mockResolvedValue(mockShort as any);
    jest.spyOn(mockPrisma.feedItem, 'create').mockResolvedValue({} as any);
    const r = await createShort({ businessId: 'b1', videoUrl: 'vid.mp4', title: 'Mon short' });
    expect(r.id).toBe('short-1');
  });

  test('updateShort updates existing', async () => {
    jest.spyOn(mockPrisma.short, 'findFirst').mockResolvedValue(mockShort as any);
    jest
      .spyOn(mockPrisma.short, 'update')
      .mockResolvedValue({ ...mockShort, title: 'Updated' } as any);
    const r = await updateShort('short-1', 'b1', { title: 'Updated' });
    expect(r.title).toBe('Updated');
  });

  test('deleteShort deletes existing', async () => {
    jest.spyOn(mockPrisma.short, 'findFirst').mockResolvedValue(mockShort as any);
    jest.spyOn(mockPrisma.short, 'delete').mockResolvedValue(mockShort as any);
    await expect(deleteShort('short-1', 'b1')).resolves.not.toThrow();
  });

  describe('likeShort', () => {
    test('likes a short', async () => {
      jest.spyOn(mockPrisma.shortLike, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.shortLike, 'create').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.short, 'update').mockResolvedValue(mockShort as any);
      const r = await likeShort('short-1', 'u1');
      expect(r.liked).toBe(true);
    });
    test('unlikes a short', async () => {
      jest
        .spyOn(mockPrisma.shortLike, 'findUnique')
        .mockResolvedValue({ id: 'l1', shortId: 'short-1', userId: 'u1' } as any);
      jest.spyOn(mockPrisma.shortLike, 'delete').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.short, 'update').mockResolvedValue(mockShort as any);
      const r = await likeShort('short-1', 'u1');
      expect(r.liked).toBe(false);
    });
  });

  test('addComment adds and increments', async () => {
    jest.spyOn(mockPrisma.shortComment, 'create').mockResolvedValue({
      id: 'c1',
      shortId: 'short-1',
      userId: 'u1',
      userName: 'Jean',
      content: 'Super!',
    } as any);
    jest.spyOn(mockPrisma.short, 'update').mockResolvedValue(mockShort as any);
    const r = await addComment('short-1', 'u1', 'Jean', 'Super!');
    expect(r.content).toBe('Super!');
  });

  test('getComments returns paginated', async () => {
    jest.spyOn(mockPrisma.shortComment, 'findMany').mockResolvedValue([
      {
        id: 'c1',
        shortId: 'short-1',
        userId: 'u1',
        userName: 'Jean',
        content: 'Super!',
        createdAt: new Date(),
      } as any,
    ]);
    jest.spyOn(mockPrisma.shortComment, 'count').mockResolvedValue(1);
    const r = await getComments('short-1');
    expect(r.items).toHaveLength(1);
  });

  test('viewShort records view', async () => {
    jest.spyOn(mockPrisma.shortView, 'findUnique').mockResolvedValue(null);
    jest.spyOn(mockPrisma.shortView, 'create').mockResolvedValue({} as any);
    jest.spyOn(mockPrisma.short, 'update').mockResolvedValue(mockShort as any);
    await expect(viewShort('short-1', 'u1')).resolves.not.toThrow();
  });

  test('shareShort increments shares', async () => {
    jest.spyOn(mockPrisma.short, 'update').mockResolvedValue(mockShort as any);
    await expect(shareShort('short-1')).resolves.not.toThrow();
  });

  test('saveShort toggles save', async () => {
    jest.spyOn(mockPrisma.shortSave, 'findUnique').mockResolvedValue(null);
    jest.spyOn(mockPrisma.shortSave, 'create').mockResolvedValue({} as any);
    const r = await saveShort('short-1', 'u1');
    expect(r.saved).toBe(true);
  });
});
