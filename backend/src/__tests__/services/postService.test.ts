import { mockPrisma } from '../setup';
import {
  createPost,
  updatePost,
  deletePost,
  getPost,
  listPosts,
  toggleLike,
  getFeed,
} from '../../services/postService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockPost = {
  id: 'post-1',
  businessId: 'b1',
  authorId: 'u1',
  title: 'Mon article',
  content: 'Contenu',
  status: 'PUBLISHED',
  isPinned: false,
  viewsCount: 0,
  likesCount: 0,
  commentsCount: 0,
  tags: [],
  images: [],
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  author: { id: 'u1', firstName: 'Jean', lastName: 'Dupont', avatar: null },
  business: { id: 'b1', name: 'Biz', slug: 'biz', logo: null },
  _count: { likes: 0, comments: 0 },
};

describe('Post Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createPost creates with default status', async () => {
    jest.spyOn(mockPrisma.post, 'create').mockResolvedValue(mockPost as any);
    const r = await createPost('u1', 'b1', { content: 'Contenu' });
    expect(r.id).toBe('post-1');
  });

  test('createPost creates as DRAFT', async () => {
    jest
      .spyOn(mockPrisma.post, 'create')
      .mockResolvedValue({ ...mockPost, status: 'DRAFT', publishedAt: null } as any);
    const r = await createPost('u1', 'b1', { content: 'Brouillon', status: 'DRAFT' });
    expect(r.status).toBe('DRAFT');
  });

  test('updatePost updates existing', async () => {
    jest.spyOn(mockPrisma.post, 'findFirst').mockResolvedValue(mockPost as any);
    jest
      .spyOn(mockPrisma.post, 'update')
      .mockResolvedValue({ ...mockPost, title: 'Mis à jour' } as any);
    const r = await updatePost('u1', 'post-1', { title: 'Mis à jour' });
    expect(r.title).toBe('Mis à jour');
  });

  test('updatePost throws if not found', async () => {
    jest.spyOn(mockPrisma.post, 'findFirst').mockResolvedValue(null);
    await expect(updatePost('u1', 'post-x', { title: 'Test' })).rejects.toThrow('Post non trouvé');
  });

  test('deletePost soft-deletes', async () => {
    jest.spyOn(mockPrisma.post, 'findFirst').mockResolvedValue(mockPost as any);
    jest
      .spyOn(mockPrisma.post, 'update')
      .mockResolvedValue({ ...mockPost, deletedAt: new Date(), status: 'ARCHIVED' } as any);
    await expect(deletePost('u1', 'post-1')).resolves.not.toThrow();
  });

  test('getPost returns post and increments view', async () => {
    jest.spyOn(mockPrisma.post, 'findFirst').mockResolvedValue(mockPost as any);
    jest.spyOn(mockPrisma.post, 'update').mockResolvedValue(mockPost as any);
    const r = await getPost('post-1');
    expect(r.id).toBe('post-1');
  });

  test('listPosts returns paginated posts', async () => {
    jest.spyOn(mockPrisma.post, 'findMany').mockResolvedValue([mockPost as any]);
    jest.spyOn(mockPrisma.post, 'count').mockResolvedValue(1);
    const r = await listPosts('b1', {});
    expect(r.posts).toHaveLength(1);
    expect(r.total).toBe(1);
  });

  describe('toggleLike', () => {
    test('likes a post', async () => {
      jest.spyOn(mockPrisma.post, 'findFirst').mockResolvedValue(mockPost as any);
      jest.spyOn(mockPrisma.postLike, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.postLike, 'create').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.post, 'update').mockResolvedValue(mockPost as any);
      const r = await toggleLike('u1', 'post-1');
      expect(r.liked).toBe(true);
    });

    test('unlikes a post', async () => {
      jest.spyOn(mockPrisma.post, 'findFirst').mockResolvedValue(mockPost as any);
      jest
        .spyOn(mockPrisma.postLike, 'findUnique')
        .mockResolvedValue({ id: 'like-1', postId: 'post-1', userId: 'u1' } as any);
      jest.spyOn(mockPrisma.postLike, 'delete').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.post, 'update').mockResolvedValue(mockPost as any);
      const r = await toggleLike('u1', 'post-1');
      expect(r.liked).toBe(false);
    });
  });

  test('getFeed returns published posts', async () => {
    jest.spyOn(mockPrisma.post, 'findMany').mockResolvedValue([mockPost as any]);
    jest.spyOn(mockPrisma.post, 'count').mockResolvedValue(1);
    const r = await getFeed({});
    expect(r.posts).toHaveLength(1);
  });
});
