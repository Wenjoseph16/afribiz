jest.mock('../../services/gamificationService', () => ({
  getActiveQuests: jest.fn(),
  getCompletedQuests: jest.fn(),
  initializeDailyQuests: jest.fn(),
  initializeWeeklyQuests: jest.fn(),
  getStreaks: jest.fn(),
  getMyRanking: jest.fn(),
  computeLeaderboard: jest.fn(),
  getActiveChallenges: jest.fn(),
  getGamificationDashboard: jest.fn(),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/gamificationController';
import * as gs from '../../services/gamificationService';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('gamification controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
  });

  describe('getMyQuests', () => {
    it('should return active quests', async () => {
      (gs.getActiveQuests as jest.Mock).mockResolvedValue([{ id: 'q1' }]);
      const res = mockRes();
      ctrl.getMyQuests(req(), res, jest.fn());
      await flush();
      expect(gs.getActiveQuests).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 'q1' }] });
    });

    it('should return 404 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getMyQuests(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('getMyCompletedQuests', () => {
    it('should return completed quests', async () => {
      (gs.getCompletedQuests as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getMyCompletedQuests(req(), res, jest.fn());
      await flush();
    });
  });

  describe('initializeQuests', () => {
    it('should initialize daily and weekly quests', async () => {
      (gs.initializeDailyQuests as jest.Mock).mockResolvedValue(undefined);
      (gs.initializeWeeklyQuests as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.initializeQuests(req(), res, jest.fn());
      await flush();
      expect(gs.initializeDailyQuests).toHaveBeenCalledWith('b1');
      expect(gs.initializeWeeklyQuests).toHaveBeenCalledWith('b1');
    });
  });

  describe('getMyStreaks', () => {
    it('should return streaks', async () => {
      (gs.getStreaks as jest.Mock).mockResolvedValue({ current: 5, longest: 10 });
      const res = mockRes();
      ctrl.getMyStreaks(req(), res, jest.fn());
      await flush();
    });
  });

  describe('getMyRanking', () => {
    it('should return ranking', async () => {
      (gs.getMyRanking as jest.Mock).mockResolvedValue({ rank: 3, total: 50 });
      const res = mockRes();
      ctrl.getMyRanking(req(), res, jest.fn());
      await flush();
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard with defaults', async () => {
      (gs.computeLeaderboard as jest.Mock).mockResolvedValue([{ rank: 1 }]);
      const res = mockRes();
      ctrl.getLeaderboard(req(), res, jest.fn());
      await flush();
      expect(gs.computeLeaderboard).toHaveBeenCalledWith('OVERALL', 'WEEKLY');
    });

    it('should accept custom params', async () => {
      (gs.computeLeaderboard as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getLeaderboard(req({ query: { category: 'SALES', period: 'MONTHLY' } }), res, jest.fn());
      await flush();
      expect(gs.computeLeaderboard).toHaveBeenCalledWith('SALES', 'MONTHLY');
    });
  });

  describe('getMyChallenges', () => {
    it('should return active challenges', async () => {
      (gs.getActiveChallenges as jest.Mock).mockResolvedValue([{ id: 'c1' }]);
      const res = mockRes();
      ctrl.getMyChallenges(req(), res, jest.fn());
      await flush();
    });
  });

  describe('getGamificationDashboard', () => {
    it('should return dashboard', async () => {
      (gs.getGamificationDashboard as jest.Mock).mockResolvedValue({ points: 1000, level: 5 });
      const res = mockRes();
      ctrl.getGamificationDashboard(req(), res, jest.fn());
      await flush();
    });

    it('should return 404 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getGamificationDashboard(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
