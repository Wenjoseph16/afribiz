import { mockPrisma } from '../setup';
import {
  getActiveQuests,
  getCompletedQuests,
  getActiveChallenges,
  getGamificationDashboard,
  updateStreak,
  getStreaks,
  computeLeaderboard,
  getMyRanking,
} from '../../services/gamificationService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe('Gamification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getActiveQuests returns quests', async () => {
    mockPrisma.quest.findMany.mockResolvedValue([
      { id: 'q-1', businessId: 'b1', title: 'Premier client', points: 100 } as any,
    ]);
    const r = await getActiveQuests('b1');
    expect(r).toHaveLength(1);
  });

  test('getCompletedQuests returns completed quests', async () => {
    mockPrisma.quest.findMany.mockResolvedValue([
      {
        id: 'q-1',
        businessId: 'b1',
        title: 'Premier client',
        points: 100,
        completedAt: new Date(),
      } as any,
    ]);
    const r = await getCompletedQuests('b1');
    expect(r).toHaveLength(1);
  });

  test('getActiveChallenges returns challenges', async () => {
    mockPrisma.challenge.findMany.mockResolvedValue([
      { id: 'c-1', businessId: 'b1', title: 'Défi 30 jours', points: 500 } as any,
    ]);
    const r = await getActiveChallenges('b1');
    expect(r).toHaveLength(1);
  });

  test('getGamificationDashboard returns dashboard', async () => {
    mockPrisma.quest.findMany.mockResolvedValue([]);
    mockPrisma.challenge.findMany.mockResolvedValue([]);
    mockPrisma.businessScore.findUnique.mockResolvedValue(null);
    mockPrisma.streak.findMany.mockResolvedValue([]);
    const r = await getGamificationDashboard('b1');
    expect(r).toBeDefined();
  });

  test('updateStreak updates streak', async () => {
    mockPrisma.streak.findUnique.mockResolvedValue({
      id: 's-1',
      businessId: 'b1',
      currentStreak: 3,
      longestStreak: 5,
      lastActivityDate: new Date(Date.now() - 86400000),
      type: 'DAILY',
      updatedAt: new Date(),
    } as any);
    mockPrisma.streak.upsert.mockResolvedValue({} as any);
    // updateStreak(businessId, type) - takes 2 args
    const r = await updateStreak('b1', 'DAILY');
    expect(r).toBeDefined();
  });

  test('getStreaks returns streaks', async () => {
    mockPrisma.streak.findMany.mockResolvedValue([
      { id: 's-1', businessId: 'b1', currentStreak: 3, type: 'DAILY' } as any,
    ]);
    const r = await getStreaks('b1');
    expect(r).toHaveLength(1);
  });

  test('computeLeaderboard computes rankings', async () => {
    mockPrisma.businessScore.findMany.mockResolvedValue([
      { businessId: 'b1', score: 100, business: { name: 'Biz1' } } as any,
    ]);
    const r = await computeLeaderboard('OVERALL', 'WEEKLY');
    expect(r).toBeDefined();
  });

  test('getMyRanking returns ranking', async () => {
    mockPrisma.businessScore.findUnique.mockResolvedValue({ businessId: 'b1', score: 100 } as any);
    mockPrisma.businessScore.count.mockResolvedValue(5);
    const r = await getMyRanking('b1');
    expect(r).toBeDefined();
  });
});
