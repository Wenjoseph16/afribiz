import { mockPrisma } from '../setup';
import {
  createComment,
  getComments,
  getCommentById,
  deleteComment,
  countComments,
} from '../../services/commentService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockComment = {
  id: 'cmt-1',
  userId: 'u1',
  type: 'PRODUCT',
  referenceId: 'prod-1',
  content: 'Super produit!',
  createdAt: new Date(),
  user: { id: 'u1', firstName: 'Jean', lastName: 'Kone', avatar: null },
};

describe('Comment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createComment creates comment', async () => {
    jest.spyOn(mockPrisma.comment, 'create').mockResolvedValue(mockComment as any);
    const r = await createComment({
      userId: 'u1',
      type: 'PRODUCT',
      referenceId: 'prod-1',
      content: 'Super produit!',
    });
    expect(r.id).toBe('cmt-1');
  });

  test('getComments returns paginated', async () => {
    jest.spyOn(mockPrisma.comment, 'findMany').mockResolvedValue([mockComment as any]);
    jest.spyOn(mockPrisma.comment, 'count').mockResolvedValue(1);
    const r = await getComments('PRODUCT', 'prod-1');
    expect(r.pagination.total).toBe(1);
  });

  test('getCommentById returns comment', async () => {
    jest.spyOn(mockPrisma.comment, 'findUnique').mockResolvedValue(mockComment as any);
    const r = await getCommentById('cmt-1');
    expect(r!.id).toBe('cmt-1');
  });

  test('deleteComment soft-deletes', async () => {
    jest.spyOn(mockPrisma.comment, 'findUnique').mockResolvedValue(mockComment as any);
    jest.spyOn(mockPrisma.comment, 'delete').mockResolvedValue(mockComment as any);
    await deleteComment('cmt-1', 'u1');
    expect(mockPrisma.comment.delete).toHaveBeenCalled();
  });

  test('countComments returns count', async () => {
    jest.spyOn(mockPrisma.comment, 'count').mockResolvedValue(5);
    const r = await countComments('PRODUCT', 'prod-1');
    expect(r).toBe(5);
  });
});
