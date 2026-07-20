import { mockPrisma } from '../setup';
import {
  follow,
  unfollow,
  getFollowers,
  getFollowing,
  getFollowCount,
  isFollowing,
} from '../../services/followService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({
  publishFollowed: jest.fn(),
  publishUnfollowed: jest.fn(),
}));

const mockBusiness = { id: 'b1', name: 'Biz', ownerId: 'owner-1', deletedAt: null };
const mockFollow = {
  id: 'flw-1',
  followerId: 'u1',
  businessId: 'b1',
  developerId: null,
  createdAt: new Date(),
};

describe('Follow Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('follow a business successfully', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBusiness as any);
    jest.spyOn(mockPrisma.follow, 'findUnique').mockResolvedValue(null);
    jest.spyOn(mockPrisma.follow, 'create').mockResolvedValue(mockFollow as any);
    const r = await follow('u1', { businessId: 'b1' });
    expect(r!.businessId).toBe('b1');
  });

  test('follow throws when business not found', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
    await expect(follow('u1', { businessId: 'b-x' })).rejects.toThrow('Business non trouvé');
  });

  test('follow throws when following self', async () => {
    const selfBiz = { ...mockBusiness, ownerId: 'u1' };
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(selfBiz as any);
    await expect(follow('u1', { businessId: 'b1' })).rejects.toThrow(
      'Vous ne pouvez pas vous suivre vous-même'
    );
  });

  test('follow throws when already following', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBusiness as any);
    jest.spyOn(mockPrisma.follow, 'findUnique').mockResolvedValue(mockFollow as any);
    await expect(follow('u1', { businessId: 'b1' })).rejects.toThrow(
      'Vous suivez déjà ce business'
    );
  });

  test('unfollow deletes follow', async () => {
    jest.spyOn(mockPrisma.follow, 'findUnique').mockResolvedValue(mockFollow as any);
    jest.spyOn(mockPrisma.follow, 'delete').mockResolvedValue(mockFollow as any);
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBusiness as any);
    const r = await unfollow('u1', 'flw-1');
    expect(r.message).toBe('Arrêté de suivre');
  });

  test('unfollow throws if not found', async () => {
    jest.spyOn(mockPrisma.follow, 'findUnique').mockResolvedValue(null);
    await expect(unfollow('u1', 'flw-x')).rejects.toThrow('Follow non trouvé');
  });

  test('unfollow throws if not authorized', async () => {
    jest
      .spyOn(mockPrisma.follow, 'findUnique')
      .mockResolvedValue({ ...mockFollow, followerId: 'other' } as any);
    await expect(unfollow('u1', 'flw-1')).rejects.toThrow('Non autorisé');
  });

  test('getFollowers returns paginated followers', async () => {
    const mockFollower = {
      id: 'flw-1',
      followerId: 'u1',
      businessId: 'b1',
      createdAt: new Date(),
      follower: { id: 'u1', firstName: 'Jean', lastName: 'Dupont', avatar: null },
    };
    jest.spyOn(mockPrisma.follow, 'findMany').mockResolvedValue([mockFollower as any]);
    jest.spyOn(mockPrisma.follow, 'count').mockResolvedValue(1);
    const r = await getFollowers('b1', 'business');
    expect(r.followers).toHaveLength(1);
    expect(r.total).toBe(1);
  });

  test('getFollowing returns paginated following', async () => {
    jest.spyOn(mockPrisma.follow, 'findMany').mockResolvedValue([
      {
        ...mockFollow,
        business: { id: 'b1', name: 'Biz', slug: 'biz', logo: null, type: 'RESTAURANT' },
        developer: null,
      } as any,
    ]);
    jest.spyOn(mockPrisma.follow, 'count').mockResolvedValue(1);
    const r = await getFollowing('u1');
    expect(r.items).toHaveLength(1);
  });

  test('getFollowCount returns count', async () => {
    jest.spyOn(mockPrisma.follow, 'count').mockResolvedValue(10);
    const r = await getFollowCount('b1', 'business');
    expect(r).toBe(10);
  });

  test('isFollowing returns true when following', async () => {
    jest.spyOn(mockPrisma.follow, 'findUnique').mockResolvedValue(mockFollow as any);
    const r = await isFollowing('u1', { businessId: 'b1' });
    expect(r.isFollowing).toBe(true);
  });

  test('isFollowing returns false when not following', async () => {
    jest.spyOn(mockPrisma.follow, 'findUnique').mockResolvedValue(null);
    const r = await isFollowing('u1', { businessId: 'b1' });
    expect(r.isFollowing).toBe(false);
  });
});
