jest.mock('../../services/growthEngineService', () => ({
  getLatestBrief: jest.fn(),
  generateMorningBrief: jest.fn(),
  generateEveningSummary: jest.fn(),
  generateCalendarInsights: jest.fn(),
  getRecentBriefs: jest.fn(),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d, m?) => ({ success: true, data: d, ...(m ? { message: m } : {}) })),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/growthEngineController';
import * as ge from '../../services/growthEngineService';

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

describe('growthEngine controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
  });

  describe('getMorningBrief', () => {
    it("should return existing fresh brief (daté d'aujourd'hui)", async () => {
      (ge.getLatestBrief as jest.Mock).mockResolvedValue({
        id: 'b1',
        content: 'Brief',
        date: new Date(),
      });
      const res = mockRes();
      ctrl.getMorningBrief(req(), res, jest.fn());
      await flush();
      expect(ge.getLatestBrief).toHaveBeenCalledWith('b1', 'MORNING_BRIEF');
      expect(ge.generateMorningBrief).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ id: 'b1', content: 'Brief' }),
      });
    });

    it("should regenerate a stale brief (daté d'hier)", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      (ge.getLatestBrief as jest.Mock).mockResolvedValue({
        id: 'b1-old',
        content: 'Vieux brief',
        date: yesterday,
      });
      (ge.generateMorningBrief as jest.Mock).mockResolvedValue({ id: 'b2', content: 'New' });
      const res = mockRes();
      ctrl.getMorningBrief(req(), res, jest.fn());
      await flush();
      expect(ge.generateMorningBrief).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'b2', content: 'New' },
      });
    });

    it('should generate if no existing brief', async () => {
      (ge.getLatestBrief as jest.Mock).mockResolvedValue(null);
      (ge.generateMorningBrief as jest.Mock).mockResolvedValue({ id: 'b2', content: 'New' });
      const res = mockRes();
      ctrl.getMorningBrief(req(), res, jest.fn());
      await flush();
      expect(ge.generateMorningBrief).toHaveBeenCalledWith('b1');
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getMorningBrief({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getEveningSummary', () => {
    it('should return existing summary', async () => {
      (ge.getLatestBrief as jest.Mock).mockResolvedValue({ id: 's1' });
      const res = mockRes();
      ctrl.getEveningSummary(req(), res, jest.fn());
      await flush();
      expect(ge.getLatestBrief).toHaveBeenCalledWith('b1', 'EVENING_SUMMARY');
    });

    it('should generate if no summary', async () => {
      (ge.getLatestBrief as jest.Mock).mockResolvedValue(null);
      (ge.generateEveningSummary as jest.Mock).mockResolvedValue({ id: 's2' });
      const res = mockRes();
      ctrl.getEveningSummary(req(), res, jest.fn());
      await flush();
      expect(ge.generateEveningSummary).toHaveBeenCalledWith('b1');
    });
  });

  describe('generateBriefNow', () => {
    it('should generate morning brief', async () => {
      (ge.generateMorningBrief as jest.Mock).mockResolvedValue({ id: 'b1' });
      const res = mockRes();
      ctrl.generateBriefNow(req({ body: { type: 'MORNING_BRIEF' } }), res, jest.fn());
      await flush();
      expect(ge.generateMorningBrief).toHaveBeenCalled();
    });

    it('should generate evening summary', async () => {
      (ge.generateEveningSummary as jest.Mock).mockResolvedValue({ id: 's1' });
      const res = mockRes();
      ctrl.generateBriefNow(req({ body: { type: 'EVENING_SUMMARY' } }), res, jest.fn());
      await flush();
      expect(ge.generateEveningSummary).toHaveBeenCalled();
    });

    it('should return 400 if type missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.generateBriefNow(req({ body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 400 if type invalid', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.generateBriefNow(req({ body: { type: 'INVALID' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('getCalendarInsights', () => {
    it('should return insights', async () => {
      (ge.generateCalendarInsights as jest.Mock).mockResolvedValue({ events: [] });
      const res = mockRes();
      ctrl.getCalendarInsights(req(), res, jest.fn());
      await flush();
    });
  });

  describe('getRecentBriefs', () => {
    it('should return briefs with default days', async () => {
      (ge.getRecentBriefs as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getRecentBriefs(req(), res, jest.fn());
      await flush();
      expect(ge.getRecentBriefs).toHaveBeenCalledWith('b1', 7);
    });
  });
});
