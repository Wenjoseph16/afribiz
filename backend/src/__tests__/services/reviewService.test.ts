import { mockPrisma } from '../setup';
import { createReview, updateReview, getReviews } from '../../services/reviewService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({ publishReviewPublished: jest.fn() }));

const mRev = {
  id: 'rev-1',
  userId: 'u1',
  productId: 'prod-1',
  rating: 4,
  title: 'Super',
  comment: 'Excellent',
  images: [],
  isActive: true,
  createdAt: new Date(),
};

describe('Review Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('createReview creates product review', async () => {
    jest.spyOn(mockPrisma.review, 'findFirst').mockResolvedValue(null);
    jest.spyOn(mockPrisma.review, 'create').mockResolvedValue(mRev);
    jest
      .spyOn(mockPrisma.review, 'aggregate')
      .mockResolvedValue({ _avg: { rating: 4 }, _count: 1 });
    jest.spyOn(mockPrisma.product, 'update').mockResolvedValue({});
    const r = await createReview('u1', { productId: 'prod-1', rating: 4, title: 'Super' });
    expect(r.id).toBe('rev-1');
  });
  test('createReview rejects duplicate', async () => {
    jest.spyOn(mockPrisma.review, 'findFirst').mockResolvedValue(mRev);
    await expect(createReview('u1', { productId: 'prod-1', rating: 4 })).rejects.toThrow(
      'Vous avez déjà évalué'
    );
  });
  test('updateReview updates', async () => {
    jest.spyOn(mockPrisma.review, 'findFirst').mockResolvedValue(mRev);
    jest.spyOn(mockPrisma.review, 'update').mockResolvedValue({ ...mRev, title: 'Updated' });
    const r = await updateReview('u1', 'rev-1', { title: 'Updated' });
    expect(r.title).toBe('Updated');
  });
  test('getReviews returns paginated', async () => {
    jest.spyOn(mockPrisma.review, 'findMany').mockResolvedValue([mRev]);
    jest.spyOn(mockPrisma.review, 'count').mockResolvedValue(1);
    const r = await getReviews({ productId: 'prod-1' });
    expect(r.total).toBe(1);
  });
});
